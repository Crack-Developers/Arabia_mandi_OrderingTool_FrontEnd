import React, { useState, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { MenuItem } from '../../types/erp.types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Users,
  GitMerge,
  CalendarCheck,
  Check,
  Utensils,
  XCircle,
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
    searchQuery,
    setSearchQuery,
    activeOrders,
    addItemToOrder,
    updateOrderItemQty,
    removeOrderItem,
    generateKOT,
    generateBill,
    processPayment,
    openReservationModal,
    openMergeModal,
    separateTables,
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

  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');

  // Variant & Addon modal helper state when clicking a menu item
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [upiAmount, setUpiAmount] = useState<string>('');

  const selectedTable = tables.find((t) => t._id === selectedTableId) || tables[0];
  const activeOrder = selectedTableId ? activeOrders[selectedTableId] : undefined;

  // Petpooja Footer State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Cash');
  const [settlementAmount, setSettlementAmount] = useState<number>(0);

  // Resizable Panels State (% widths)
  const [leftPanelPct, setLeftPanelPct] = useState<number>(24);
  const [rightPanelPct, setRightPanelPct] = useState<number>(33);
  const [draggingResizer, setDraggingResizer] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingResizer) return;
      const windowWidth = window.innerWidth;
      if (draggingResizer === 'left') {
        const pct = Math.max(16, Math.min(38, (e.clientX / windowWidth) * 100));
        setLeftPanelPct(pct);
      } else if (draggingResizer === 'right') {
        const pct = Math.max(24, Math.min(48, ((windowWidth - e.clientX) / windowWidth) * 100));
        setRightPanelPct(pct);
      }
    };

    const handleMouseUp = () => {
      if (draggingResizer) {
        setDraggingResizer(null);
      }
    };

    if (draggingResizer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingResizer]);

  useEffect(() => {
    if (activeOrder) {
      setSettlementAmount(activeOrder.total);
    }
  }, [activeOrder?.total]);

  // Filter tables
  const filteredTables = tables.filter(
    (t) => selectedSectionId === 'ALL' || t.sectionId === selectedSectionId
  );

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
      default:
        return 'bg-slate-400';
    }
  };

  const handleOpenItemBuilder = (item: MenuItem) => {
    if (item.variants.length === 1 && item.addons.length === 0) {
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
    setCashAmount(activeOrder.total.toString());
    setCardAmount('0');
    setUpiAmount('0');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    processPayment({ cash, card, upi });
    setPaymentModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-row h-full max-h-full min-h-0 overflow-hidden bg-slate-100 select-none">
      {/* ========================================================
          LEFT PANEL: TABLE LAYOUT & SECTION SELECTION
      ======================================================== */}
      <div
        style={{ width: `${leftPanelPct}%` }}
        className="bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden min-h-0 shrink-0"
      >
        {/* Section Tabs Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Table Layout</span>
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              {tables.length} Tables
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSectionId('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSectionId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Sections
            </button>
            {displaySections.map((sec) => (
              <button
                key={sec._id}
                onClick={() => setSelectedSectionId(sec._id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedSectionId === sec._id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{sec.name}</span>
                <span className="text-[9px] opacity-75">({sec.floor})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Grid Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 content-start min-h-0">
          {filteredTables.map((table) => {
            const isSelected = table._id === selectedTableId;
            const hasOrder = !!activeOrders[table._id];
            return (
              <div
                key={table._id}
                onClick={() => setSelectedTable(table._id)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-amber-500 shadow-md border-amber-500 bg-amber-50/50'
                    : getStatusColor(table.status)
                }`}
              >
                {/* Table Top bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(table.status)}`} />
                    <span className="font-bold text-sm tracking-tight">{table.tableNumber}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">{table.capacity} Seats</span>
                </div>

                {/* Table details */}
                <div className="mt-2 text-left">
                  <p className="text-[11px] font-semibold text-slate-700">
                    {table.status}
                  </p>
                  {table.status === 'Reserved' && table.reservation && (
                    <p className="text-[10px] text-amber-700 font-medium truncate mt-0.5">
                      {table.reservation.customerName} ({table.reservation.guests}p)
                    </p>
                  )}
                  {hasOrder && (
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      ₹{activeOrders[table._id].total.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Merged indicator */}
                {table.mergedWith && table.mergedWith.length > 0 && (
                  <div className="mt-1.5 text-[9px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <GitMerge className="w-2.5 h-2.5" />
                    <span>+{table.mergedWith.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Table Actions Footer */}
        {selectedTable && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Selected: {selectedTable.tableNumber}</span>
              <span className="text-amber-700">{selectedTable.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => openReservationModal(selectedTable._id)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Reserve</span>
              </button>
              <button
                onClick={() => openMergeModal(selectedTable._id)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <GitMerge className="w-3.5 h-3.5 text-purple-600" />
                <span>Merge</span>
              </button>
            </div>
            {selectedTable.mergedWith && (
              <button
                onClick={() => separateTables(selectedTable._id)}
                className="w-full px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100"
              >
                Separate Merged Tables
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resizer Handle 1 (Left - Middle) */}
      <div
        onMouseDown={() => setDraggingResizer('left')}
        className={`w-1.5 hover:w-2 bg-slate-200 hover:bg-amber-500 cursor-col-resize transition-all shrink-0 flex items-center justify-center relative group z-10 ${
          draggingResizer === 'left' ? 'bg-amber-500 w-2' : ''
        }`}
        title="Drag left/right to resize Table Layout panel"
      >
        <div className="w-0.5 h-8 rounded-full bg-slate-400 group-hover:bg-white" />
      </div>

      {/* ========================================================
          MIDDLE PANEL: MENU CATALOG & FAST ORDER ENTRY
      ======================================================== */}
      <div className="flex-1 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden min-h-0 min-w-0">
        {/* Search & Categories Bar */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Arabian Mandi dishes, shanks, kunafa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat._id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grouped by Category */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-5">
          {Object.entries(groupedMenu).map(([categoryId, items]) => {
            const category = categories.find((c) => c._id === categoryId);
            if (!category) return null;
            return (
              <div key={categoryId} className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {category.name}
                </h3>
                <div className="grid grid-cols-2 gap-3">
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
                          {item.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div>
                          <span className="text-xs font-extrabold text-slate-900">
                            ₹{item.variants[0].price}
                          </span>
                          {item.variants.length > 1 && (
                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                              (+{item.variants.length} sizes)
                            </span>
                          )}
                        </div>
                        <button
                          disabled={!item.available}
                          className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 flex items-center justify-center transition-all font-bold"
                          title="Add to Table Order"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resizer Handle 2 (Middle - Right) */}
      <div
        onMouseDown={() => setDraggingResizer('right')}
        className={`w-1.5 hover:w-2 bg-slate-200 hover:bg-amber-500 cursor-col-resize transition-all shrink-0 flex items-center justify-center relative group z-10 ${
          draggingResizer === 'right' ? 'bg-amber-500 w-2' : ''
        }`}
        title="Drag left/right to resize Billing panel"
      >
        <div className="w-0.5 h-8 rounded-full bg-slate-400 group-hover:bg-white" />
      </div>

      {/* ========================================================
          RIGHT PANEL: ACTIVE ORDER WORKSPACE & BILLING
      ======================================================== */}
      <div
        style={{ width: `${rightPanelPct}%` }}
        className="bg-white flex flex-col h-full overflow-hidden shadow-xl min-h-0 shrink-0"
      >
        {/* Table & Order Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-amber-400">
                Table {selectedTable ? selectedTable.tableNumber : 'N/A'}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedTable?.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
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
                <p className="text-xs font-bold text-slate-700">No dishes ordered yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click dishes from the middle menu catalog to add them to Table {selectedTable?.tableNumber}.
                </p>
              </div>
              {selectedTable && (selectedTable.status === 'Occupied' || selectedTable.status === 'Billing') && (
                <button
                  onClick={() => useERPStore.getState().updateTableStatus(selectedTable._id, 'Available')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors"
                >
                  Reset Table {selectedTable.tableNumber} to Available
                </button>
              )}
            </div>
          ) : (
            activeOrder.items.map((item, idx) => (
              <div key={item.id} className="py-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {item.variantName.split(' ')[0]}
                    </span>
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

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => updateOrderItemQty(idx, -1)}
                    className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-sm"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateOrderItemQty(idx, 1)}
                    className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeOrderItem(idx)}
                    className="w-6 h-6 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center ml-1"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Breakdown & POS Action Footer (Petpooja Style) */}
        {activeOrder && activeOrder.items.length > 0 && (
          <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
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
                <span>Tax (5%)</span>
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

            {/* Payment Method Pills */}
            <div className="flex gap-1 mt-1.5">
              {['Not Paid', 'Cash', 'Card', 'UPI', 'Other'].map(method => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                    selectedPaymentMethod === method
                      ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]'
                      : 'bg-white border-slate-200 text-[#4b5563] hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Settlement Row */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-xs font-bold text-[#1f2937] whitespace-nowrap flex-1">
                Settlement Amount
              </span>
              <input
                type="number"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded border border-slate-200 text-xs font-bold text-[#111827] focus:outline-none focus:border-slate-400"
              />
              <button
                onClick={() => {
                  processPayment({
                    cash: selectedPaymentMethod === 'Cash' ? settlementAmount : 0,
                    card: selectedPaymentMethod === 'Card' ? settlementAmount : 0,
                    upi: selectedPaymentMethod === 'UPI' ? settlementAmount : 0,
                  });
                }}
                className="px-4 py-1.5 rounded bg-[#9e1c25] hover:bg-[#86171f] text-white text-xs font-bold whitespace-nowrap transition-colors"
              >
                Settle & Save
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 mt-2.5 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-1.5">
                <button className="py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[#374151] text-xs font-bold transition-colors">
                  Hold Order
                </button>
                <button
                  onClick={generateKOT}
                  className="py-2 rounded bg-[#1f2937] hover:bg-[#111827] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Generate KOT
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button className="py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[#374151] text-xs font-bold transition-colors">
                  Cancel
                </button>
                <button
                  onClick={generateBill}
                  className="col-span-1 py-2 rounded bg-[#be1e2d] hover:bg-[#a61927] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save & Print
                </button>
                <button
                  onClick={handleOpenPayment}
                  className="py-2 rounded bg-[#be1e2d] hover:bg-[#a61927] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Pay Modal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
                {activeItemModal.variants.map((v, idx) => (
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
          MIXED PAYMENT MODAL (Cash / Card / UPI)
      ======================================================== */}
      {paymentModalOpen && activeOrder && (
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

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Cash Payment (₹)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCashAmount(activeOrder.total.toString());
                      setCardAmount('0');
                      setUpiAmount('0');
                    }}
                    className="text-[10px] text-amber-700 hover:underline"
                  >
                    Set Full
                  </button>
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Card POS (₹)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCardAmount(activeOrder.total.toString());
                      setCashAmount('0');
                      setUpiAmount('0');
                    }}
                    className="text-[10px] text-amber-700 hover:underline"
                  >
                    Set Full
                  </button>
                </label>
                <input
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>UPI / QR (₹)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiAmount(activeOrder.total.toString());
                      setCashAmount('0');
                      setCardAmount('0');
                    }}
                    className="text-[10px] text-amber-700 hover:underline"
                  >
                    Set Full
                  </button>
                </label>
                <input
                  type="number"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg"
              >
                Complete Payment & Release Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
