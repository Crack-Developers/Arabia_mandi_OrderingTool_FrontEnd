import React, { useState, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { UtensilsCrossed, Plus, CheckCircle2, XCircle, Tag, Printer as PrinterIcon, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export const MenuManager: React.FC = () => {
  const {
    menuItems,
    categories,
    printers,
    fetchPrinters,
    fetchMenuData,
    toggleMenuItemAvailability,
    addMenuItem,
    addCategory,
    branchFilterId,
    currentBranch,
  } = useERPStore();

  const resolvedBranchId = branchFilterId === 'ALL' ? undefined : branchFilterId;

  useEffect(() => {
    fetchPrinters(resolvedBranchId);
    fetchMenuData(resolvedBranchId);
  }, [fetchPrinters, fetchMenuData, resolvedBranchId]);

  const activeCategories = categories || [];

  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // New item form
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [core, setCore] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [basePrice, setBasePrice] = useState('450');
  const [taxRate, setTaxRate] = useState('5');
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([]);

  const matchingCategories = activeCategories
    .filter((c) =>
      c.name.toLowerCase().includes(categoryName.trim().toLowerCase())
    )
    .slice(-5);

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'price', value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Generate unique category names (case-insensitive, only showing categories that have items)
  const uniqueCategoryNames = Array.from(new Set([
    ...menuItems.map(item => {
      const itemCatId = typeof item.categoryId === 'string' ? item.categoryId : (item.categoryId as any)?._id || String(item.categoryId);
      return (item.categoryName || activeCategories.find(c => String(c._id) === itemCatId)?.name || 'Uncategorized').trim().toLowerCase();
    })
  ])).sort();

  const filteredItems = menuItems.filter((item) => {
    const itemCatId = typeof item.categoryId === 'string' ? item.categoryId : (item.categoryId as any)?._id || String(item.categoryId);
    const catName = (item.categoryName || activeCategories.find((c) => String(c._id) === itemCatId)?.name || 'Uncategorized').trim().toLowerCase();
    return selectedCat === 'ALL' || itemCatId === selectedCat || catName === selectedCat;
  });

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryName.trim()) return;

    let matchedCat = activeCategories.find(
      (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (!matchedCat) {
      matchedCat = await addCategory(categoryName.trim());
    }

    const effCategoryId = matchedCat?._id || activeCategories[0]?._id;
    
    let effVariants: { name: string; price: number }[] = [];
    if (variants.length === 0) {
      effVariants = [{ name: 'Standard / Base', price: parseFloat(basePrice) || 0 }];
    } else {
      const validVariants = variants
        .filter((v) => v.name.trim() || v.price.trim())
        .map((v) => ({
          name: v.name.trim() || 'Custom Portion',
          price: parseFloat(v.price) || parseFloat(basePrice) || 0,
        }));
      effVariants = validVariants.length > 0 ? validVariants : [{ name: 'Standard / Base', price: parseFloat(basePrice) || 0 }];
    }

    addMenuItem({
      name: name.trim(),
      description: '',
      categoryId: effCategoryId,
      available: true,
      active: true,
      taxRate: parseFloat(taxRate) || 0,
      variants: effVariants,
      addons: [],
      core: core.trim() !== '' ? parseInt(core, 10) : undefined,
    });

    setName('');
    setBasePrice('450');
    setTaxRate('5');
    setCore('');
    setVariants([]);
    setShowAddModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      let successCount = 0;

      for (const row of jsonData) {
        const lowerRow: any = {};
        Object.keys(row).forEach(k => {
          lowerRow[k.trim().toLowerCase()] = row[k];
        });

        const dishName = lowerRow['dish name'] || lowerRow['name'] || lowerRow['dish'];
        const category = lowerRow['category'] || lowerRow['category name'];
        const price = parseFloat(lowerRow['price'] || lowerRow['prices'] || lowerRow['base price'] || '0');
        const tax = parseFloat(lowerRow['tax'] || lowerRow['tax rate'] || '0');
        const coreVal = lowerRow['core'];
        const core = coreVal !== undefined && coreVal !== null && coreVal !== '' ? parseInt(coreVal, 10) : undefined;

        if (!dishName || !category) continue;

        let matchedCat = activeCategories.find(
          (c) => c.name.trim().toLowerCase() === String(category).trim().toLowerCase()
        );

        if (!matchedCat) {
          try {
            matchedCat = await addCategory(String(category).trim());
          } catch(err) {
            console.error("Failed to add category from Excel", err);
          }
        }

        const effCategoryId = matchedCat ? String(matchedCat._id || matchedCat) : (activeCategories[0]?._id || 'cat-1');

        await addMenuItem({
          name: String(dishName).trim(),
          description: 'Uploaded from Excel',
          categoryId: effCategoryId,
          available: true,
          active: true,
          taxRate: isNaN(tax) ? 0 : tax,
          variants: [{ name: 'Standard / Base', price: isNaN(price) ? 0 : price }],
          addons: [],
          core: isNaN(core as any) ? undefined : core,
        });
        successCount++;
      }

      toast.success(`Successfully uploaded ${successCount} dishes!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse Excel file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-600" />
            <span>Arabian Mandi – Menu & Price Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Managing dishes for <strong className="text-slate-800">{currentBranch.name}</strong>. Toggle item availability instantly for reception billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-200" />
            <span>Upload Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Mandi Dish</span>
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCat('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCat === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Categories ({menuItems.length})
        </button>
        {uniqueCategoryNames.map((catName) => (
          <button
            key={catName}
            onClick={() => setSelectedCat(catName)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCat === catName
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {catName}
          </button>
        ))}
      </div>

      {/* Menu Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Dish Name</th>
              <th className="py-3.5 px-5">Category</th>
              <th className="py-3.5 px-5">Assigned KOT Printer</th>
              <th className="py-3.5 px-5">Portions & Prices</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Instant Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.map((item) => {
              const itemCatId = typeof item.categoryId === 'string' ? item.categoryId : (item.categoryId as any)?._id || String(item.categoryId);
              const catName =
                (item.categoryName || activeCategories.find((c) => String(c._id) === itemCatId)?.name || 'Uncategorized').trim().toLowerCase();
              const assignedPrinter = printers?.find((p) => p._id === item.printerId);
              return (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {item.name}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      <Tag className="w-3 h-3 text-amber-600" />
                      {catName}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {assignedPrinter ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200/60 text-[11px]">
                        <PrinterIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{assignedPrinter.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">({assignedPrinter.ip || 'USB'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-[11px]">
                        <PrinterIcon className="w-3.5 h-3.5 text-slate-400" />
                        Default Kitchen Printer
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      {item.variants && item.variants.length > 0 ? (
                        item.variants.map((v, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 text-slate-700">
                            <span className="font-medium text-slate-600">{v.name}</span>
                            <span className="font-extrabold text-slate-900">₹{v.price}</span>
                          </div>
                        ))
                      ) : (
                        <span className="font-extrabold text-slate-900">₹0</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {item.available ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-bold text-xs border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock (Available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 font-bold text-xs border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        Sold Out / Unavailable
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => toggleMenuItemAvailability(item._id)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        item.available
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {item.available ? 'Mark Out of Stock' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                <span>Add New Mandi Dish</span>
              </h3>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Arabian Zurbian Lamb Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="Type or pick category (e.g., Mandi Meat Platters)"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showSuggestions && matchingCategories.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 bg-slate-50 uppercase tracking-wider">
                      Suggestions
                    </div>
                    {matchingCategories.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setCategoryName(c.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between border-t border-slate-100 first:border-0 cursor-pointer"
                      >
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Pick</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core */}
              <div>
                <label className="block text-xs font-bold text-slate-700">Core
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(optional – integer)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 1"
                  value={core}
                  onChange={(e) => setCore(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>



              <div>
                <label className="block text-xs font-bold text-slate-700">Tax Rate (%)</label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. 5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Price & Custom Portion Builder */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Base Price / Standard Price (₹)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Portion / Size (Half, Quarter)</span>
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="450"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Single standard price. Click <strong className="text-slate-600 font-bold">+ Add Portion / Size</strong> above if this dish has Half, Quarter, or Family Pack options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      ✓ Custom portion mode active. Define your sizes and their exact prices below:
                    </p>
                    {variants.map((v, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Portion Name (e.g. Half, Quarter, Family Pack)"
                          value={v.name}
                          onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={v.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full pl-7 pr-2.5 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          title="Remove Portion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

