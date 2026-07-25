import React from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  BarChart3,
  Settings,
  DatabaseBackup,
  ShieldAlert,
  PieChart,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, activeRole, syncQueue } = useERPStore();

  const navItems = [
    {
      id: 'ADMIN_ANALYTICS',
      label: 'HQ Executive Dashboard',
      icon: BarChart3,
      roles: ['Super Admin'],
      badge: 'HQ Admin',
    },
    {
      id: 'ADMIN_DISH_SUMMARY',
      label: 'Dish Sales Summary',
      icon: PieChart,
      roles: ['Super Admin'],
    },

    {
      id: 'BRANCH_SETTINGS',
      label: 'Branch Config',
      icon: Settings,
      roles: ['Super Admin'],
    },
    {
      id: 'SYNC_QUEUE',
      label: 'Offline Sync Engine',
      icon: DatabaseBackup,
      roles: ['Super Admin'],
      badgeCount: syncQueue.length,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 no-print">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Admin Controls
        </div>
        {navItems
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.badge}
                  </span>
                )}
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Role & ERP compliance pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Arabian Mandi ERP</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Super Admin — HQ Management Portal
          </p>
        </div>
      </div>
    </aside>
  );
};
