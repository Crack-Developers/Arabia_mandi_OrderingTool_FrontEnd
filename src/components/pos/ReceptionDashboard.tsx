import React, { useState, useRef, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { MenuItem } from '../../types/erp.types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  GitMerge,
  CalendarCheck,
  Check,
  CheckCircle2,
  Utensils,
  XCircle,
  ArrowLeft,
  LayoutGrid,
  Edit3,
  ChevronDown,
  Printer,
  BookmarkCheck,
} from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const {
    currentBranch,
    tables,
    sections,
    selectedTableId,
    setSelectedTable,
    categories,
    selectedCategory,
    setSelectedCategory,
    menuItems,
    addMenuItem,
    searchQuery,
    setSearchQuery,
    activeOrders,
    addItemToOrder,
    updateOrderItemQty,
    removeOrderItem,
    generateKOT,
    settleOrder,
    isSettling,
    settlementError,
    settlementSuccess,
    openReservationModal,
    openMergeModal,
    separateTables,
    posViewMode = 'TABLES',
    setPosViewMode,
    updateTableDetails,
    showLiveOrdersOnly,
  } = useERPStore();

  const displaySections =
    currentBranch?.sections && currentBranch.sections.length > 0
      ? currentBranch.sections.map((sec, idx) => ({
          _id: `sec-${idx + 1}`,
          name: sec.name,
          floor: sec.floor || 'Ground Floor',
        }))
      : sections.map((sec) => ({
          _id: sec._id,
          name: sec.name,
          floor: (sec as any).floor || 'Ground Floor',
        }));

  const [selectedSectionId] = useState<string>('ALL');
  const [kotDropdownOpen, setKotDropdownOpen] = useState<boolean>(false);
  const kotDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kotDropdownRef.current && !kotDropdownRef.current.contains(event.target as Node)) {
        setKotDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const viewMode = posViewMode;
  const setViewMode = (mode: 'TABLES' | 'ORDERING') => setPosViewMode(mode);

  const [editingTableModal, setEditingTableModal] = useState<{
    isOpen: boolean;
    tableId: string;
    currentName: string;
    currentCapacity: number;
    focusField?: 'name' | 'capacity';
  }>({ isOpen: false, tableId: '', currentName: '', currentCapacity: 4 });

  const clickTimerRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  const handleTableCardClick = (tableId: string) => {
    if (clickTimerRef.current[tableId]) {
      clearTimeout(clickTimerRef.current[tableId]);
      delete clickTimerRef.current[tableId];
      return;
    }
    clickTimerRef.current[tableId] = setTimeout(() => {
      delete clickTimerRef.current[tableId];
      setSelectedTable(tableId);
      setViewMode('ORDERING');
    }, 220);
  };

  // Quick Add Dish shortcut state (directly inside current category)
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickAddCatId, setQuickAddCatId] = useState<string>('');
  const [quickDishName, setQuickDishName] = useState<string>('');
  const [quickDishPrice, setQuickDishPrice] = useState<string>('450');
  const [quickDishTax, setQuickDishTax] = useState<string>('5');
  const [quickDishCore, setQuickDishCore] = useState<string>('');
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  const handleQuickCreateOrEditDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDishName.trim()) return;
    if (editingDishId) {
      useERPStore.getState().updateMenuItem(editingDishId, {
        name: quickDishName.trim(),
        taxRate: parseFloat(quickDishTax) || 0,
        core: quickDishCore.trim() !== '' ? parseInt(quickDishCore, 10) : undefined,
        variants: [{ name: 'Standard / Base', price: parseFloat(quickDishPrice) || 0 }],
      });
    } else {
      const targetCatId =
        quickAddCatId ||
        (selectedCategory !== 'ALL' ? selectedCategory : categories[0]?._id || 'cat-1');

      addMenuItem({
        name: quickDishName.trim(),
        description: 'Quick added dish from POS shortcut',
        categoryId: targetCatId,
        available: true,
        active: true,
        taxRate: parseFloat(quickDishTax) || 0,
        core: quickDishCore.trim() !== '' ? parseInt(quickDishCore, 10) : undefined,
        variants: [{ name: 'Standard / Base', price: parseFloat(quickDishPrice) || 0 }],
        addons: [],
      });
    }

    setQuickDishName('');
    setQuickDishPrice('450');
    setQuickDishTax('5');
    setQuickDishCore('');
    setEditingDishId(null);
    setShowQuickAddModal(false);
  };

  // Variant & Addon modal helper state when clicking a menu item
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'UPI' | 'Cash' | 'Card' | 'Part'>('UPI');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [upiAmount, setUpiAmount] = useState<string>('');

  // Payment method for direct settlement (no modal)
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');

  const selectedTable = tables.find((t) => t._id === selectedTableId) || tables[0];
  const activeOrder = selectedTableId ? activeOrders[selectedTableId] : undefined;

  // Filter tables for current branch and section
  const branchTables = tables.filter(
    (t) => !currentBranch?._id || t.branchId === currentBranch._id || !t.branchId
  );
  const filteredTables = branchTables.filter((t) => {
    // 1. Live Orders check
    if (showLiveOrdersOnly) {
      const hasOrder = !!activeOrders[t._id] && activeOrders[t._id].total > 0;
      const orderStatus = activeOrders[t._id]?.status;
      const effectiveStatus = t.status === 'Hold' || orderStatus === 'Hold' || (hasOrder && t.status === 'Available')
        ? 'Hold'
        : t.status;
        
      if (effectiveStatus === 'Available') return false;
    }

    // 2. Section check
    if (selectedSectionId === 'ALL') return true;
    const selectedSec = displaySections.find((s) => s._id === selectedSectionId);
    const secDoc = sections.find((s) => s._id === t.sectionId || String(s._id) === String(t.sectionId));
    const tSecName = (secDoc?.name || (t as any).sectionName || '').trim().toLowerCase();
    const dsName = (selectedSec?.name || '').trim().toLowerCase();
    return (
      t.sectionId === selectedSectionId ||
      String(t.sectionId) === String(selectedSectionId) ||
      (selectedSec && tSecName === dsName)
    );
  });

  const groupedFloorSections = (() => {
    const groups: Array<{
      id: string;
      title: string;
      floor: string;
      prefix: string;
      tables: typeof filteredTables;
    }> = [];

    if (selectedSectionId === 'ALL') {
      for (const sec of displaySections) {
        const secTables = filteredTables.filter((t) => {
          const secDoc = sections.find((s) => s._id === t.sectionId || String(s._id) === String(t.sectionId));
          const tSecName = (secDoc?.name || (t as any).sectionName || '').trim().toLowerCase();
          const dsName = (sec.name || '').trim().toLowerCase();
          return (
            t.sectionId === sec._id ||
            String(t.sectionId) === String(sec._id) ||
            tSecName === dsName
          );
        });
        if (secTables.length > 0) {
          const prefixMap = new Map<string, typeof filteredTables>();
          for (const t of secTables) {
            const match = t.tableNumber.match(/^([A-Z0-9]+(?:\s+T-|-|T-|\s+))/i);
            const prefixKey = match ? match[1].trim() : sec.name;
            if (!prefixMap.has(prefixKey)) prefixMap.set(prefixKey, []);
            prefixMap.get(prefixKey)!.push(t);
          }
          if (prefixMap.size > 1) {
            prefixMap.forEach((tbls, pref) => {
              groups.push({
                id: `${sec._id}-${pref}`,
                title: `${sec.name} (${pref})`,
                floor: sec.floor || 'Floor',
                prefix: pref,
                tables: tbls,
              });
            });
          } else {
            groups.push({
              id: sec._id,
              title: sec.name,
              floor: sec.floor || 'Floor',
              prefix: '',
              tables: secTables,
            });
          }
        }
      }

      const assignedIds = new Set(groups.flatMap((g) => g.tables.map((t) => t._id)));
      const unassigned = filteredTables.filter((t) => !assignedIds.has(t._id));
      if (unassigned.length > 0) {
        const prefixMap = new Map<string, typeof filteredTables>();
        for (const t of unassigned) {
          const secDoc = sections.find((s) => s._id === t.sectionId || String(s._id) === String(t.sectionId));
          const tSecName = secDoc?.name || (t as any).sectionName;
          const match = t.tableNumber.match(/^([A-Z0-9]+(?:\s+T-|-|T-|\s+))/i);
          let prefixKey = match ? match[1].trim() : (tSecName || 'General Area');
          if (!prefixMap.has(prefixKey)) prefixMap.set(prefixKey, []);
          prefixMap.get(prefixKey)!.push(t);
        }

        prefixMap.forEach((tbls, pref) => {
          const firstTbl = tbls[0];
          const secDoc = sections.find((s) => s._id === firstTbl.sectionId || String(s._id) === String(firstTbl.sectionId));
          const tSecName = secDoc?.name || (firstTbl as any).sectionName || pref;
          let inferredFloor = secDoc?.floor || 'General Area';
          if (pref.includes('DIN') || pref.includes('1T')) inferredFloor = 'First Floor';
          else if (pref.includes('G T') || pref.includes('main')) inferredFloor = 'Ground Floor';
          else if (pref.includes('2T')) inferredFloor = 'Second Floor';
          else if (pref.includes('PAR') || pref.includes('VIP')) inferredFloor = 'Party / VIP Floor';

          groups.push({
            id: `unassigned-${pref}`,
            title: tSecName && tSecName !== pref ? `${tSecName} (${pref})` : `${pref} Tables`,
            floor: inferredFloor,
            prefix: pref,
            tables: tbls,
          });
        });
      }
    } else {
      const selectedSec = displaySections.find((s) => s._id === selectedSectionId) || {
        _id: selectedSectionId,
        name: 'Dining Section',
        floor: 'Selected Floor',
      };
      const prefixMap = new Map<string, typeof filteredTables>();
      for (const t of filteredTables) {
        const match = t.tableNumber.match(/^([A-Z0-9]+(?:\s+T-|-|T-|\s+))/i);
        const prefixKey = match ? match[1].trim() : selectedSec.name;
        if (!prefixMap.has(prefixKey)) prefixMap.set(prefixKey, []);
        prefixMap.get(prefixKey)!.push(t);
      }
      if (prefixMap.size > 1) {
        prefixMap.forEach((tbls, pref) => {
          groups.push({
            id: `${selectedSec._id}-${pref}`,
            title: `${selectedSec.name} (${pref})`,
            floor: selectedSec.floor || 'Floor',
            prefix: pref,
            tables: tbls,
          });
        });
      } else {
        groups.push({
          id: selectedSec._id,
          title: selectedSec.name,
          floor: selectedSec.floor || 'Floor',
          prefix: '',
          tables: filteredTables,
        });
      }
    }
    return groups;
  })();

  // Filter menu
  const filteredMenu = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Group filtered menu by category
  const groupedMenu = filteredMenu.reduce((acc, item) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = [];
    }
    acc[item.categoryId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/25';
      case 'Occupied':
        return 'bg-red-500/15 text-red-700 border-red-500/40 hover:bg-red-500/25';
      case 'Reserved':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/40 hover:bg-amber-500/25';
      case 'Billing':
        return 'bg-blue-500/15 text-blue-700 border-blue-500/40 hover:bg-blue-500/25';
      case 'Merged':
        return 'bg-purple-500/15 text-purple-700 border-purple-500/40 hover:bg-purple-500/25';
      case 'Hold':
        return 'bg-orange-500/20 text-orange-800 border-orange-500/50 hover:bg-orange-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'Occupied':
        return 'bg-red-500';
      case 'Reserved':
        return 'bg-amber-500';
      case 'Billing':
        return 'bg-blue-500';
      case 'Merged':
        return 'bg-purple-500';
      case 'Hold':
        return 'bg-orange-500';
      default:
        return 'bg-slate-400';
    }
  };

  const handleOpenItemBuilder = (item: MenuItem) => {
    const variantsCount = item.variants?.length || 0;
    const addonsCount = item.addons?.length || 0;
    if (variantsCount <= 1 && addonsCount === 0) {
      // Instant add if single variant & no optional addons
      addItemToOrder(item, 0, [], '');
    } else {
      setActiveItemModal(item);
      setSelectedVariantIdx(0);
      setSelectedAddonNames([]);
      setItemNote('');
    }
  };

  const handleConfirmItemAdd = () => {
    if (!activeItemModal) return;
    const chosenAddons = activeItemModal.addons.filter((a) =>
      selectedAddonNames.includes(a.name)
    );
    addItemToOrder(activeItemModal, selectedVariantIdx, chosenAddons, itemNote);
    setActiveItemModal(null);
  };

  const toggleAddonSelection = (addonName: string) => {
    setSelectedAddonNames((prev) =>
      prev.includes(addonName) ? prev.filter((a) => a !== addonName) : [...prev, addonName]
    );
  };

  const handleOpenPayment = () => {
    if (!activeOrder) return;
    setPaymentTab('UPI');
    setUpiAmount(activeOrder.total.toString());
    setCashAmount('0');
    setCardAmount('0');
    setPaymentModalOpen(true);
  };

  const handlePaymentTabChange = (tab: 'UPI' | 'Cash' | 'Card' | 'Part') => {
    if (!activeOrder) return;
    setPaymentTab(tab);
    if (tab === 'UPI') {
      setUpiAmount(activeOrder.total.toString());
      setCashAmount('0');
      setCardAmount('0');
    } else if (tab === 'Cash') {
      setCashAmount(activeOrder.total.toString());
      setUpiAmount('0');
      setCardAmount('0');
    } else if (tab === 'Card') {
      setCardAmount(activeOrder.total.toString());
      setCashAmount('0');
      setUpiAmount('0');
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeOrder || isSettling) return;
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const upi  = parseFloat(upiAmount)  || 0;
    if (cash + card + upi < activeOrder.total - 0.01) return;

    setPaymentModalOpen(false);
    // settleOrder handles syncLocal → generateBill → processPayment atomically
    await settleOrder({ cash, card, upi });
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-full min-h-0 overflow-hidden bg-slate-100 select-none">

      {/* ── Settlement Success Toast ── */}
      {settlementSuccess && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 animate-fade-in">
          <span className="text-xl">✓</span>
          <span className="text-sm font-semibold">{settlementSuccess}</span>
          <button
            onClick={() => useERPStore.setState({ settlementSuccess: null })}
            className="ml-2 text-white/70 hover:text-white text-base font-bold cursor-pointer"
          >✕</button>
        </div>
      )}

      {/* ── Settlement Error Toast ── */}
      {settlementError && !activeOrder && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-600 text-white shadow-2xl shadow-red-900/30 animate-fade-in">
          <span className="text-xl">✕</span>
          <span className="text-sm font-semibold">{settlementError}</span>
          <button
            onClick={() => useERPStore.setState({ settlementError: null })}
            className="ml-2 text-white/70 hover:text-white text-base font-bold cursor-pointer"
          >✕</button>
        </div>
      )}
      {/* =========================================================================
          VIEW MODE 1: TABLES LAYOUT OVERVIEW (Full Screen when entering POS)
      ========================================================================= */}
      {viewMode === 'TABLES' ? (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-100">
          {/* Top Bar */}
          <div className="px-3 py-1 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <LayoutGrid className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-bold text-slate-900 tracking-tight">
                    POS Tables Layout
                  </h1>
                  <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {branchTables.length} Total
                  </span>
                </div>
              </div>

              {/* Center: Quick-Jump Floor/Section Scroll Navigation */}
              {groupedFloorSections.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar flex-1 max-w-2xl">
                  {groupedFloorSections.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        const el = document.getElementById(`floor-section-${group.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-amber-50 hover:border-amber-400 border border-slate-200 text-slate-700 hover:text-amber-900 font-bold text-[11px] transition-all whitespace-nowrap shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                      title={`Click to jump down to ${group.title}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{group.title}</span>
                      {group.floor && group.floor !== 'Floor' && group.floor !== 'Selected Floor' && group.floor !== 'General Area' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 font-semibold border border-slate-200/80">
                          {group.floor}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Status Legend */}
              <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Billing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>On Hold</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Grid or Full-Screen Wide Empty Canvas */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col w-full">
            {filteredTables.length === 0 ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-16 bg-white border-t border-slate-200/80 relative overflow-hidden group">
                {/* Decorative ambient background glows */}
                <div className="absolute -right-32 -top-32 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-32 -bottom-32 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-sm mb-6 transition-transform group-hover:scale-105 duration-300 z-10">
                  <Utensils className="w-10 h-10" />
                </div>
                
                <div className="max-w-3xl mx-auto space-y-3 z-10 px-4">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {showLiveOrdersOnly ? 'No Live Orders Currently' : 'No Dining Tables Configured Yet'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
                    {showLiveOrdersOnly
                      ? 'All tables are currently available. There are no active orders or occupied tables right now.'
                      : 'There are currently no dining tables initialized inside your POS branch or the selected section. You can set up exact table arrangements, seating capacities, and sections tailored directly to your Arabian Mandi restaurant layout.'}
                  </p>
                </div>

                {!showLiveOrdersOnly && (
                  <div className="mt-8 z-10 w-full max-w-2xl px-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center gap-3 text-amber-900 shadow-2xs">
                      <span className="text-xl">💡</span>
                      <span className="text-xs sm:text-sm font-bold tracking-wide">
                        Tip: Navigate to <span className="underline decoration-amber-500 font-black">Tables</span> (or Table Management) from the sidebar navigation to create dining tables (e.g. Dining Hall T-01, Majlis M-01).
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-4 content-start w-full">
                {groupedFloorSections.map((group) => (
                  <div key={group.id} id={`floor-section-${group.id}`} className="w-full scroll-mt-12">
                    {/* Compact Section/Floor Header Banner */}
                    {groupedFloorSections.length > 0 && (
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                            <LayoutGrid className="w-2.5 h-2.5" />
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight">
                            {group.title}
                          </h4>
                          <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300/50 px-1 py-0.2 rounded">
                            {group.floor}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                          {group.tables.length} {group.tables.length === 1 ? 'Table' : 'Tables'}
                        </span>
                      </div>
                    )}

                    {/* Tables Grid for this Floor/Section */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-1.5 content-start w-full">
                      {group.tables.map((table) => {
                        const hasOrder = !!activeOrders[table._id] && activeOrders[table._id].total > 0;
                        const orderStatus = activeOrders[table._id]?.status;
                        const effectiveStatus = table.status === 'Hold' || orderStatus === 'Hold' || (hasOrder && table.status === 'Available')
                          ? 'Hold'
                          : table.status;
                        return (
                          <div
                            key={table._id}
                            onClick={() => handleTableCardClick(table._id)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (clickTimerRef.current[table._id]) {
                                clearTimeout(clickTimerRef.current[table._id]);
                                delete clickTimerRef.current[table._id];
                              }
                              setEditingTableModal({ isOpen: true, tableId: table._id, currentName: table.tableNumber, currentCapacity: table.capacity || 4, focusField: 'name' });
                            }}
                            title="Single click to order/bill | Double click anywhere on card to rename table or change seats"
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between min-h-[52px] shadow-2xs hover:shadow-md group ${getStatusColor(
                              effectiveStatus
                            )}`}
                          >
                            {/* Top Bar */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(effectiveStatus)}`} />
                                <span
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (clickTimerRef.current[table._id]) {
                                      clearTimeout(clickTimerRef.current[table._id]);
                                      delete clickTimerRef.current[table._id];
                                    }
                                    setEditingTableModal({ isOpen: true, tableId: table._id, currentName: table.tableNumber, currentCapacity: table.capacity || 4, focusField: 'name' });
                                  }}
                                  className="font-black text-[11px] sm:text-xs tracking-tight hover:underline flex items-center gap-0.5 truncate"
                                  title="Double click to rename table"
                                >
                                  <span className="truncate">{table.tableNumber}</span>
                                  <Edit3 className="w-2 h-2 opacity-0 group-hover:opacity-70 text-slate-700 shrink-0 transition-opacity" />
                                </span>
                              </div>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (clickTimerRef.current[table._id]) {
                                    clearTimeout(clickTimerRef.current[table._id]);
                                    delete clickTimerRef.current[table._id];
                                  }
                                  setEditingTableModal({
                                    isOpen: true,
                                    tableId: table._id,
                                    currentName: table.tableNumber,
                                    currentCapacity: table.capacity || 4,
                                    focusField: 'capacity'
                                  });
                                }}
                                className="text-[9px] font-extrabold px-1 py-0 rounded bg-white/90 text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition-all cursor-pointer flex items-center gap-0.5 border border-transparent hover:border-amber-300 shrink-0"
                                title="Click to change seating capacity"
                              >
                                <span>{table.capacity}p</span>
                              </span>
                            </div>

                            {/* Details */}
                            <div className="mt-0.5 text-left flex-1 flex flex-col justify-end">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-600 truncate leading-tight">
                                  {effectiveStatus === 'Hold' ? 'HOLD' : table.status}
                                </p>
                                {table.status === 'Reserved' && table.reservation && (
                                  <span className="text-[7px] text-amber-900 font-extrabold truncate bg-amber-100 px-1 py-0.2 rounded" title={`${table.reservation.customerName} (${table.reservation.guests}p)`}>
                                    Res
                                  </span>
                                )}
                              </div>
                              {hasOrder && (
                                <div className="mt-0.5 pt-0.5 border-t border-black/10 flex items-center justify-between leading-tight">
                                  <span className="text-[8px] font-bold text-slate-600">Bill</span>
                                  <span className="text-[10px] font-black text-slate-900">
                                    ₹{activeOrders[table._id].total.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Merged indicator */}
                            {table.mergedWith && table.mergedWith.length > 0 && (
                              <div className="mt-0.5 text-[7px] font-mono bg-purple-100 text-purple-900 px-1 py-0 rounded flex items-center gap-0.5 font-bold truncate">
                                <GitMerge className="w-2 h-2 shrink-0" />
                                <span className="truncate">+{table.mergedWith.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Clean spacing before next floor */}
                    <div className="mb-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: ORDER TAKING & BILLING SCREEN (When a table is clicked)
        ========================================================================= */
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-100">
          {/* Top Bar Header for Order & Billing */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('TABLES');
                  setSelectedTable('');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-extrabold transition-all border border-slate-700 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back to Tables</span>
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2.5">
                <span className="font-black text-base text-amber-400">
                  Table #{selectedTable?.tableNumber || 'N/A'}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  ({selectedTable?.capacity || 4} Seats • {selectedTable?.sectionName || 'Dining Hall'})
                </span>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md border ${
                    selectedTable?.status === 'Available' && activeOrder?.status !== 'Hold'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : selectedTable?.status === 'Occupied' && activeOrder?.status !== 'Hold'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : selectedTable?.status === 'Hold' || activeOrder?.status === 'Hold'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedTable?.status === 'Hold' || activeOrder?.status === 'Hold' ? 'ON HOLD' : selectedTable?.status}
                </span>
              </div>
            </div>

            {/* Quick Table Actions */}
            {selectedTable && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReservationModal(selectedTable._id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reserve</span>
                </button>
                <button
                  onClick={() => openMergeModal(selectedTable._id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                >
                  <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                  <span>Merge</span>
                </button>
                {selectedTable.mergedWith && selectedTable.mergedWith.length > 0 && (
                  <button
                    onClick={() => separateTables(selectedTable._id)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all"
                  >
                    Separate Merged
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Main 3-Column Workspace: Sidebar Categories + Center Menu + Right Billing Panel */}
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
            {/* COLUMN 1: SIDEBAR CATEGORIES */}
            <div className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden min-h-0">
              <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Categories
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {categories.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  <span>All Menu Dishes</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      selectedCategory === 'ALL'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {menuItems.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = menuItems.filter((item) => item.categoryId === cat._id).length;
                  const isSelected = selectedCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: CENTER MENU CATALOG */}
            <div className="flex-1 bg-slate-50 flex flex-col h-full min-w-0 overflow-hidden">
              {/* Search input bar & Quick Add Dish shortcut */}
              <div className="p-3 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dishes by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaultCat =
                      selectedCategory !== 'ALL' ? selectedCategory : categories[0]?._id || 'cat-1';
                    setQuickAddCatId(defaultCat);
                    setQuickDishName('');
                    setQuickDishPrice('450');
                    setShowQuickAddModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                  title="Quick Add Dish shortcut directly inside active category"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Dish</span>
                </button>
              </div>

              {/* Menu Items Grid */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
                {Object.entries(groupedMenu).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200/60 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">No dishes found in this category</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try selecting another category from the sidebar or clearing your search query.
                      </p>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedMenu).map(([categoryId, items]) => {
                    const category = categories.find((c) => c._id === categoryId);
                    if (!category) return null;
                    return (
                      <div key={categoryId} className="space-y-3">
                        <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {category.name}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {items.map((item) => (
                            <div
                              key={item._id}
                              onClick={() => item.available && handleOpenItemBuilder(item)}
                              className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                                item.available
                                  ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer'
                                  : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                                    {item.name}
                                  </h3>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {item.badge && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                                        {item.badge}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingDishId(item._id);
                                        setQuickDishName(item.name);
                                        setQuickDishPrice(item.variants?.[0]?.price?.toString() || '450');
                                        setQuickDishTax(item.taxRate?.toString() || '5');
                                        setQuickDishCore(item.core != null ? item.core.toString() : '');
                                        setQuickAddCatId(item.categoryId);
                                        setShowQuickAddModal(true);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="Edit Dish"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                          useERPStore.getState().deleteMenuItem(item._id);
                                        }
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="Delete Dish"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900">
                                    ₹{item.variants?.[0]?.price ?? (item as any).price ?? 0}
                                  </span>
                                  {item.variants && item.variants.length > 1 && (
                                    <span className="text-[10px] text-slate-400 font-medium ml-1">
                                      (+{item.variants.length} sizes)
                                    </span>
                                  )}
                                </div>
                                <button
                                  disabled={!item.available}
                                  className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 flex items-center justify-center transition-all font-bold cursor-pointer"
                                  title="Add to Table Order"
                                >
                                  <Plus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 3: RIGHT BILLING & ORDER SUMMARY PANEL */}
            <div className="w-80 lg:w-96 bg-white flex flex-col h-full overflow-hidden shadow-2xl border-l border-slate-200 shrink-0 min-h-0">
              {/* Table & Order Header */}
              <div className="p-3.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-400">
                      Active Order — Table #{selectedTable?.tableNumber || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                    Order: {activeOrder ? activeOrder.orderNumber : 'No active order'}
                  </p>
                </div>

                {activeOrder && activeOrder.kots.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeOrder.kots.length} KOT(s) Sent
                    </span>
                  </div>
                )}
              </div>

              {/* Ordered Items List */}
              <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 min-h-0">
                {!activeOrder || activeOrder.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">No dishes added yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select dishes from the middle menu catalog to add them to Table #{selectedTable?.tableNumber}.
                      </p>
                    </div>
                    {selectedTable && (selectedTable.status === 'Occupied' || selectedTable.status === 'Billing') && (
                      <button
                        onClick={() => useERPStore.getState().updateTableStatus(selectedTable._id, 'Available')}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reset Table #{selectedTable.tableNumber} to Available
                      </button>
                    )}
                  </div>
                ) : (
                  activeOrder.items.map((item, idx) => {
                    const sent = !!item.kotPrinted;
                    return (
                    <div
                      key={item.id}
                      className={`py-3 first:pt-0 flex items-start justify-between gap-3 transition-all ${
                        sent ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs ${sent ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {item.variantName.split(' ')[0]}
                          </span>
                          {sent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 border border-slate-300">
                              ✓ Sent to Kitchen
                            </span>
                          )}
                        </div>
                        {item.addons.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 space-x-1">
                            {item.addons.map((a, i) => (
                              <span key={i} className="inline-block">
                                + {a.name} (₹{a.price})
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[10px] italic text-slate-500 mt-0.5">
                            Note: "{item.notes}"
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ₹{item.price} × {item.quantity} = <strong className="text-slate-700">₹{item.price * item.quantity}</strong>
                        </p>
                      </div>

                      {/* Quantity Controls — disabled for already-printed items */}
                      <div className={`flex items-center gap-1.5 rounded-lg p-1 shrink-0 ${sent ? 'bg-slate-50' : 'bg-slate-100'}`}>
                        <button
                          onClick={() => !sent && updateOrderItemQty(idx, -1)}
                          disabled={sent}
                          className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => !sent && updateOrderItemQty(idx, 1)}
                          disabled={sent}
                          className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => !sent && removeOrderItem(idx)}
                          disabled={sent}
                          className="w-6 h-6 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center ml-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={sent ? 'Already sent to kitchen' : 'Remove Item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              {/* Financial Breakdown & POS Action Footer */}
              {activeOrder && activeOrder.items.length > 0 && (
                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                  {/* Totals table */}
                  <div className="space-y-1 text-xs px-1">
                    <div className="flex justify-between text-[#4b5563]">
                      <span>Subtotal</span>
                      <span className="text-[#111827] font-semibold">₹{activeOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#4b5563]">
                      <span>Discount</span>
                      <span className="text-[#111827] font-semibold">-₹0.00</span>
                    </div>
                    <div className="flex justify-between text-[#4b5563] pb-1.5 border-b border-slate-100">
                      <span>Taxes</span>
                      <span className="text-[#111827] font-semibold">
                        ₹{(activeOrder.cgst + activeOrder.sgst).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mb-2">
                      <span className="text-[#111827] font-bold text-sm">Grand Total</span>
                      <span className="text-[#9e1c25] font-extrabold text-lg">
                        ₹{activeOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Settlement Error Banner */}
                  {settlementError && (
                    <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded bg-red-50 border border-red-200">
                      <span className="text-red-600 text-[10px] font-bold flex-1">{settlementError}</span>
                      <button
                        onClick={() => useERPStore.setState({ settlementError: null })}
                        className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                      >✕</button>
                    </div>
                  )}

                  {/* Payment method toggle + Settle button */}
                  <div className="mt-2.5 space-y-1.5">
                    {/* Quick method selector */}
                    <div className="flex gap-1">
                      {(['Cash', 'Card', 'UPI'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setSettleMethod(m)}
                          disabled={isSettling}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                            settleMethod === m
                              ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]'
                              : 'bg-white border-slate-200 text-[#4b5563] hover:bg-slate-50'
                          }`}
                        >{m}</button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedTable?.status === 'Hold' || activeOrder?.status === 'Hold' ? (
                        <button
                          onClick={() => {
                            if (selectedTable?._id) {
                              useERPStore.getState().updateTableStatus(selectedTable._id, 'Occupied');
                              if (activeOrder) {
                                useERPStore.setState((state) => ({
                                  activeOrders: {
                                    ...state.activeOrders,
                                    [selectedTable._id]: { ...activeOrder, status: 'Active' },
                                  },
                                }));
                              }
                            }
                          }}
                          className="py-2 rounded border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Resume Order
                        </button>
                      ) : (
                        <button
                          onClick={() => useERPStore.getState().holdOrder(selectedTable?._id)}
                          disabled={isSettling}
                          className="py-2 rounded border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Hold Order
                        </button>
                      )}
                      {/* KOT Split-Button Dropdown */}
                      <div className="relative" ref={kotDropdownRef}>
                        <div className="flex rounded overflow-hidden border border-[#374151] shadow-sm">
                          {/* Main: Print KOT */}
                          <button
                            onClick={() => { generateKOT(true); setKotDropdownOpen(false); }}
                            disabled={isSettling || !activeOrder?.items?.length}
                            className="flex-1 py-2 px-3 bg-[#1f2937] hover:bg-[#111827] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            title="Print KOT to kitchen printer and save log"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print KOT
                          </button>
                          {/* Chevron to open dropdown */}
                          <button
                            onClick={() => setKotDropdownOpen((o) => !o)}
                            disabled={isSettling || !activeOrder?.items?.length}
                            className="px-2 py-2 bg-[#374151] hover:bg-[#4b5563] text-white text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-l border-[#4b5563] flex items-center"
                            title="More KOT options"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${kotDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {kotDropdownOpen && (
                          <div className="absolute bottom-full mb-1 right-0 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={() => { generateKOT(true); setKotDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <div className="text-left">
                                <div>Print KOT</div>
                                <div className="text-[10px] font-normal text-slate-500">Send to kitchen printer + save log</div>
                              </div>
                            </button>
                            <div className="border-t border-slate-100" />
                            <button
                              onClick={() => { generateKOT(false); setKotDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5 text-slate-600" />
                              <div className="text-left">
                                <div>Save KOT</div>
                                <div className="text-[10px] font-normal text-slate-500">Save to log only, no printing</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settle — direct, no modal */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => useERPStore.getState().cancelOrder()}
                        disabled={isSettling}
                        className="py-2 rounded border border-slate-300 bg-white hover:bg-red-50 text-[#374151] hover:text-red-600 hover:border-red-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleOpenPayment}
                        disabled={isSettling}
                        className="py-2.5 rounded bg-[#be1e2d] hover:bg-[#a61927] text-white text-sm font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSettling ? (
                          <><span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Settling…</>
                        ) : '💳 Settle'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ITEM CUSTOMIZATION MODAL (Variants, Addons, Notes)
      ======================================================== */}
      {activeItemModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{activeItemModal.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select Arabian Mandi portion & add-ons</p>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Variant selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Portion Size</label>
              <div className="grid grid-cols-1 gap-2">
                {(activeItemModal.variants && activeItemModal.variants.length > 0
                  ? activeItemModal.variants
                  : [{ name: 'Standard', price: (activeItemModal as any).price || 0 }]
                ).map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                      selectedVariantIdx === idx
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="font-bold text-slate-900">₹{v.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Addons */}
            {activeItemModal.addons.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Optional Add-ons</label>
                <div className="space-y-1.5">
                  {activeItemModal.addons.map((a, idx) => {
                    const isSelected = selectedAddonNames.includes(a.name);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleAddonSelection(a.name)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 font-semibold text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span>{a.name}</span>
                        </div>
                        <span className="font-bold">+₹{a.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Kitchen Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kitchen Instructions</label>
              <input
                type="text"
                placeholder="e.g., Less spicy, extra crispy skin..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmItemAdd}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md"
              >
                Add to Table Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT TABLE NAME MODAL (Double-click triggered)
      ======================================================== */}
      {editingTableModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-fade-in p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>Modify Table & Seating</span>
              </h3>
              <button
                onClick={() => setEditingTableModal({ isOpen: false, tableId: '', currentName: '', currentCapacity: 4 })}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
              Update display code (e.g., <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">G T-1</span>, <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">DIN T-1</span>) or adjust total guest seating spaces right below.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTableModal.currentName.trim()) {
                  updateTableDetails(editingTableModal.tableId, {
                    tableNumber: editingTableModal.currentName.trim(),
                    capacity: Number(editingTableModal.currentCapacity) || 4,
                  });
                  setEditingTableModal({ isOpen: false, tableId: '', currentName: '', currentCapacity: 4 });
                }
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Table Number / Display Name
                </label>
                <input
                  type="text"
                  autoFocus={editingTableModal.focusField !== 'capacity'}
                  required
                  placeholder="e.g. G T-1, 1T-1, DIN T-1, PAR T-1"
                  value={editingTableModal.currentName}
                  onChange={(e) => setEditingTableModal({ ...editingTableModal, currentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Seating Spaces (Capacity)</span>
                  <span className="text-amber-800 font-black text-xs bg-amber-100 px-2 py-0.5 rounded-full">
                    {editingTableModal.currentCapacity} Seats
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  autoFocus={editingTableModal.focusField === 'capacity'}
                  required
                  value={editingTableModal.currentCapacity}
                  onChange={(e) => setEditingTableModal({ ...editingTableModal, currentCapacity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-black text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-inner"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[2, 4, 6, 8, 10, 12, 16, 20].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setEditingTableModal({ ...editingTableModal, currentCapacity: cap })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all border ${
                        editingTableModal.currentCapacity === cap
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTableModal({ isOpen: false, tableId: '', currentName: '', currentCapacity: 4 })}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-black text-xs hover:bg-slate-800 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Save Table & Seating</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MIXED PAYMENT MODAL (Cash / Card / UPI)
      ======================================================== */}
      {paymentModalOpen && activeOrder && (() => {
        const cashNum = parseFloat(cashAmount) || 0;
        const cardNum = parseFloat(cardAmount) || 0;
        const upiNum = parseFloat(upiAmount) || 0;
        const totalEntered = cashNum + cardNum + upiNum;
        const remainingBalance = Math.max(0, activeOrder.total - totalEntered);
        const isSettled = totalEntered >= activeOrder.total - 0.01;
        const changeDue = Math.max(0, totalEntered - activeOrder.total);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Collect Payment – Table {activeOrder.tableNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supports Cash, Card, UPI or Mixed Payment split
                  </p>
                </div>
                <span className="text-base font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  ₹{activeOrder.total.toLocaleString()}
                </span>
              </div>

              {/* Payment Mode Tabs (above the amount box) */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                {(['UPI', 'Cash', 'Card', 'Part'] as const).map((tab) => {
                  const isActive = paymentTab === tab;
                  const icons: Record<typeof tab, string> = {
                    UPI: '📱 UPI',
                    Cash: '💵 Cash',
                    Card: '💳 Card',
                    Part: '🔀 Part',
                  };
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handlePaymentTabChange(tab)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-300 ring-1 ring-amber-500 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {icons[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Real-Time Split & Remaining Balance Dashboard Box */}
              <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Bill Total:</span>
                  <span className="font-bold text-slate-900">₹{activeOrder.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Total Paid / Entered:</span>
                  <span className="font-bold text-slate-900">₹{totalEntered.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs font-extrabold">
                  {!isSettled ? (
                    <>
                      <span className="text-red-600 flex items-center gap-1">
                        <span>⚠️ Remaining Balance:</span>
                      </span>
                      <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200 text-sm">
                        ₹{remainingBalance.toFixed(0)}
                      </span>
                    </>
                  ) : changeDue > 0.01 ? (
                    <>
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Change Due to Customer:</span>
                      </span>
                      <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 text-sm">
                        ₹{changeDue.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Payment Status:</span>
                      </span>
                      <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                        ✅ Fully Tallied (₹0 Remaining)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {paymentTab === 'UPI' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>UPI / QR Amount (₹)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUpiAmount(activeOrder.total.toString());
                          setCashAmount('0');
                          setCardAmount('0');
                        }}
                        className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                      >
                        Set Full
                      </button>
                    </label>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => {
                        setUpiAmount(e.target.value);
                        setCashAmount('0');
                        setCardAmount('0');
                      }}
                      className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
                    />
                  </div>
                )}

                {paymentTab === 'Cash' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>Cash Payment Amount (₹)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCashAmount(activeOrder.total.toString());
                          setUpiAmount('0');
                          setCardAmount('0');
                        }}
                        className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                      >
                        Set Full
                      </button>
                    </label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => {
                        setCashAmount(e.target.value);
                        setUpiAmount('0');
                        setCardAmount('0');
                      }}
                      className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
                    />
                  </div>
                )}

                {paymentTab === 'Card' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>Card POS Amount (₹)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCardAmount(activeOrder.total.toString());
                          setCashAmount('0');
                          setUpiAmount('0');
                        }}
                        className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                      >
                        Set Full
                      </button>
                    </label>
                    <input
                      type="number"
                      value={cardAmount}
                      onChange={(e) => {
                        setCardAmount(e.target.value);
                        setCashAmount('0');
                        setUpiAmount('0');
                      }}
                      className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
                    />
                  </div>
                )}

                {paymentTab === 'Part' && (
                  <>
                    {/* Cash Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>Cash Payment (₹)</span>
                        <div className="flex items-center gap-2">
                          {!isSettled && remainingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => setCashAmount((cashNum + remainingBalance).toFixed(0))}
                              className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              + Pay Remaining ₹{remainingBalance.toFixed(0)}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCashAmount(activeOrder.total.toString());
                              setCardAmount('0');
                              setUpiAmount('0');
                            }}
                            className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                          >
                            Set Full
                          </button>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Card Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>Card POS (₹)</span>
                        <div className="flex items-center gap-2">
                          {!isSettled && remainingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => setCardAmount((cardNum + remainingBalance).toFixed(0))}
                              className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              + Pay Remaining ₹{remainingBalance.toFixed(0)}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCardAmount(activeOrder.total.toString());
                              setCashAmount('0');
                              setUpiAmount('0');
                            }}
                            className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                          >
                            Set Full
                          </button>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* UPI Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>UPI / QR (₹)</span>
                        <div className="flex items-center gap-2">
                          {!isSettled && remainingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => setUpiAmount((upiNum + remainingBalance).toFixed(0))}
                              className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              + Pay Remaining ₹{remainingBalance.toFixed(0)}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setUpiAmount(activeOrder.total.toString());
                              setCashAmount('0');
                              setCardAmount('0');
                            }}
                            className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                          >
                            Set Full
                          </button>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={upiAmount}
                        onChange={(e) => setUpiAmount(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={!isSettled}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    !isSettled
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 filter blur-[0.6px] pointer-events-none shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse'
                  }`}
                >
                  {!isSettled ? (
                    <span>🔒 Short by ₹{remainingBalance.toFixed(0)} – Complete to Release Table</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Payment & Release Table</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Add Dish Shortcut Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 font-black text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingDishId ? 'Edit Dish' : 'Quick Add Dish'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingDishId ? 'Modify this dish directly' : 'Create item directly inside target category'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCreateOrEditDish} className="space-y-4">
              {/* Locked Category Display */}
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Target Category:</span>
                </div>
                <span className="px-3 py-1 bg-white rounded-xl border border-amber-300 text-xs font-black text-amber-900 shadow-2xs">
                  {categories.find((c) => c._id === (quickAddCatId || selectedCategory))?.name || 'Active Category'}
                </span>
              </div>

              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Grill Chicken Mandi"
                  value={quickDishName}
                  onChange={(e) => setQuickDishName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Standard Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard / Base Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. 450"
                  value={quickDishPrice}
                  onChange={(e) => setQuickDishPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. 5"
                  value={quickDishTax}
                  onChange={(e) => setQuickDishTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Core */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Core
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(optional – integer)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 1"
                  value={quickDishCore}
                  onChange={(e) => setQuickDishCore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingDishId ? 'Save Changes' : 'Add & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
