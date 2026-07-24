import React, { useState } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { Grid3X3, Plus, X, Layers, Users, Trash2 } from 'lucide-react';
import { tableApi } from '../../services/api.service';

export const TableManagementScreen: React.FC = () => {
  const {
    currentBranch,
    tables,
    sections,
    activeOrders,
    checkExpiredReservations,
    setSelectedTable,
    setPosViewMode,
    setActiveScreen,
  } = useERPStore();

  React.useEffect(() => {
    checkExpiredReservations();
    const timer = setInterval(() => {
      checkExpiredReservations();
    }, 30000);
    return () => clearInterval(timer);
  }, [checkExpiredReservations]);

  const branchConfigSections =
    currentBranch?.sections && currentBranch.sections.length > 0
      ? currentBranch.sections.map((sec, idx) => ({
          _id: `sec-${idx + 1}`,
          name: sec.name,
        }))
      : sections.map((sec) => ({
          _id: sec._id,
          name: sec.name,
        }));

  const displaySectionsMap = new Map<string, any>();
  branchConfigSections.forEach((s) => displaySectionsMap.set(s.name, s));

  // Auto-discover any sections from tables that aren't in branch config
  tables
    .filter((t) => !currentBranch?._id || t.branchId === currentBranch._id || !t.branchId)
    .forEach((t) => {
      if (t.sectionName && !displaySectionsMap.has(t.sectionName)) {
        displaySectionsMap.set(t.sectionName, {
          _id: t.sectionId !== 'NEW' && t.sectionId ? t.sectionId : `dyn-${t.sectionName}`,
          name: t.sectionName,
        });
      }
    });

  const displaySections = Array.from(displaySectionsMap.values());

  const [filterSection, setFilterSection] = useState<string>('ALL');

  // Add Table Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [sectionOption, setSectionOption] = useState<string>(displaySections[0]?._id || 'NEW');
  const [customSectionName, setCustomSectionName] = useState('');
  const [capacity, setCapacity] = useState<number>(4);

  const branchTables = tables.filter(
    (t) => !currentBranch?._id || t.branchId === currentBranch._id || !t.branchId
  );

  const filtered = branchTables.filter((t) => {
    if (filterSection !== 'ALL') {
      const selectedSec = displaySections.find((s) => s._id === filterSection);
      return t.sectionId === filterSection || (selectedSec && t.sectionName === selectedSec.name);
    }
    return true;
  });

  // Group filtered tables by Section
  const groupedSectionMap: Record<string, typeof branchTables> = {};
  filtered.forEach((table) => {
    const foundSec = displaySections.find((sec) => sec._id === table.sectionId || sec.name === table.sectionName);
    const sectionName = foundSec?.name || table.sectionName || 'Dining Hall';
    if (!groupedSectionMap[sectionName]) groupedSectionMap[sectionName] = [];
    groupedSectionMap[sectionName].push(table);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30';
      case 'Occupied':
        return 'bg-red-500/15 text-red-800 border-red-500/30';
      case 'Reserved':
        return 'bg-amber-500/15 text-amber-800 border-amber-500/30';
      case 'Billing':
        return 'bg-blue-500/15 text-blue-800 border-blue-500/30';
      case 'Merged':
        return 'bg-purple-500/15 text-purple-800 border-purple-500/30';
      case 'Hold':
        return 'bg-orange-500/15 text-orange-800 border-orange-500/30';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Top Banner Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <Grid3X3 className="w-6 h-6 text-amber-600" />
              <span>Table Map & Section Status</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time occupancy monitoring across dining halls, family Majlis, and VIP rooms.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTableNumber(`T-${tables.length + 1}`);
                setSectionOption(displaySections[0]?._id || 'NEW');
                setCustomSectionName('');
                setCapacity(4);
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Table / Section</span>
            </button>
          </div>
        </div>

        {/* Section Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Section:</span>
            <button
              onClick={() => setFilterSection('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterSection === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Sections
            </button>
            {displaySections
              .map((s) => (
                <button
                  key={s._id}
                  onClick={() => setFilterSection(s._id!)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    filterSection === s._id
                      ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-500 ring-offset-1'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{s.name}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
        {/* Table Map Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No tables found matching criteria</p>
          <p className="text-xs text-slate-400 mt-1">Select another section, or add a new table above.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSectionMap).map(([sectionName, tablesInSection]) => (
            <div key={sectionName} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="group/header px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-extrabold text-sm flex items-center gap-2 shadow-sm">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>🍽️ {sectionName}</span>
                  <span className="text-xs font-semibold text-slate-400">({tablesInSection.length} tables)</span>
                  <span
                    className="opacity-0 group-hover/header:opacity-100 transition-opacity flex items-center justify-center ml-2 p-1 rounded hover:bg-slate-800 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete ALL ${tablesInSection.length} tables in ${sectionName}? This cannot be undone.`)) {
                        try {
                          for (const tbl of tablesInSection) {
                            await tableApi.delete(tbl._id);
                            
                            // Decrement section tablesCount
                            const bId = tbl.branchId || currentBranch?._id;
                            const state = useERPStore.getState();
                            if (bId && state.branches) {
                              const branch = state.branches.find((b:any) => String(b._id) === String(bId));
                              if (branch && branch.sections) {
                                const secIndex = branch.sections.findIndex((s:any) => s.name === sectionName);
                                if (secIndex >= 0 && (branch.sections[secIndex]?.tablesCount ?? 0) > 0) {
                                  const updatedBranch = JSON.parse(JSON.stringify(branch));
                                  updatedBranch.sections[secIndex].tablesCount--;
                                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/branches/${bId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                                    body: JSON.stringify(updatedBranch)
                                  }).catch(console.error);
                                }
                              }
                            }
                          }
                          const idsToRemove = new Set(tablesInSection.map((t: any) => t._id));
                          useERPStore.setState((state: any) => ({
                            tables: state.tables.filter((t: any) => !idsToRemove.has(t._id))
                          }));
                        } catch (err) {
                          console.error('Failed to delete section tables:', err);
                          alert('Failed to delete some tables. Please try again.');
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500 transition-colors" />
                  </span>
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-amber-500/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...tablesInSection]
                      .sort((a, b) => (a.tableNumber || '').localeCompare(b.tableNumber || '', undefined, { numeric: true }))
                      .map((table) => {
                      const order = activeOrders[table._id];
                      const foundSec = displaySections.find((sec) => sec._id === table.sectionId || sec.name === table.sectionName);
                      const sectionName = foundSec?.name || table.sectionName || 'Dining Hall';
                      const hasOrder = !!order && order.total > 0;
                      const effectiveStatus = table.status === 'Hold' || order?.status === 'Hold' || (hasOrder && table.status === 'Available')
                        ? 'Hold'
                        : table.status;

                      return (
                        <div
                          key={table._id}
                          className={`group p-5 rounded-2xl border-2 transition-all bg-white flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${getStatusColor(
                            effectiveStatus
                          )}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                                Table {table.tableNumber}
                                <Trash2
                                  className="w-4 h-4 text-slate-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this table?')) {
                                      try {
                                        await tableApi.delete(table._id);
                                        
                                        // Decrement section tablesCount
                                        const bId = table.branchId || currentBranch?._id;
                                        const state = useERPStore.getState();
                                        if (bId && state.branches) {
                                          const branch = state.branches.find((b:any) => String(b._id) === String(bId));
                                          if (branch && branch.sections) {
                                            const secIndex = branch.sections.findIndex((s:any) => s.name === sectionName);
                                            if (secIndex >= 0 && (branch.sections[secIndex]?.tablesCount ?? 0) > 0) {
                                              const updatedBranch = JSON.parse(JSON.stringify(branch));
                                              updatedBranch.sections[secIndex].tablesCount--;
                                              fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/branches/${bId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                                                body: JSON.stringify(updatedBranch)
                                              }).catch(console.error);
                                            }
                                          }
                                        }

                                        useERPStore.setState((state: any) => ({
                                          tables: state.tables.filter((t: any) => t._id !== table._id)
                                        }));
                                      } catch (err) {
                                        console.error('Failed to delete table:', err);
                                        alert('Failed to delete table. Please try again.');
                                      }
                                    }
                                  }}
                                />
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-white/80 font-bold text-xs shadow-sm uppercase">
                                {effectiveStatus === 'Hold' ? 'ON HOLD' : table.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-700 font-bold">{sectionName}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Capacity: {table.capacity} guests</p>

                            {table.status === 'Reserved' && table.reservation && (
                              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                                <div className="flex justify-between items-center">
                                  <p className="font-bold text-amber-900">{table.reservation.customerName}</p>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 font-extrabold text-[10px]">
                                    📅 {table.reservation.reservedDate ? `${table.reservation.reservedDate} ` : ''}⏰ {table.reservation.reservedTime || 'Immediate'}
                                  </span>
                                </div>
                                <p className="text-amber-800 text-[11px] mt-0.5">
                                  {table.reservation.phone} ({table.reservation.guests} pax)
                                </p>
                                <p className="text-[10px] text-amber-700 mt-0.5 font-mono">
                                  Auto-releases 15 mins after {table.reservation.reservedTime || 'time'}
                                </p>
                              </div>
                            )}

                            {order && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>Order #{order.orderNumber}</span>
                                  <span className="text-amber-700">₹{order.total.toLocaleString()}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {order.items.length} dish(es) • {order.kots.length} KOT(s)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-3 border-t border-slate-200/60">
                            <button
                              onClick={() => {
                                setSelectedTable(table._id);
                                setPosViewMode('ORDERING');
                                setActiveScreen('POS_WORKSPACE');
                              }}
                              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <span>Open POS</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table & Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Add New Table</h3>
                  <p className="text-[11px] text-slate-400">Configure dining section & seating capacity</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!tableNumber.trim()) return;
                if (sectionOption === 'NEW' && !customSectionName.trim()) return;
                useERPStore.getState().addTable({
                  tableNumber: tableNumber.trim(),
                  sectionId: sectionOption,
                  sectionName: customSectionName.trim(),
                  
                  capacity,
                });
                setShowAddModal(false);
              }}
              className="p-6 space-y-5"
            >
              {/* Section / Floor Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Section (e.g., Dining Hall, VIP Area)</span>
                </label>
                <select
                  value={sectionOption}
                  onChange={(e) => setSectionOption(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                >
                  {displaySections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name}
                    </option>
                  ))}
                  <option value="NEW">+ Create New Section...</option>
                </select>
              </div>

              {/* Custom Section Name Input if "NEW" */}
              {sectionOption === 'NEW' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-amber-900">
                      New Section Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Family Hall, VIP Room, Dining Hall"
                      value={customSectionName}
                      onChange={(e) => setCustomSectionName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Table Number & Capacity Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Table Number / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., T-14, VIP-3"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Seating Capacity</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick Seating Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Seating Presets
                </label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8, 12].map((pax) => (
                    <button
                      key={pax}
                      type="button"
                      onClick={() => setCapacity(pax)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        capacity === pax
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pax} Pax
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-extrabold text-xs text-slate-950 shadow-md transition-colors"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
