import React from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  DatabaseBackup,
  RefreshCw,
  WifiOff,
  Wifi,
  CheckCircle2,
  Clock,
  HardDrive,
  Activity,
  ArrowLeft,
} from 'lucide-react';

export const SyncQueueScreen: React.FC = () => {
  const { syncQueue, isSyncing, triggerSyncQueue, isOfflineMode, setOfflineMode, activeRole, setActiveScreen } = useERPStore();

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <button
            onClick={() =>
              setActiveScreen(activeRole === 'Super Admin' ? 'ADMIN_ANALYTICS' : 'POS_WORKSPACE')
            }
            className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 transition-all flex items-center gap-2 font-extrabold text-xs border border-slate-700 shadow-sm group cursor-pointer"
            title="Return back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                SYSTEM ENGINE (SYNC-001 / SYNC-002)
              </span>
              <span className="text-xs text-slate-400 font-mono">IndexedDB + Background Worker</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-2 tracking-tight">
              Offline Synchronization & Local Storage Queue
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Ensures Arabian Mandi operations continue 100% uninterrupted during internet outages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOfflineMode(!isOfflineMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              isOfflineMode
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>{isOfflineMode ? 'Simulating Offline Outage' : 'Online & Synchronizing'}</span>
          </button>

          <button
            onClick={triggerSyncQueue}
            disabled={isSyncing || syncQueue.length === 0}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Synchronize ({syncQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Storage Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Local IndexedDB Cache</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">arabian_mandi_erp_db</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              ● Active local persistence
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Pending Sync Items</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{syncQueue.length} Records</h3>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Waiting for network worker push
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Central MongoDB Status</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Connected / Replication</h3>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sync interval: Immediate on reconnect
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <DatabaseBackup className="w-5 h-5 text-amber-600" />
            <span>Pending Offline Transactions Queue</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-600">
            {syncQueue.length === 0 ? 'Queue Empty' : `${syncQueue.length} items`}
          </span>
        </div>

        {syncQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-sm text-slate-700">All offline transactions are synchronized</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              To test offline queuing, click the <strong className="text-red-500">OFFLINE MODE</strong> toggle at the top right of the navbar and create orders or bills in the Reception POS workspace.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Queue ID</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Payload Preview</th>
                <th className="py-3 px-4">Created Time</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {syncQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.id}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{item.entity}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {item.operation}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {JSON.stringify(item.payload)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{item.timestamp}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 font-bold text-xs border border-amber-300">
                      Pending Sync
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
