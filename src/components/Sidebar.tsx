import {
  BookOpen,
  CheckSquare,
  Inbox,
  LayoutDashboard,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { ActiveView, ItsmPlatform } from '../types/itsm';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  openCount: number;
  pendingApprovalCount: number;
  totalCount: number;
  platform: ItsmPlatform;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  openCount,
  pendingApprovalCount,
  totalCount,
  platform,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: {
    id: ActiveView;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tickets', label: 'Ticket Queue', icon: Inbox, count: totalCount },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckSquare,
      count: pendingApprovalCount,
    },
    { id: 'config', label: 'SLA & Rules', icon: SlidersHorizontal },
    { id: 'runbook', label: 'Lab Runbook', icon: BookOpen },
  ];

  const handleNav = (id: ActiveView) => {
    onSelectView(id);
    onCloseMobile();
  };

  const content = (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          HomeDesk ITSM
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    active ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
        <div className="font-medium text-slate-900 truncate">{platform}</div>
        <div className="flex items-center justify-between text-slate-500 tabular-nums">
          <span>Active Queue</span>
          <span className="font-mono font-medium text-slate-800">{openCount} open</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full">{content}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
