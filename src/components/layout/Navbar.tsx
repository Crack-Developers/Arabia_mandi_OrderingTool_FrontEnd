import React, { useState, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  LogOut,
  Settings,
  BarChart3,
  PieChart,
  Radio,
} from 'lucide-react';
import { ArabiaMandiLogo } from '../common/ArabiaMandiLogo';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeRole,
    logout,
    activeScreen,
    setActiveScreen,
    branches,
    branchFilterId,
    setBranchFilterId,
    isOfflineMode,
    setOfflineMode,
    notifications,
    markNotificationRead,
    syncQueue,
    isSyncing,
    triggerSyncQueue,
  } = useERPStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Electron Desktop LAN & Sync state
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [electronSync, setElectronSync] = useState<{ pendingCount?: number; isSyncing?: boolean; lastSyncAt?: string } | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api && api.isElectron) {
      api.getLocalIP?.().then((ip: string) => setLocalIp(ip)).catch(() => {});
      const fetchSync = () => {
        api.getSyncStatus?.().then((status: any) => {
          if (status) setElectronSync(status);
        }).catch(() => {});
      };
      fetchSync();
      const timer = setInterval(fetchSync, 6000);
      return () => clearInterval(timer);
    }
  }, []);

  const totalPending = syncQueue.length + (electronSync?.pendingCount || 0);
  const activeSyncing = isSyncing || electronSync?.isSyncing;

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 border-b border-slate-800 shadow-lg sticky top-0 z-40 no-print">
      {/* Brand & Multi-Branch Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <ArabiaMandiLogo size="sm" showSubtitle={false} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1
                className="font-extrabold text-base leading-tight tracking-wider text-amber-400 uppercase"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Arabia Mandi
              </h1>
              <span className="text-[11px] font-bold text-amber-300/80">العربية مندي</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              TASTE OF ARABIA • ERP v1.0
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-700 hidden sm:block" />

        {/* Branch Switcher (Super Admin Only) */}
        {activeRole === 'Super Admin' && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Building2 className="w-4 h-4 text-amber-400" />
            <select
              value={branchFilterId}
              onChange={(e) => setBranchFilterId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="ALL" className="bg-slate-900 text-amber-400 font-bold">
                ALL
              </option>
              {branches.map((b) => (
                <option key={b._id} value={b._id} className="bg-slate-900 text-white">
                  {b.branchCode}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top Navigation Center */}
      <div className="flex-1 flex justify-center items-center gap-1.5 overflow-x-auto no-scrollbar mx-4">
        {[
          { id: 'ADMIN_ANALYTICS', label: 'HQ Analytics', icon: BarChart3, roles: ['Super Admin'] },
          { id: 'ADMIN_DISH_SUMMARY', label: 'Summary', icon: PieChart, roles: ['Super Admin'] },
          { id: 'BRANCH_SETTINGS', label: 'Settings', icon: Settings, roles: ['Super Admin'] },
        ]
          .filter((item) => item.roles.includes(activeRole || 'Super Admin'))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveScreen(item.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>

      {/* Right side controls: LAN IP, Offline toggle, Sync status & Notifications */}
      <div className="flex items-center gap-3">
        {/* Desktop LAN Server IP Badge */}
        {localIp && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-2xs"
            title="Waiter mobile devices on the LAN should connect to this IP on port 3001"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>LAN: {localIp}:3001</span>
          </div>
        )}

        {/* Offline Mode Toggle Button */}
        <button
          onClick={() => setOfflineMode(!isOfflineMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            isOfflineMode
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
          title="Toggle Offline/Online Simulation"
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span>OFFLINE MODE</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>ONLINE {localIp ? '(LAN Active)' : ''}</span>
            </>
          )}
        </button>

        {/* Sync Status Badge / Trigger */}
        <button
          onClick={triggerSyncQueue}
          disabled={activeSyncing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            activeSyncing
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : totalPending > 0
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
          }`}
          title={
            totalPending > 0
              ? 'Click to push pending local mutations to cloud'
              : 'All offline changes synced with central cloud database'
          }
        >
          {activeSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Syncing ({totalPending})...</span>
            </>
          ) : totalPending > 0 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Queue ({totalPending})</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Synced</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition-all"
            title="System Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">System Notifications</span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time alerts</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3.5 hover:bg-slate-800/60 transition-all cursor-pointer flex gap-3 ${
                        n.read ? 'opacity-60' : 'bg-slate-800/30'
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {n.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Settings / Logout controls */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
            {(currentUser?.name || 'User')
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-200 leading-tight">{currentUser?.name || 'User'}</p>
            <p className="text-[10px] text-amber-400 font-medium">{activeRole}</p>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
            title="Log out and switch user"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>


    </header>
  );
};
