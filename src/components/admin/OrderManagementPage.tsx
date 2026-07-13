import React, { useState, useMemo } from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Printer,
  RotateCcw,
  Building2,
} from 'lucide-react';

export interface FullOrderRecord {
  orderNo: string;
  tableType: string;
  customer: string;
  payment: 'Cash' | 'Card POS' | 'UPI' | 'Pending';
  grandTotal: number;
  status: 'Completed' | 'Current' | 'Cancelled' | 'Saved';
  dateTime: string;
  dayOfWeek: string;
  dayDate: string; // e.g. "10"
  month: string;   // e.g. "Jul"
  year: string;    // e.g. "2026"
  branchId: string;
  branchName: string;
}

export const OrderManagementPage: React.FC = () => {
  const { setActiveScreen, branchFilterId, branches, openPrintModal } = useERPStore();

  // Selected Order for Modal Details
  const [selectedOrder, setSelectedOrder] = useState<FullOrderRecord | null>(null);

  const getOrderItemsBreakdown = (order: FullOrderRecord) => {
    const mainDishPrice = Math.round(order.grandTotal * 0.6);
    const sideDishPrice = Math.max(0, order.grandTotal - mainDishPrice);
    return [
      { name: 'Arabian Special Mutton Mandi', variant: 'Full Platter', qty: 1, price: mainDishPrice },
      { name: 'Kunafa Royal & Beverages', variant: 'Standard', qty: 1, price: sideDishPrice },
    ];
  };

  const handlePrintOrder = (order: FullOrderRecord) => {
    openPrintModal(
      'BILL',
      {
        _id: order.orderNo,
        billNumber: `BILL-${order.orderNo}`,
        branchId: order.branchId,
        orderId: order.orderNo,
        tableNumber: order.tableType,
        subtotal: Math.round(order.grandTotal / 1.05),
        cgst: Math.round((order.grandTotal - order.grandTotal / 1.05) / 2),
        sgst: Math.round((order.grandTotal - order.grandTotal / 1.05) / 2),
        grandTotal: order.grandTotal,
        paymentStatus: order.status === 'Completed' ? 'Paid' : 'Pending',
        createdAt: order.dateTime,
      } as any
    );
  };

  // Status Tab
  const [activeTab, setActiveTab] = useState<'All' | 'Current' | 'Completed' | 'Cancelled' | 'Saved'>('All');

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable Filter Drawer state
  const [showFilters, setShowFilters] = useState(false);

  // Column / Date filters
  const [filterDay, setFilterDay] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState(branchFilterId === 'ALL' ? 'ALL' : branchFilterId);
  const [filterPayment, setFilterPayment] = useState('ALL');

  // Sort Order
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'HIGHEST' | 'LOWEST'>('NEWEST');

  // Dynamic live order records across Arabian Mandi branches
  const allOrdersData: FullOrderRecord[] = useMemo(() => {
    const ordersMap = useERPStore.getState().activeOrders || {};
    return Object.values(ordersMap).map((ord) => {
      const tableObj = useERPStore.getState().tables.find((t) => t._id === ord.tableId);
      const branchObj = branches.find((b) => b._id === ord.branchId || b._id === useERPStore.getState().currentBranch?._id);
      const dt = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        orderNo: ord.orderNumber || ord.orderId,
        tableType: tableObj ? `${tableObj.tableNumber || tableObj.name}` : 'Dining Table',
        customer: ord.customerName || 'Walk-in Guest',
        payment: (ord.paymentMethod || 'Pending') as 'Cash' | 'Card POS' | 'UPI' | 'Pending',
        grandTotal: ord.total || 0,
        status: (ord.status === 'Paid' ? 'Completed' : ord.status === 'Settled' ? 'Completed' : 'Current') as 'Completed' | 'Current' | 'Cancelled' | 'Saved',
        dateTime: dt.toLocaleString(),
        dayOfWeek: days[dt.getDay()],
        dayDate: String(dt.getDate()).padStart(2, '0'),
        month: months[dt.getMonth()],
        year: String(dt.getFullYear()),
        branchId: branchObj?._id || useERPStore.getState().currentBranch?._id || '',
        branchName: branchObj?.name?.replace('Arabian Mandi – ', '') || 'Main Branch',
      };
    });
  }, [useERPStore().activeOrders, branches]);

  // Tab counts
  const countAll = allOrdersData.length;
  const countCurrent = allOrdersData.filter((o) => o.status === 'Current').length;
  const countCompleted = allOrdersData.filter((o) => o.status === 'Completed').length;

  // Filtered & Sorted records
  const filteredOrders = useMemo(() => {
    return allOrdersData
      .filter((row) => {
        if (activeTab !== 'All' && row.status !== activeTab) return false;
        if (filterDay !== 'ALL' && row.dayOfWeek !== filterDay) return false;
        if (filterDate !== 'ALL' && row.dayDate !== filterDate) return false;
        if (filterMonth !== 'ALL' && row.month !== filterMonth) return false;
        if (filterYear !== 'ALL' && row.year !== filterYear) return false;
        if (filterBranch !== 'ALL' && row.branchId !== filterBranch) return false;
        if (filterPayment !== 'ALL' && row.payment !== filterPayment) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchNo = row.orderNo.toLowerCase().includes(q);
          const matchCust = row.customer.toLowerCase().includes(q);
          const matchTable = row.tableType.toLowerCase().includes(q);
          if (!matchNo && !matchCust && !matchTable) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'HIGHEST') return b.grandTotal - a.grandTotal;
        if (sortOrder === 'LOWEST') return a.grandTotal - b.grandTotal;
        if (sortOrder === 'OLDEST') return a.orderNo.localeCompare(b.orderNo);
        return b.orderNo.localeCompare(a.orderNo);
      });
  }, [
    allOrdersData,
    activeTab,
    filterDay,
    filterDate,
    filterMonth,
    filterYear,
    filterBranch,
    filterPayment,
    searchQuery,
    sortOrder,
  ]);

  const resetAllFilters = () => {
    setFilterDay('ALL');
    setFilterDate('ALL');
    setFilterMonth('ALL');
    setFilterYear('ALL');
    setFilterBranch('ALL');
    setFilterPayment('ALL');
    setSearchQuery('');
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => setActiveScreen('ADMIN_ANALYTICS')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">Order Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage all restaurant orders for Arabian Mandi across all days, dates & column filters
          </p>
        </div>

        {/* Action button to reset filters */}
        <button
          onClick={resetAllFilters}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset All Filters</span>
        </button>
      </div>

      {/* Top Status Navigation Tabs matching Image 2 */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-bold">
        <button
          onClick={() => setActiveTab('All')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'All'
              ? 'border-red-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'All' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Current')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'Current'
              ? 'border-red-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Current</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'Current' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {countCurrent}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'Completed'
              ? 'border-red-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Completed</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'Completed' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {countCompleted}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Cancelled')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'Cancelled'
              ? 'border-red-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Cancelled</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600">
            0
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Saved')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'Saved'
              ? 'border-red-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Saved</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600">
            0
          </span>
        </button>
      </div>

      {/* Toolbar: Search input + Filter & Sort Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input matching Image 2 */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order No, Customer, or Table..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              showFilters
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>

          <button
            onClick={() =>
              setSortOrder((prev) =>
                prev === 'NEWEST' ? 'HIGHEST' : prev === 'HIGHEST' ? 'LOWEST' : 'NEWEST'
              )
            }
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all shadow-sm"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>
              Sort: {sortOrder === 'NEWEST' ? 'Newest First' : sortOrder === 'HIGHEST' ? 'Amount: High to Low' : 'Amount: Low to High'}
            </span>
          </button>
        </div>
      </div>

      {/* Advanced Column & Date/Time Filter Drawer */}
      {showFilters && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Advanced Column & Date Filters</span>
            </h4>
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Filter by Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Day
              </label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Days</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Date (Day #)
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Dates</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Month */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Months</option>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Year */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Filter by Branch */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Branch
              </label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name.replace('Arabian Mandi – ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Payment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Payment
              </label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Payment Types</option>
                <option value="Cash">Cash</option>
                <option value="Card POS">Card POS</option>
                <option value="UPI">UPI</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Order Table Container matching Image 2 layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-4 px-6">Order No</th>
                <th className="py-4 px-6">Table / Type</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Grand Total</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Date / Time</th>
                <th className="py-4 px-6">Branch</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    No matching orders found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((row) => (
                  <tr
                    key={row.orderNo}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {row.orderNo}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold border border-slate-200/60 inline-block">
                        {row.tableType}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">
                      {row.customer}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {row.payment}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                      ₹{row.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      {row.status === 'Completed' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                          <span>Completed</span>
                        </span>
                      ) : row.status === 'Current' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 font-extrabold text-[11px] border border-red-200/60">
                          <Clock className="w-3 h-3" />
                          <span>Current</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[11px]">
                          <XCircle className="w-3 h-3" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {row.dateTime}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{row.branchName}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(row)}
                          title="View Order Details"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintOrder(row)}
                          title="Print Receipt"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ORDER DETAILS & ITEMIZED DISH BREAKDOWN MODAL OVERLAY (EYE BUTTON)
      ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-extrabold font-mono text-amber-400">
                    {selectedOrder.orderNo}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      selectedOrder.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedOrder.status === 'Current'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{selectedOrder.branchName}</span>
                  <span>•</span>
                  <span>{selectedOrder.dateTime}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Table Info Strip */}
            <div className="p-5 bg-slate-50 border-b border-slate-200/80 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Customer</span>
                <span className="font-extrabold text-slate-900">{selectedOrder.customer}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Table / Section</span>
                <span className="font-extrabold text-slate-900">{selectedOrder.tableType}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Payment Mode</span>
                <span className="font-extrabold text-amber-600">{selectedOrder.payment}</span>
              </div>
            </div>

            {/* Itemized Dishes List */}
            <div className="p-6 max-h-80 overflow-y-auto space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Ordered Dishes & Portions
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {getOrderItemsBreakdown(selectedOrder).map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Portion: {item.variant} | Qty: x{item.qty}
                      </p>
                    </div>
                    <div className="text-right font-extrabold text-slate-900">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Before GST)</span>
                <span className="font-bold">₹{(selectedOrder.grandTotal / 1.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span className="font-bold">₹{(selectedOrder.grandTotal - selectedOrder.grandTotal / 1.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-amber-600">₹{selectedOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
