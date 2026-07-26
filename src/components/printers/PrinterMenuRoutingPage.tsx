import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  LoaderCircle,
  Printer,
  Save,
  Search,
} from 'lucide-react';
import { useERPStore } from '../../stores/erp.store';

export function PrinterMenuRoutingPage() {
  const {
    printerMappingPrinterId,
    printers,
    categories,
    menuItems,
    fetchPrinters,
    fetchMenuData,
    updateMenuItem,
    closePrinterRouting,
    currentBranch,
  } = useERPStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedPrinter = useMemo(
    () => printers.find((printer) => printer._id === printerMappingPrinterId) || null,
    [printers, printerMappingPrinterId]
  );

  const currentBranchId = currentBranch?._id;

  useEffect(() => {
    fetchPrinters(currentBranchId);
    fetchMenuData(currentBranchId);
  }, [fetchPrinters, fetchMenuData, currentBranchId]);

  useEffect(() => {
    if (!selectedPrinter) return;
    setSelectedItemIds(
      menuItems
        .filter((item) => item.printerId === selectedPrinter._id)
        .map((item) => item._id)
    );
  }, [menuItems, selectedPrinter]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const categorySections = useMemo(() => {
    const orderedCategories = [...categories].sort(
      (a, b) => (a.displayOrder || a.sortOrder || 0) - (b.displayOrder || b.sortOrder || 0)
    );

    const visibleItems = menuItems.filter((item) => {
      if (!normalizedSearch) return true;
      const categoryName = categories.find((category) => category._id === item.categoryId)?.name || '';
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        categoryName.toLowerCase().includes(normalizedSearch)
      );
    });

    const grouped = orderedCategories
      .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.categoryId === category._id),
      }))
      .filter((group) => group.items.length > 0);

    const uncategorizedItems = visibleItems.filter(
      (item) => !orderedCategories.some((category) => category._id === item.categoryId)
    );

    if (uncategorizedItems.length > 0) {
      grouped.push({
        category: { _id: 'uncategorized', name: 'Uncategorized' },
        items: uncategorizedItems,
      });
    }

    return grouped;
  }, [categories, menuItems, normalizedSearch]);

  if (!selectedPrinter) {
    return (
      <div className="flex-1 p-6 bg-slate-100">
        <div className="h-full rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center px-6">
          <Printer className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-black text-slate-900">Printer not found</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Pick a KOT printer from the printer hub and use the edit icon to open dish routing.
          </p>
          <button
            onClick={closePrinterRouting}
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (selectedPrinter.duty === 'RECEIPT') {
    return (
      <div className="flex-1 p-6 bg-slate-100">
        <div className="h-full rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center px-6">
          <Printer className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-black text-slate-900">Receipt printers do not need dish mapping</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-lg">
            This printer is configured as <strong>Receipt Only</strong>, so it will respond only during settlement and receipt printing.
          </p>
          <button
            onClick={closePrinterRouting}
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedSet = new Set(selectedItemIds);
  const assignedCount = selectedItemIds.length;
  const totalVisibleItems = categorySections.reduce((total, group) => total + group.items.length, 0);

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
    setSaveMessage(null);
  };

  const toggleCategory = (itemIds: string[]) => {
    const allSelected = itemIds.every((itemId) => selectedSet.has(itemId));
    setSelectedItemIds((current) => {
      const currentSet = new Set(current);
      if (allSelected) {
        itemIds.forEach((itemId) => currentSet.delete(itemId));
      } else {
        itemIds.forEach((itemId) => currentSet.add(itemId));
      }
      return Array.from(currentSet);
    });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updates = menuItems.flatMap((item) => {
        const isSelected = selectedSet.has(item._id);
        if (isSelected && item.printerId !== selectedPrinter._id) {
          return [updateMenuItem(item._id, { printerId: selectedPrinter._id })];
        }
        if (!isSelected && item.printerId === selectedPrinter._id) {
          return [updateMenuItem(item._id, { printerId: '' as any })];
        }
        return [];
      });

      await Promise.all(updates);
      setSaveMessage('Dish routing saved for this printer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        
        {/* Compact Sticky Header */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={closePrinterRouting}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-500" />
                {selectedPrinter.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">{assignedCount} dishes mapped out of {totalVisibleItems}</p>
            </div>
          </div>

          <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                <CheckSquare className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Compact Grid Layout for Categories */}
        {categorySections.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No dishes match your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
            {categorySections.map(({ category, items }) => {
              const categoryItemIds = items.map((item) => item._id);
              const assignedInCategory = categoryItemIds.filter((itemId) => selectedSet.has(itemId)).length;
              const allSelected = assignedInCategory === categoryItemIds.length;

              return (
                <div key={category._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col max-h-[400px]">
                  <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      {category.name} 
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                        {assignedInCategory}/{items.length}
                      </span>
                    </h2>
                    <button 
                      onClick={() => toggleCategory(categoryItemIds)} 
                      className="text-xs font-bold text-amber-600 hover:text-amber-700"
                    >
                      {allSelected ? 'Uncheck All' : 'Check All'}
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-y-auto">
                    {items.map(item => {
                      const isChecked = selectedSet.has(item._id);
                      return (
                        <label 
                          key={item._id} 
                          className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${isChecked ? 'bg-amber-50/30' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => toggleItem(item._id)} 
                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" 
                          />
                          <span className={`text-sm font-semibold flex-1 truncate ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                            {item.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
