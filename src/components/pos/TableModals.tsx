import React, { useState } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { CalendarCheck, GitMerge, X, Users, Phone, Clock, Calendar, CheckSquare, Square } from 'lucide-react';

export const TableModals: React.FC = () => {
  const {
    reservationModal,
    closeReservationModal,
    createReservation,
    mergeTableModal,
    closeMergeModal,
    mergeTables,
    tables,
  } = useERPStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resGuests, setResGuests] = useState('4');
  const [resDate, setResDate] = useState(todayStr);
  const [resTime, setResTime] = useState('15:00');
  const [selectedExtraTables, setSelectedExtraTables] = useState<string[]>([]);

  const [targetTableId, setTargetTableId] = useState<string>('');

  const availableExtraTables = tables.filter(
    (t) => t._id !== reservationModal.tableId && t.status === 'Available'
  );

  const targetTableOptions = tables.filter(
    (t) => t._id !== mergeTableModal.tableId && t.status === 'Available'
  );

  const toggleExtraTable = (id: string) => {
    setSelectedExtraTables((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationModal.tableId || !resName || !resPhone) return;
    createReservation(
      reservationModal.tableId,
      resName,
      resPhone,
      parseInt(resGuests, 10) || 4,
      resDate,
      resTime,
      selectedExtraTables
    );
    setResName('');
    setResPhone('');
    setSelectedExtraTables([]);
  };

  const handleMergeTables = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeTableModal.tableId || !targetTableId) return;
    mergeTables(mergeTableModal.tableId, targetTableId);
    setTargetTableId('');
  };

  return (
    <>
      {/* =======================
          RESERVATION MODAL
      ======================= */}
      {reservationModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Assign Table Reservation</h3>
                  <p className="text-[11px] text-slate-500">
                    Primary Table: <span className="font-bold text-slate-800">
                      {tables.find((t) => t._id === reservationModal.tableId)?.tableNumber || 'Selected'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeReservationModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Guest Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sultan Al-Amri"
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                  <div className="relative mt-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={resPhone}
                      onChange={(e) => setResPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Guests</label>
                  <div className="relative mt-1">
                    <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={resGuests}
                      onChange={(e) => setResGuests(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Date</label>
                  <div className="relative mt-1">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      required
                      value={resDate}
                      onChange={(e) => setResDate(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Time</label>
                  <div className="relative mt-1">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="time"
                      required
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Table Selection for Large Parties */}
              {availableExtraTables.length > 0 && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reserve Additional Tables (Optional for 2+ tables)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {availableExtraTables.map((t) => {
                      const isChecked = selectedExtraTables.includes(t._id);
                      return (
                        <button
                          type="button"
                          key={t._id}
                          onClick={() => toggleExtraTable(t._id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isChecked
                              ? 'bg-amber-500/15 border-amber-500 text-amber-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="truncate">T-{t.tableNumber} ({t.capacity}s)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚡ <span className="font-bold">15-Min Auto-Release Rule:</span> Reserved for <span className="font-extrabold">{resDate} at {resTime}</span>. If the customer does not arrive and no POS order is placed within <span className="font-extrabold">15 minutes</span> past the reserved time, the system automatically releases the table back to Available.
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeReservationModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md"
                >
                  Confirm Reservation ({1 + selectedExtraTables.length} Table{selectedExtraTables.length > 0 ? 's' : ''})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================
          MERGE TABLES MODAL
      ======================= */}
      {mergeTableModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">Merge Adjacent Tables</h3>
              </div>
              <button
                onClick={closeMergeModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMergeTables} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Select Target Table to Merge In
                </label>
                <select
                  required
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Choose available table --</option>
                  {targetTableOptions.map((t) => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} ({t.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeMergeModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md"
                >
                  Merge Tables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
