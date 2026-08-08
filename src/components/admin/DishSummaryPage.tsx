import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { dashboardApi } from '../../services/api.service';
import {
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Download,
  UtensilsCrossed,
  TrendingUp,
  ShoppingBag,
  Award,
  DollarSign,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DishSummaryItem {
  id: string;
  name: string;
  variantName: string;
  category: string;
  qtySold: number;
  menuItemCore: number | null;
  coreQty: number | null;
  revenue: number;
  avgPrice: number;
  orderCount: number;
  percentageQty: number;
  percentageRevenue: number;
  dineInQty: number;
  pickUpQty: number;
  deliveryQty: number;
}

interface SummaryStats {
  totalDishesSold: number;
  totalRevenue: number;
  uniqueDishesCount: number;
  averageDishPrice: number;
}

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function currentMonthISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const DishSummaryPage: React.FC = () => {
  const { branchFilterId, setBranchFilterId, categories, branches, currentBranch } = useERPStore();

  // Filter States
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO());
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [items, setItems] = useState<DishSummaryItem[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalDishesSold: 0,
    totalRevenue: 0,
    uniqueDishesCount: 0,
    averageDishPrice: 0,
  });
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'qtySold' | 'revenue' | 'name' | 'percentageQty'>('qtySold');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getDishSummary(
        filterType,
        (filterType === 'day' || filterType === 'week') ? selectedDate : undefined,
        filterType === 'month' ? selectedMonth : undefined,
        filterType === 'year' ? selectedYear : undefined,
        selectedCategory,
        branchFilterId
      );

      if (res) {
        setItems(res.items || []);
        setSummaryStats(
          res.summaryStats || {
            totalDishesSold: 0,
            totalRevenue: 0,
            uniqueDishesCount: 0,
            averageDishPrice: 0,
          }
        );
        setPeriodLabel(res.periodLabel || '');
      }
    } catch (err: any) {
      console.error('Failed to fetch dish summary:', err);
      setError(err?.message || 'Failed to load dish sales summary.');
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedCategory, branchFilterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 10s
  useEffect(() => {
    const t = setInterval(() => {
      if (!useERPStore.getState().isOfflineMode && navigator.onLine) {
        loadData();
      }
    }, 10_000);
    const handleOnline = () => loadData();
    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadData]);

  // Filtered & Sorted items
  const filteredAndSortedItems = useMemo(() => {
    let list = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.variantName.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let vA: any = a[sortField];
      let vB: any = b[sortField];
      if (typeof vA === 'string') {
        return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortDir === 'asc' ? vA - vB : vB - vA;
    });

    return list;
  }, [items, searchQuery, sortField, sortDir]);

  const handleSort = (field: 'qtySold' | 'revenue' | 'name' | 'percentageQty') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportToCSV = () => {
    if (filteredAndSortedItems.length === 0) return;
    const headers = [
      'Rank',
      'Dish Name',
      'Variant',
      'Category',
      'Total Qty Sold',
      'Core Per Dish',
      'Core Qty (Core × Sold)',
      'Volume Share (%)',
      'Avg Price (INR)',
      'Total Revenue (INR)',
      'Revenue Share (%)',
      'Unique Orders Count',
      'Dine-In Qty',
      'Pick-Up Qty',
      'Delivery Qty',
    ];

    const rows = filteredAndSortedItems.map((it, idx) => [
      idx + 1,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.variantName.replace(/"/g, '""')}"`,
      `"${it.category.replace(/"/g, '""')}"`,
      it.qtySold,
      it.menuItemCore ?? '',
      it.coreQty ?? '',
      `${it.percentageQty}%`,
      it.avgPrice,
      it.revenue,
      `${it.percentageRevenue}%`,
      it.orderCount,
      it.dineInQty,
      it.pickUpQty,
      it.deliveryQty,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ArabiaMandi_DishSummary_${filterType}_${selectedDate || selectedMonth || selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  let branchName = 'All Branches';
  if (branchFilterId === 'ALL') {
    branchName = 'All Branches';
  } else {
    branchName = branches.find((b) => b._id === branchFilterId)?.name || currentBranch?.name || 'Selected Branch';
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)] text-slate-800 font-sans pb-12">
      {/* Top Banner & Title Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dish Sales &amp; Item Summary
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  POV Executive Report
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                <span>Granular product performance analysis for <strong className="text-amber-600">{branchName}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span>Showing: <strong className="text-slate-800">{periodLabel || 'Selected Period'}</strong></span>
              </p>
            </div>
          </div>

          {/* Time Filter Tabs & Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
              <span className="text-slate-500">Branch:</span>
              <select
                value={branchFilterId}
                onChange={(e) => setBranchFilterId(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
                {currentBranch && !branches.some((b) => b._id === currentBranch._id) && (
                  <option value={currentBranch._id}>{currentBranch.name}</option>
                )}
              </select>
            </div>
            {/* Filter Type Pills: Day / Week / Month / Year */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              {[
                { id: 'day', label: 'By Day' },
                { id: 'week', label: 'By Week' },
                { id: 'month', label: 'By Month' },
                { id: 'year', label: 'By Year' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filterType === tab.id
                      ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Selector Input based on filterType */}
            <div
              onClick={(e) => {
                const inp = e.currentTarget.querySelector('input, select') as any;
                if (inp) {
                  try { inp.showPicker?.(); } catch {}
                  inp.focus();
                }
              }}
              className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2 bg-white shadow-sm cursor-pointer select-none min-w-[150px] hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
              {(filterType === 'day' || filterType === 'week') && (
                <input
                  type="date"
                  value={selectedDate}
                  max={todayISO()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  onClick={(e) => { try { (e.target as any).showPicker?.(); } catch {} }}
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full flex-1"
                />
              )}
              {filterType === 'month' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  onClick={(e) => { try { (e.target as any).showPicker?.(); } catch {} }}
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full flex-1"
                />
              )}
              {filterType === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full flex-1"
                >
                  {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((yr) => (
                    <option key={yr} value={yr} className="bg-white text-slate-800">
                      Year {yr}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* CSV Export Button */}
            <button
              onClick={exportToCSV}
              disabled={loading || items.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Table CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-semibold flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Notice from Analytics Engine</p>
              <p className="text-xs text-red-700/80">{error}</p>
            </div>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Dishes Sold */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                Total Dishes Sold
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : summaryStats.totalDishesSold.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">units</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Dish Revenue */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Total Revenue
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : fmt(summaryStats.totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Unique Dishes Sold */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Layers className="w-4 h-4 text-blue-500" />
                Unique Dishes Sold
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : summaryStats.uniqueDishesCount}
                </span>
                <span className="text-xs font-medium text-slate-500">dishes</span>
              </div>
            </div>
          </div>

          {/* Card 4: Average Dish Price */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Avg Dish Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-purple-600">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : fmt(summaryStats.averageDishPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar above Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dish name, variant, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 font-bold"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 pl-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              Category:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              ALL CATEGORIES
            </button>
            {Array.from(
              new Map(
                categories.map((cat) => [cat.name.trim().toLowerCase(), cat.name.trim()])
              ).values()
            )
              .sort((a, b) => a.localeCompare(b))
              .map((catName) => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                    selectedCategory.toLowerCase() === catName.toLowerCase()
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {catName}
                </button>
              ))}
          </div>
        </div>

        {/* ── Granular Dish Summary Table Format ─────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Dish Sales Summary
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                ({filteredAndSortedItems.length} items)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dish Name</span>
                      {sortField === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-36">Category</th>
                  <th
                    className="py-3.5 px-4 w-28 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('qtySold')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Qty Sold</span>
                      {sortField === 'qtySold' && (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-28 text-right" title="Core per dish × qty sold = total core ingredient units consumed">
                    <div className="flex items-center justify-end gap-1">
                      <span>Core Qty</span>
                      <span className="text-[9px] font-normal text-slate-400 leading-none">(core×sold)</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-56 text-center">Service Type Breakdown</th>
                  <th className="py-3.5 px-4 w-28 text-right">Avg Rate</th>
                  <th
                    className="py-3.5 px-4 w-36 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Revenue</span>
                      {sortField === 'revenue' && (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-24 text-center">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                        <p className="text-slate-600 font-medium text-sm">Loading dish sales summary...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-sm mx-auto text-center">
                        <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-900 font-bold text-base">No Dishes Sold in this Window</p>
                        <p className="text-slate-500 text-xs mt-1">
                          Try changing the date/month filter or selecting 'ALL CATEGORIES'.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item, index) => {
                    const isTopSeller = index < 3 && item.qtySold > 0;
                    const rankBadge =
                      index === 0
                        ? 'bg-amber-500 text-white font-black shadow-sm'
                        : index === 1
                        ? 'bg-slate-700 text-white font-bold'
                        : index === 2
                        ? 'bg-amber-700 text-white font-bold'
                        : 'text-slate-500 font-semibold';

                    return (
                      <tr
                        key={item.id || index}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${rankBadge}`}
                          >
                            {index + 1}
                          </span>
                        </td>

                        {/* Dish Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-sm">
                              {item.name}
                            </span>
                            {item.variantName && item.variantName !== 'Standard' && (
                              <span className="text-xs font-normal text-slate-500">
                                ({item.variantName})
                              </span>
                            )}
                            {isTopSeller && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <Award className="w-3 h-3" /> TOP SELLER
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                          {item.category}
                        </td>

                        {/* Total Qty Sold */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-extrabold text-slate-900 text-base">
                            {item.qtySold.toLocaleString()}
                          </span>
                          {item.percentageQty > 0 && (
                            <span className="text-[11px] font-medium text-slate-500 ml-1.5">
                              ({item.percentageQty}%)
                            </span>
                          )}
                        </td>

                        {/* Core Qty = core × qtySold */}
                        <td className="py-3.5 px-4 text-right">
                          {item.coreQty != null ? (
                            <div className="flex flex-col items-end">
                              <span className="font-extrabold text-orange-600 text-base">
                                {item.coreQty.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {item.menuItemCore} × {item.qtySold}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-medium text-xs">—</span>
                          )}
                        </td>

                        {/* Service Type Breakdown */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                            {item.dineInQty > 0 && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                Dine-In: <strong>{item.dineInQty}</strong>
                              </span>
                            )}
                            {item.pickUpQty > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                Pick-Up: <strong>{item.pickUpQty}</strong>
                              </span>
                            )}
                            {item.deliveryQty > 0 && (
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                                Delivery: <strong>{item.deliveryQty}</strong>
                              </span>
                            )}
                            {item.dineInQty === 0 && item.pickUpQty === 0 && item.deliveryQty === 0 && (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </div>
                        </td>

                        {/* Avg Rate */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 text-sm font-mono">
                          {fmt(item.avgPrice)}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-emerald-600 text-base font-mono">
                            {fmt(item.revenue)}
                          </span>
                        </td>

                        {/* Orders Count */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-600 text-xs">
                          {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-2">
            <span>
              Showing <strong className="text-slate-900">{filteredAndSortedItems.length}</strong> distinct product rows for selected filter.
            </span>
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              Real-time POS synced data. Percentages indicate share of total quantity &amp; revenue.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
