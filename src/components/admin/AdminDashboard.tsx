import React, { useState, useEffect, useCallback } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { dashboardApi } from '../../services/api.service';
import {
  Calendar,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Clock,
  Info,
  Loader2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HourlySale { label: string; revenue: number; }
interface DashboardData {
  date: string;
  salesStats: {
    totalSales: number; notPaid: number;
    cash: number; card: number; online: number; other: number;
    totalOrders: number; successful: number; cancelled: number; complementary: number;
    hourlySales: HourlySale[];
  };
  orderTypes: {
    dineIn:   { revenue: number; count: number; avgTurnAroundMins: number };
    pickUp:   { revenue: number; count: number; avgTurnAroundMins: number };
    delivery: { revenue: number; count: number; avgTurnAroundMins: number };
  };
  leakage: {
    kotsCancelled: number; kotsModified: number;
    kotsNotInBills: number; kotsShifted: number;
    billsModified: number; billsReprinted: number; waivedOff: number;
  };
  itemPerformance: {
    top: { name: string; qtySold: number; revenue: number }[];
    low: { name: string; qtySold: number; revenue: number }[];
  };
  expensesWithdrawals: { total: number };
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹ ${Number(n).toLocaleString('en-IN')}`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function LeakageRow({ count, label, onClick }: { count: number; label: string; onClick?: () => void }) {
  return (
    <div 
      className={`flex items-center gap-3 text-[13px] transition-colors ${onClick && count > 0 ? 'cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-md' : ''}`}
      onClick={() => onClick && count > 0 && onClick()}
    >
      <span className={`font-extrabold min-w-[24px] h-6 flex items-center justify-center rounded-md px-1 ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-900'}`}>
        {count}
      </span>
      <span className="text-slate-600 font-medium">{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const { branchFilterId } = useERPStore();

  const [filterType, setFilterType]       = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate]   = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear]   = useState(() => String(new Date().getFullYear()));
  const [data, setData]                   = useState<DashboardData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [perfTab, setPerfTab]             = useState<'top' | 'low'>('top');
  const [lastSync, setLastSync]           = useState<string | null>(null);

  // Leakage Modal State
  const [leakageModalOpen, setLeakageModalOpen] = useState(false);
  const [leakageType, setLeakageType] = useState<string | null>(null);
  const [leakageTitle, setLeakageTitle] = useState('');
  const [leakageLogs, setLeakageLogs] = useState<any[]>([]);
  const [loadingLeakage, setLoadingLeakage] = useState(false);

  const branchId = branchFilterId === 'ALL' ? undefined : branchFilterId;

  const load = useCallback(async (silent = false) => {
    if (useERPStore.getState().isOfflineMode || !navigator.onLine) {
      if (!silent) setError('Offline Mode Active: Analytics polling suspended until network is restored.');
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats(
        filterType,
        (filterType === 'day' || filterType === 'week') ? selectedDate : undefined,
        branchId,
        filterType === 'month' ? selectedMonth : undefined,
        filterType === 'year' ? selectedYear : undefined
      );
      setData(res);
      setLastSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      if (!silent) setError(e?.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear, branchId]);

  // Load on mount and whenever date/branch changes
  useEffect(() => { load(false); }, [load]);

  // Auto-refresh every 30 seconds when online; automatically recover on network re-connection
  useEffect(() => {
    const t = setInterval(() => {
      if (!useERPStore.getState().isOfflineMode && navigator.onLine) {
        load(true);
      }
    }, 30_000);
    const handleOnline = () => load(false);
    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', handleOnline);
    };
  }, [load]);

  const handleLeakageClick = async (type: string, title: string) => {
    setLeakageType(type);
    setLeakageTitle(title);
    setLeakageModalOpen(true);
    setLoadingLeakage(true);
    try {
      const res = await dashboardApi.getLeakageLogs(
        type,
        filterType,
        (filterType === 'day' || filterType === 'week') ? selectedDate : undefined,
        branchId,
        filterType === 'month' ? selectedMonth : undefined,
        filterType === 'year' ? selectedYear : undefined
      );
      setLeakageLogs(res);
    } catch (e: any) {
      console.error('Failed to fetch leakage logs', e);
    } finally {
      setLoadingLeakage(false);
    }
  };

  const d = data;
  const s = d?.salesStats;
  const ot = d?.orderTypes;
  const lk = d?.leakage;
  const maxHourly = Math.max(...(s?.hourlySales?.map((h) => h.revenue) ?? [1]), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)] text-slate-800 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200 bg-white gap-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Statistics</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Period: <span className="text-blue-600 font-bold">{d?.date || formatDate(selectedDate)}</span>
            </p>
          </div>

          {/* Filter Type Pills: Day / Week / Month / Year */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {[
              { id: 'day', label: 'Day' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === tab.id
                    ? 'bg-white text-blue-600 font-extrabold shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Shortcuts for Day filter */}
          {filterType === 'day' && (
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setSelectedDate(todayISO())}
                className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                  selectedDate === todayISO()
                    ? 'bg-blue-50 text-blue-600 border-blue-200 font-extrabold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  setSelectedDate(yest.toISOString().split('T')[0]);
                }}
                className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                  selectedDate !== todayISO()
                    ? 'bg-blue-50 text-blue-600 border-blue-200 font-extrabold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Yesterday
              </button>
            </div>
          )}

          {/* Selector Input */}
          <div
            onClick={(e) => {
              const inp = e.currentTarget.querySelector('input, select') as any;
              if (inp) {
                try { inp.showPicker?.(); } catch {}
                inp.focus();
              }
            }}
            className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2 bg-white shadow-sm text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer select-none min-w-[150px]"
          >
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => load(false)}
            disabled={loading}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-40"
            title="Refresh Data"
          >
            {loading
              ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              : <RefreshCw className="w-4 h-4 text-slate-500" />
            }
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          {useERPStore.getState().isOfflineMode ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
              <span>Offline Simulation — Polling Paused</span>
            </div>
          ) : lastSync ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>🟢 Live Syncing (30s polling) • Last: {lastSync}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              <span>Connecting & Syncing...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error} — showing last known data.
        </div>
      )}

      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ================================================================
              LEFT COLUMN
          ================================================================ */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* 1. SALES STATISTICS */}
            <div className={`bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row shadow-sm overflow-hidden transition-opacity ${loading && !d ? 'opacity-50' : ''}`}>

              {/* Left panel */}
              <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                <div className="bg-white border border-slate-100 p-4 rounded-xl mb-8 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-bold tracking-wide uppercase">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <ShoppingBag className="w-4 h-4" />
                    </span>
                    Total Sales
                  </div>
                  <h2 className="text-3xl font-extrabold mt-3 text-slate-900">
                    {loading && !d ? '—' : fmt(s?.totalSales ?? 0)}
                  </h2>
                </div>

                <div className="space-y-4">
                  <StatRow label="Not paid" value={fmt(s?.notPaid  ?? 0)} />
                  <StatRow label="Cash"     value={fmt(s?.cash     ?? 0)} />
                  <StatRow label="Card"     value={fmt(s?.card     ?? 0)} />
                  <StatRow label="Online"   value={fmt(s?.online   ?? 0)} />
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">Other</span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                      {fmt(s?.other ?? 0)}
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Right panel — bar chart */}
              <div className="flex-1 p-6 lg:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div> Sales
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">
                      Total Orders <span className="text-xl font-extrabold text-slate-900 ml-1.5">{s?.totalOrders ?? 0}</span>
                    </p>
                    <div className="flex gap-4 text-[13px] mt-2">
                      <span className="text-blue-600 font-bold">{s?.successful ?? 0} Successful</span>
                      <span className="text-blue-600 font-bold">{s?.complementary ?? 0} Complementary</span>
                      <span className="text-slate-500 font-medium">{s?.cancelled ?? 0} Cancelled</span>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-48 flex items-end gap-3 pb-6 border-b border-slate-200 relative px-2">
                  {(s?.hourlySales ?? HOURLY_BUCKETS).map((slot, i) => {
                    const heightPct = maxHourly > 0 ? (slot.revenue / maxHourly) * 100 : 0;
                    const isHighest = slot.revenue === maxHourly && maxHourly > 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {slot.revenue > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {fmt(slot.revenue)}
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-md transition-all ${isHighest ? 'bg-blue-500' : 'bg-blue-300 group-hover:bg-blue-400'}`}
                          style={{ height: `${Math.max(heightPct, slot.revenue > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis time labels */}
                <div className="flex gap-3 mt-3 px-2">
                  {(s?.hourlySales ?? HOURLY_BUCKETS).map((slot, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] font-bold text-slate-400 leading-tight">
                      {slot.label.split(' - ').map((t, j) => <div key={j}>{t}</div>)}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-8 mt-6 text-[13px] font-bold text-slate-600">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm" /> Dine In</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" /> Pick Up</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" /> Delivery</div>
                </div>
              </div>
            </div>

            {/* 2. ORDER TYPES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Dine In */}
              <OrderTypeCard
                icon={<UtensilsCrossed className="w-4 h-4" />}
                label="Dine In"
                colorClass="bg-blue-100/80 text-blue-700"
                bgGlow="bg-blue-50"
                revenue={ot?.dineIn.revenue ?? 0}
                count={ot?.dineIn.count ?? 0}
                tta={ot?.dineIn.avgTurnAroundMins ?? 0}
                loading={loading && !d}
              />
              <OrderTypeCard
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Pick Up"
                colorClass="bg-emerald-100/80 text-emerald-700"
                bgGlow="bg-emerald-50"
                revenue={ot?.pickUp.revenue ?? 0}
                count={ot?.pickUp.count ?? 0}
                tta={0}
                loading={loading && !d}
              />
              <OrderTypeCard
                icon={<Truck className="w-4 h-4" />}
                label="Delivery"
                colorClass="bg-red-100/80 text-red-600"
                bgGlow="bg-red-50"
                revenue={ot?.delivery.revenue ?? 0}
                count={ot?.delivery.count ?? 0}
                tta={0}
                loading={loading && !d}
              />
            </div>

          </div>

          {/* ================================================================
              RIGHT COLUMN
          ================================================================ */}
          <div className="w-full xl:w-[420px] flex flex-col gap-6">

            {/* 3. LEAKAGE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                  <AlertTriangle className="w-5 h-5 text-slate-400" /> Leakage
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-50">
                  <span>{formatDate(selectedDate)}</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 mb-4 tracking-widest uppercase">KOTS</h4>
                  <div className="grid grid-cols-2 gap-y-5">
                    <LeakageRow count={lk?.kotsCancelled  ?? 0} label="Cancelled" onClick={() => handleLeakageClick('kotsCancelled', 'Cancelled KOTs')} />
                    <LeakageRow count={lk?.kotsModified   ?? 0} label="Modified" onClick={() => handleLeakageClick('kotsModified', 'Modified KOTs')} />
                    <LeakageRow count={lk?.kotsNotInBills ?? 0} label="Not used in bills" onClick={() => handleLeakageClick('kotsNotInBills', 'KOTs Not in Bills')} />
                    <LeakageRow count={lk?.kotsShifted    ?? 0} label="Shifted" onClick={() => handleLeakageClick('kotsShifted', 'Shifted KOTs')} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 mb-4 tracking-widest uppercase">BILLS</h4>
                  <div className="grid grid-cols-2 gap-y-5">
                    <LeakageRow count={lk?.billsModified  ?? 0} label="Modified" onClick={() => handleLeakageClick('billsModified', 'Modified Bills')} />
                    <LeakageRow count={lk?.billsReprinted ?? 0} label="Re-printed" onClick={() => handleLeakageClick('billsReprinted', 'Re-printed Bills')} />
                  </div>
                </div>

                <div 
                  className={`pt-6 border-t border-slate-100 flex items-center gap-3 text-sm transition-colors ${(lk?.waivedOff ?? 0) > 0 ? 'cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-md' : ''}`}
                  onClick={() => (lk?.waivedOff ?? 0) > 0 && handleLeakageClick('waivedOff', 'Waived Off Amounts')}
                >
                  <span className={`font-extrabold text-base ${(lk?.waivedOff ?? 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>{fmt(lk?.waivedOff ?? 0)}</span>
                  <span className="text-slate-500 font-medium">Waived off</span>
                </div>
              </div>
            </div>

            {/* 4. ITEM PERFORMANCE */}
            <div className="bg-white rounded-2xl border border-slate-200 flex flex-col flex-1 shadow-sm overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg">Item Performance</h3>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-50">
                    <span>{formatDate(selectedDate)}</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="flex rounded-lg bg-slate-100/80 p-1.5 mb-2 text-sm font-bold">
                  <button
                    onClick={() => setPerfTab('top')}
                    className={`flex-1 py-2 text-center rounded-md transition-colors ${perfTab === 'top' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Top Performing
                  </button>
                  <button
                    onClick={() => setPerfTab('low')}
                    className={`flex-1 py-2 text-center rounded-md transition-colors ${perfTab === 'low' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Low Performing
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
                {loading && !d ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : (
                  (perfTab === 'top' ? d?.itemPerformance.top : d?.itemPerformance.low)?.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-12">No items sold yet on {formatDate(selectedDate)}</p>
                  ) : (
                    (perfTab === 'top' ? d?.itemPerformance.top : d?.itemPerformance.low)?.map((item, i) => (
                      <div key={i} className="flex justify-between items-start group">
                        <div className="pr-4">
                          <p className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors text-sm">{item.name}</p>
                          <p className="text-slate-500 text-xs font-medium mt-0.5">{item.qtySold} sold</p>
                        </div>
                        <div className="font-extrabold text-slate-700 whitespace-nowrap text-sm">{fmt(item.revenue)}</div>
                      </div>
                    ))
                  )
                )}

                {d && (
                  <p className="text-[11px] text-blue-700/80 bg-blue-50/50 border border-blue-100 p-3 rounded-xl leading-relaxed font-medium mt-4">
                    Note: Data updates every 60 seconds from the local POS. For full history, check the Orders tab.
                  </p>
                )}
              </div>

              {/* Expenses & Withdrawals pinned at bottom */}
              <div className="border-t border-slate-200 p-6 bg-slate-50/80">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 text-[15px]">Expenses &amp; Withdrawals</h3>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium bg-white shadow-sm">
                    <span>{formatDate(selectedDate)}</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mt-3">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="font-extrabold text-slate-900 text-lg">{fmt(d?.expensesWithdrawals.total ?? 0)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Leakage Modal ──────────────────────────────────────────────────── */}
      {/* ── Leakage Modal (Detailed Table Format) ─────────────────────────── */}
      {leakageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-800 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {leakageTitle} Audit Logs
                  </h2>
                  <p className="text-xs text-slate-300">
                    Granular table breakdown of order items, timings, and operational status changes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeakageModalOpen(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingLeakage ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-600 text-sm font-medium">Loading detailed audit tables...</p>
                </div>
              ) : leakageLogs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-base">No Records Found</p>
                  <p className="text-slate-400 text-xs mt-1">There are no audit logs or leakage records for this category today.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                        <th className="py-3.5 px-4 w-44">Branch &amp; Table</th>
                        <th className="py-3.5 px-4 w-32">Ref #</th>
                        <th className="py-3.5 px-4 w-36">Timing</th>
                        <th className="py-3.5 px-4 w-32">Status</th>
                        <th className="py-3.5 px-4">Detailed Dish & Audit Breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {leakageLogs.map((log, idx) => {
                        // Determine row status color
                        const isCancelled = log.status === 'Cancelled' || leakageType === 'kotsCancelled';
                        const isModified = leakageType === 'kotsModified' || leakageType === 'billsModified' || log.status === 'Modified';
                        const isBilled = log.status === 'Billed' || log.status === 'Paid' || log.status === 'Active';

                        let statusBadgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                        let statusText = log.status || 'Audited';

                        if (isCancelled) {
                          statusBadgeColor = 'bg-red-100 text-red-800 border-red-300 font-bold shadow-2xs';
                          statusText = 'Cancelled';
                        } else if (isModified) {
                          statusBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300 font-bold shadow-2xs';
                          statusText = 'Modified';
                        } else if (isBilled) {
                          statusBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-2xs';
                          statusText = log.status || 'Active / Billed';
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors align-top">
                            {/* Column 1: Table Number / ID */}
                            <td className="py-4 px-4 font-bold text-slate-900">
                              {log.branchName && (
                                <div className="text-[11px] font-extrabold text-blue-700 mb-1.5 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 shadow-2xs" />
                                  <span>{log.branchName} {log.branchCode && `(${log.branchCode})`}</span>
                                </div>
                              )}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                                <span>Table {log.tableNumber || 'N/A'}</span>
                              </div>
                            </td>

                            {/* Column 2: Order/Bill Reference */}
                            <td className="py-4 px-4">
                              <div className="font-extrabold text-slate-800 text-xs">
                                {log.orderNumber ? `ORD-${log.orderNumber}` : `BILL-${log.billNumber || log._id?.toString().slice(-4)}`}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {log._id?.toString().slice(-6)}
                              </div>
                            </td>

                            {/* Column 3: Timing */}
                            <td className="py-4 px-4">
                              <div className="text-xs font-medium text-slate-700">
                                {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              {log.updatedAt && log.updatedAt !== log.createdAt && (
                                <div className="text-[10px] text-blue-600 font-medium mt-1">
                                  Upd: {new Date(log.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </td>

                            {/* Column 4: Color Coded Status Badge */}
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${statusBadgeColor}`}>
                                {statusText}
                              </span>
                            </td>

                            {/* Column 5: Detailed Dish Breakdown & Comparison Table */}
                            <td className="py-4 px-4">
                              {/* ── KOTs Modified Table Breakdown ────────────────────────────── */}
                              {leakageType === 'kotsModified' && (
                                <div className="space-y-3">
                                  {log.kots?.filter((k: any) => k.status === 'Modified').map((k: any, i: number) => (
                                    <div key={i} className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/20 shadow-2xs">
                                      <div className="bg-blue-100/70 px-3 py-1.5 border-b border-blue-200 flex justify-between items-center">
                                        <span className="text-xs font-extrabold text-blue-900">
                                          KOT #{k.kotNumber} — Modification Audit Table
                                        </span>
                                        <span className="text-[11px] font-mono text-blue-700">
                                          Printed at: {k.printedAt}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-blue-200">
                                        {/* Original Written Table */}
                                        <div className="p-2.5 bg-white/80">
                                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Originally Written Dishes (In KOT)
                                          </div>
                                          <table className="w-full text-xs border border-slate-200 rounded overflow-hidden">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                              <tr>
                                                <th className="p-1.5">Dish Name</th>
                                                <th className="p-1.5 text-center">Qty</th>
                                                <th className="p-1.5 text-right">Price</th>
                                                <th className="p-1.5 text-right">Total</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                              {k.items?.map((item: any, j: number) => (
                                                <tr key={j} className="hover:bg-slate-50">
                                                  <td className="p-1.5 text-slate-800">{item.name} {item.variantName && `(${item.variantName})`}</td>
                                                  <td className="p-1.5 text-center font-bold text-blue-700">{item.quantity}</td>
                                                  <td className="p-1.5 text-right text-slate-500 font-mono">₹{item.price}</td>
                                                  <td className="p-1.5 text-right font-mono text-slate-800 font-bold">₹{item.price * item.quantity}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>

                                        {/* Current / Modified State Table */}
                                        <div className="p-2.5 bg-blue-50/30">
                                          <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                                            Current Modified Order Dishes
                                          </div>
                                          {log.items && log.items.length > 0 ? (
                                            <table className="w-full text-xs border border-blue-200/80 rounded overflow-hidden bg-white">
                                              <thead className="bg-blue-50/70 text-blue-800 font-semibold border-b border-blue-200">
                                                <tr>
                                                  <th className="p-1.5">Dish Name</th>
                                                  <th className="p-1.5 text-center">Qty</th>
                                                  <th className="p-1.5 text-right">Price</th>
                                                  <th className="p-1.5 text-right">Total</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-blue-100 font-medium">
                                                {log.items.map((item: any, j: number) => (
                                                  <tr key={j} className="hover:bg-blue-50/40">
                                                    <td className="p-1.5 text-slate-800">{item.name} {item.variantName && `(${item.variantName})`}</td>
                                                    <td className="p-1.5 text-center font-bold text-blue-800">{item.quantity}</td>
                                                    <td className="p-1.5 text-right text-slate-500 font-mono">₹{item.price}</td>
                                                    <td className="p-1.5 text-right font-mono text-blue-900 font-bold">₹{item.price * item.quantity}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded text-center text-xs font-bold text-red-700">
                                              All dishes removed from this order after KOT generation.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── KOTs Cancelled Table Breakdown ───────────────────────────── */}
                              {leakageType === 'kotsCancelled' && (
                                <div className="space-y-3">
                                  {log.kots?.filter((k: any) => k.status === 'Cancelled').map((k: any, i: number) => (
                                    <div key={i} className="border border-red-200 rounded-lg overflow-hidden bg-red-50/40 shadow-2xs">
                                      <div className="bg-red-100 px-3 py-1.5 border-b border-red-200 flex justify-between items-center">
                                        <span className="text-xs font-extrabold text-red-900 flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                          Cancelled KOT #{k.kotNumber} Table Breakdown
                                        </span>
                                        <span className="text-[11px] font-mono text-red-700">
                                          Printed at: {k.printedAt}
                                        </span>
                                      </div>
                                      
                                      <div className="p-2.5 bg-white">
                                        <table className="w-full text-xs border border-red-200 rounded overflow-hidden">
                                          <thead className="bg-red-50/80 text-red-900 font-bold border-b border-red-200">
                                            <tr>
                                              <th className="p-2">Cancelled Dish Name</th>
                                              <th className="p-2 text-center">Qty Ordered</th>
                                              <th className="p-2 text-right">Unit Price</th>
                                              <th className="p-2 text-right">Total Lost Value</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-red-100 font-medium">
                                            {k.items?.map((item: any, j: number) => (
                                              <tr key={j} className="bg-red-50/20 hover:bg-red-50/60 transition-colors">
                                                <td className="p-2 text-red-900 font-semibold">{item.name} {item.variantName && `(${item.variantName})`}</td>
                                                <td className="p-2 text-center font-bold text-red-700">{item.quantity}</td>
                                                <td className="p-2 text-right text-slate-500 font-mono">₹{item.price}</td>
                                                <td className="p-2 text-right font-mono text-red-800 font-extrabold">₹{item.price * item.quantity}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── Bills Modified Table Breakdown ───────────────────────────── */}
                              {leakageType === 'billsModified' && (
                                <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/30 shadow-2xs">
                                  <div className="bg-blue-100/80 px-3 py-1.5 border-b border-blue-200 flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-blue-900">
                                      Modified Bill Dishes Table
                                    </span>
                                    <span className="text-xs font-bold text-blue-700">
                                      Modified State
                                    </span>
                                  </div>
                                  <div className="p-2.5 bg-white">
                                    <table className="w-full text-xs border border-blue-200 rounded overflow-hidden">
                                      <thead className="bg-blue-50/70 text-blue-900 font-bold border-b border-blue-200">
                                        <tr>
                                          <th className="p-2">Billed Dish Name</th>
                                          <th className="p-2 text-center">Qty</th>
                                          <th className="p-2 text-right">Rate</th>
                                          <th className="p-2 text-right">Total Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-blue-100 font-medium">
                                        {log.orderId?.items?.map((item: any, i: number) => (
                                          <tr key={i} className="hover:bg-blue-50/30">
                                            <td className="p-2 text-slate-800 font-semibold">{item.name}</td>
                                            <td className="p-2 text-center font-bold text-blue-800">{item.quantity}</td>
                                            <td className="p-2 text-right text-slate-500 font-mono">₹{item.price}</td>
                                            <td className="p-2 text-right font-mono text-blue-900 font-bold">₹{item.price * item.quantity}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* ── KOTs Not In Bills Table Breakdown ────────────────────────── */}
                              {leakageType === 'kotsNotInBills' && (
                                <div className="border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50/20 shadow-2xs">
                                  <div className="bg-emerald-100/80 px-3 py-1.5 border-b border-emerald-200 flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-emerald-900">
                                      Active / Unbilled Order Dishes Table
                                    </span>
                                    <span className="text-xs font-bold text-emerald-800">
                                      Total KOTs: {log.kots?.length || 0}
                                    </span>
                                  </div>
                                  <div className="p-2.5 bg-white">
                                    <table className="w-full text-xs border border-emerald-200 rounded overflow-hidden">
                                      <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-200">
                                        <tr>
                                          <th className="p-2">Ordered Dish Name</th>
                                          <th className="p-2 text-center">Qty</th>
                                          <th className="p-2 text-right">Rate</th>
                                          <th className="p-2 text-right">Line Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-emerald-100 font-medium">
                                        {log.items?.map((item: any, i: number) => (
                                          <tr key={i} className="hover:bg-emerald-50/30">
                                            <td className="p-2 text-slate-800 font-semibold">{item.name} {item.variantName && `(${item.variantName})`}</td>
                                            <td className="p-2 text-center font-bold text-emerald-800">{item.quantity}</td>
                                            <td className="p-2 text-right text-slate-500 font-mono">₹{item.price}</td>
                                            <td className="p-2 text-right font-mono text-emerald-900 font-bold">₹{item.price * item.quantity}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* ── Shifted / Reprinted / Waived Off General Tables ───────────── */}
                              {(leakageType === 'kotsShifted' || leakageType === 'billsReprinted' || leakageType === 'waivedOff') && (
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                  <table className="w-full text-xs">
                                    <tbody>
                                      {leakageType === 'kotsShifted' && (
                                        <tr>
                                          <td className="py-1 font-bold text-slate-600">Table Shift Count:</td>
                                          <td className="py-1 font-extrabold text-blue-600">{log.tableShiftCount} times</td>
                                        </tr>
                                      )}
                                      {leakageType === 'billsReprinted' && (
                                        <>
                                          <tr>
                                            <td className="py-1 font-bold text-slate-600">Reprint Frequency:</td>
                                            <td className="py-1 font-extrabold text-blue-600">{log.reprintCount} times</td>
                                          </tr>
                                          <tr>
                                            <td className="py-1 font-bold text-slate-600">Bill Grand Total:</td>
                                            <td className="py-1 font-mono font-bold text-emerald-700">{fmt(log.grandTotal)}</td>
                                          </tr>
                                        </>
                                      )}
                                      {leakageType === 'waivedOff' && (
                                        <>
                                          <tr>
                                            <td className="py-1 font-bold text-slate-600">Waived Off Amount:</td>
                                            <td className="py-1 font-mono font-extrabold text-red-600">{fmt(log.waiveOff)}</td>
                                          </tr>
                                          <tr>
                                            <td className="py-1 font-bold text-slate-600">Bill Grand Total:</td>
                                            <td className="py-1 font-mono font-bold text-slate-800">{fmt(log.grandTotal)}</td>
                                          </tr>
                                        </>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Order Type Card sub-component ───────────────────────────────────────────

interface OrderTypeCardProps {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  bgGlow: string;
  revenue: number;
  count: number;
  tta: number;
  loading: boolean;
}

const HOURLY_BUCKETS = [
  { label: '01:00am - 05:00am', revenue: 0 },
  { label: '05:00am - 09:00am', revenue: 0 },
  { label: '09:00am - 01:00pm', revenue: 0 },
  { label: '01:00pm - 05:00pm', revenue: 0 },
  { label: '05:00pm - 09:00pm', revenue: 0 },
  { label: '09:00pm - 01:00am', revenue: 0 },
];

function OrderTypeCard({ icon, label, colorClass, bgGlow, revenue, count, tta, loading }: OrderTypeCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgGlow} rounded-bl-full -mr-10 -mt-10 z-0 transition-transform group-hover:scale-110`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${colorClass}`}>
            {icon} {label}
          </div>
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {loading ? '—' : `₹ ${revenue.toLocaleString('en-IN')}`}
        </h3>
        <p className="text-sm font-medium text-slate-500 mt-2 mb-4">{loading ? '—' : `${count} Order${count !== 1 ? 's' : ''}`}</p>
        {tta > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> T.T.A avg. {tta} mins
          </div>
        )}
      </div>
    </div>
  );
}
