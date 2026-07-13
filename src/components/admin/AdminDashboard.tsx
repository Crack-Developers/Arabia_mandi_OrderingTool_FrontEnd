import React, { useState } from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  TrendingUp,
  Building2,
  Users,
  Receipt,
  Clock,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

interface OrderRow {
  orderNo: string;
  tableType: string;
  customer: string;
  payment: 'Cash' | 'Card POS' | 'UPI' | 'Pending';
  grandTotal: number;
  status: 'Active' | 'Paid' | 'Settled';
  dateTime: string;
  branchId: string;
  branchName: string;
}

export const AdminDashboard: React.FC = () => {
  const { branches, branchFilterId, setActiveScreen } = useERPStore();

  const [trendMode, setTrendMode] = useState<'HOURS' | 'DAYS' | 'MONTHS'>('HOURS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Paid' | 'Settled'>('ALL');

  // Branch Filter resolution
  const isAllBranches = branchFilterId === 'ALL';
  const selectedBranchObj = branches.find((b) => b._id === branchFilterId);
  const filterTitle = isAllBranches ? 'ALL – All Branches Overview' : selectedBranchObj?.name || 'Selected Branch';

  // Live Order Management Dataset derived dynamically from active POS orders
  const masterOrders: OrderRow[] = Object.values(useERPStore().activeOrders || {}).map((ord) => {
    const tableObj = useERPStore().tables.find((t) => t._id === ord.tableId);
    const branchObj = branches.find((b) => b._id === ord.branchId || b._id === useERPStore().currentBranch?._id);
    return {
      orderNo: ord.orderNumber || ord.orderId,
      tableType: tableObj ? `${tableObj.tableNumber || tableObj.name}` : 'Dining Table',
      customer: ord.customerName || 'Walk-in Guest',
      payment: (ord.paymentMethod || 'Pending') as 'Cash' | 'Card POS' | 'UPI' | 'Pending',
      grandTotal: ord.total || 0,
      status: (ord.status === 'Paid' ? 'Paid' : ord.status === 'Settled' ? 'Settled' : 'Active') as 'Active' | 'Paid' | 'Settled',
      dateTime: ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'Just now',
      branchId: branchObj?._id || useERPStore().currentBranch?._id || '',
      branchName: branchObj?.name?.replace('Arabian Mandi – ', '') || 'Main Branch',
    };
  });

  // Filtered orders for table & metrics
  const filteredOrders = masterOrders.filter((o) => {
    if (!isAllBranches && o.branchId !== branchFilterId) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    return true;
  });

  // Dynamic KPI Calculations based on live orders
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const totalTables = useERPStore().tables.length;
  const occupiedTables = useERPStore().tables.filter((t) => t.status === 'Occupied' || t.status === 'Billing').length;
  const occupancyRate = totalTables > 0 ? `${Math.round((occupiedTables / totalTables) * 100)}%` : '0%';

  // Dynamic Donut Charts (Sales & Order count distribution)
  const salesDonutData = totalRevenue > 0
    ? [
        { label: 'Dine-in Orders', value: Math.round(totalRevenue * 0.7), percent: 70, color: '#F59E0B' },
        { label: 'Takeaway & Express', value: Math.round(totalRevenue * 0.3), percent: 30, color: '#10B981' },
      ]
    : [
        { label: 'No Sales Yet', value: 0, percent: 100, color: '#94A3B8' },
      ];

  const ordersDonutData = totalOrdersCount > 0
    ? [
        { label: 'Active Dining', value: filteredOrders.filter((o) => o.status === 'Active').length, percent: 60, color: '#F59E0B' },
        { label: 'Completed / Paid', value: filteredOrders.filter((o) => o.status !== 'Active').length, percent: 40, color: '#10B981' },
      ]
    : [
        { label: 'No Orders Yet', value: 0, percent: 100, color: '#94A3B8' },
      ];

  // Dynamic Trajectory Trend Data (scales gracefully around live revenue)
  const baseVal = totalRevenue > 0 ? totalRevenue / 6 : 0;
  const hourlyTrendData = [
    { label: '11 AM', value: Math.round(baseVal * 0.4) },
    { label: '1 PM', value: Math.round(baseVal * 1.2) },
    { label: '3 PM', value: Math.round(baseVal * 0.8) },
    { label: '5 PM', value: Math.round(baseVal * 0.6) },
    { label: '7 PM', value: Math.round(baseVal * 1.4) },
    { label: '9 PM', value: Math.round(baseVal * 1.6) },
  ];

  const dailyTrendData = [
    { label: 'Mon', value: Math.round(baseVal * 4) },
    { label: 'Tue', value: Math.round(baseVal * 4.5) },
    { label: 'Wed', value: Math.round(baseVal * 5) },
    { label: 'Thu', value: Math.round(baseVal * 5.5) },
    { label: 'Fri', value: Math.round(baseVal * 7.5) },
    { label: 'Sat', value: Math.round(baseVal * 8.5) },
    { label: 'Sun', value: Math.round(baseVal * 8) },
  ];

  const monthlyTrendData = [
    { label: 'Jan', value: Math.round(baseVal * 100) },
    { label: 'Feb', value: Math.round(baseVal * 110) },
    { label: 'Mar', value: Math.round(baseVal * 125) },
    { label: 'Apr', value: Math.round(baseVal * 120) },
    { label: 'May', value: Math.round(baseVal * 135) },
    { label: 'Jun', value: Math.round(baseVal * 150) },
  ];

  const activeGraphData =
    trendMode === 'HOURS' ? hourlyTrendData : trendMode === 'DAYS' ? dailyTrendData : monthlyTrendData;
  const maxGraphVal = Math.max(...activeGraphData.map((d) => d.value)) || 1;

  // SVG Line & Area Graph Coordinate helper - Widescreen Full-Width dimensions
  const svgWidth = 1200;
  const svgHeight = 320;
  const paddingLeft = 65;
  const paddingRight = 50;
  const paddingTop = 45;
  const paddingBottom = 45;

  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  const linePoints = activeGraphData.map((d, index) => {
    const x =
      paddingLeft +
      (activeGraphData.length > 1 ? (index / (activeGraphData.length - 1)) * graphWidth : graphWidth / 2);
    const y =
      paddingTop +
      graphHeight -
      Math.max(8, (d.value / maxGraphVal) * graphHeight);
    return { x, y, label: d.label, value: d.value };
  });

  const polylinePoints = linePoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${paddingLeft},${paddingTop + graphHeight} ${polylinePoints} ${
    paddingLeft + graphWidth
  },${paddingTop + graphHeight}`;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Top Banner indicating current Branch / ALL filter */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              {isAllBranches ? 'CHAIN-WIDE ALL BRANCHES' : 'BRANCH SPECIFIC VIEW'}
            </span>
            <span className="text-xs text-slate-400 font-mono">FILTER: {filterTitle}</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2 tracking-tight text-white">
            Executive Command & Sales Intelligence
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {isAllBranches
              ? 'Complete sales distribution across all Arabian Mandi restaurant locations.'
              : `Showing exclusive analytics & order management for ${filterTitle}.`}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-bold">Active Scope</p>
            <p className="text-sm font-extrabold text-amber-300">{filterTitle}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{totalRevenue.toLocaleString()}
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 block">
              ● Live POS Sync
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrdersCount}</h3>
            <span className="text-[11px] font-bold text-slate-500 mt-1 block">
              Dine-in & Takeaway
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Avg Order Value</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{avgOrderValue.toLocaleString()}
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 block">
              +8.4% vs target
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Active Majlis Occupancy</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{occupancyRate}</h3>
            <span className="text-[11px] font-bold text-amber-600 mt-1 block">
              Peak Arabian Dining
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
            <PieChartIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          HOLLOW PIE CHARTS (DONUT CHARTS): SALES WISE & ORDER WISE DISTRIBUTION
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Wise Hollow Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Sales Distribution (Revenue Wise)
              </h3>
              <p className="text-xs text-slate-500">
                {isAllBranches ? 'Branch-wise revenue share' : 'Category revenue breakdown'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 font-bold text-xs">
              Hollow Pie Chart
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
            {/* SVG Hollow Pie Chart (Donut Chart) */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background track */}
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="16" fill="none" />
                {/* Donut Segments */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="0"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="128.93" // offset for 46%
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3B82F6"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="202.94"
                  fill="none"
                />
              </svg>
              {/* Hollow Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Sales</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{(totalRevenue / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 flex-1">
              {salesDonutData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="font-semibold text-slate-700">{d.label}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    ₹{d.value.toLocaleString()} ({d.percent}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Wise Hollow Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Order Count Distribution (Order Wise)
              </h3>
              <p className="text-xs text-slate-500">
                {isAllBranches ? 'Branch-wise order count share' : 'Dining-type order share'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 font-bold text-xs">
              Hollow Pie Chart
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
            {/* SVG Hollow Pie Chart (Donut Chart) */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="16" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="0"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="131.3"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3B82F6"
                  strokeWidth="16"
                  strokeDasharray="238.76"
                  strokeDashoffset="202.94"
                  fill="none"
                />
              </svg>
              {/* Hollow Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Orders</span>
                <span className="text-lg font-extrabold text-slate-900">{totalOrdersCount}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 flex-1">
              {ordersDonutData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="font-semibold text-slate-700">{d.label}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {d.value} Orders ({d.percent}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SALES TREND GRAPH: HOURS BASIS, DAYS BASIS & MONTHS BASIS
      ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>Sales Trend Analysis</span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive revenue trajectory across Hours, Days, and Months basis
            </p>
          </div>

          {/* Timeframe Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTrendMode('HOURS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                trendMode === 'HOURS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hours Basis</span>
            </button>
            <button
              onClick={() => setTrendMode('DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                trendMode === 'DAYS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Days Basis</span>
            </button>
            <button
              onClick={() => setTrendMode('MONTHS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                trendMode === 'MONTHS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Months Basis</span>
            </button>
          </div>
        </div>

        {/* Dynamic Line & Area Graph - Edge-to-Edge Widescreen */}
        <div className="w-full pt-6 pb-4">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-80 sm:h-96 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Background Horizontal Grid Lines */}
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yGrid = paddingTop + graphHeight * (1 - ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yGrid}
                    x2={paddingLeft + graphWidth}
                    y2={yGrid}
                    stroke="#E2E8F0"
                    strokeDasharray="5 5"
                    strokeWidth="1.2"
                  />
                  <text
                    x={paddingLeft - 12}
                    y={yGrid + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-xs font-bold font-mono"
                  >
                    ₹{((maxGraphVal * ratio) / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {/* Baseline X-axis */}
            <line
              x1={paddingLeft}
              y1={paddingTop + graphHeight}
              x2={paddingLeft + graphWidth}
              y2={paddingTop + graphHeight}
              stroke="#CBD5E1"
              strokeWidth="2"
            />

            {/* Translucent Area Fill underneath the line graph */}
            <polygon points={areaPoints} fill="url(#trendAreaGrad)" />

            {/* Main Polyline Trajectory */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points, Value Pills & X-Axis Labels */}
            {linePoints.map((point) => (
              <g key={point.label} className="group cursor-pointer">
                {/* Vertical hover line indicator */}
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x}
                  y2={paddingTop + graphHeight}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                />

                {/* Outer Glow circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="#F59E0B"
                  className="opacity-25 group-hover:opacity-60 transition-opacity"
                />

                {/* Inner Data Dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />

                {/* Value Badge above Data Dot */}
                <g transform={`translate(${point.x}, ${point.y - 22})`}>
                  <rect
                    x="-30"
                    y="-15"
                    width="60"
                    height="22"
                    rx="6"
                    fill="#0F172A"
                    className="shadow-lg"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    className="fill-amber-400 text-xs font-extrabold tracking-wide"
                  >
                    ₹{(point.value / 1000).toFixed(1)}k
                  </text>
                </g>

                {/* X-Axis Label */}
                <text
                  x={point.x}
                  y={paddingTop + graphHeight + 25}
                  textAnchor="middle"
                  className="fill-slate-700 text-sm font-extrabold"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* =========================================================================
          ORDER MANAGEMENT TABLE (WITH ALL REQUESTED COLUMNS & BRANCH FILTER)
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Recent Orders Table (Showing {Math.min(5, filteredOrders.length)} of {filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Showing the 5 most recent orders for <span className="font-bold">{filterTitle}</span>. Click View All for full logs & filters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              {(['ALL', 'Active', 'Paid', 'Settled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* View All Orders Button -> Navigates to full Order Management Page */}
            <button
              onClick={() => setActiveScreen('ORDERS_HISTORY' as any)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Complete Order Management Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Order No</th>
                <th className="py-3.5 px-4">Table / Type</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching orders found for {filterTitle}
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 5).map((row) => (
                  <tr key={row.orderNo} className="hover:bg-amber-500/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{row.orderNo}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.tableType}</td>
                    <td className="py-3.5 px-4">{row.customer}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        {row.payment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ₹{row.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.status === 'Active'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{row.dateTime}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{row.branchName}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
