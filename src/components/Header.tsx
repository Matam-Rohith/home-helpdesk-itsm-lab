import { Menu, Plus } from 'lucide-react';
import type { ActiveView } from '../types/itsm';

interface HeaderProps {
  activeView: ActiveView;
  onOpenNewTicket: () => void;
  onOpenMobileNav: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  overview: 'Lab Overview',
  tickets: 'Ticket Queue',
  approvals: 'Approval Workflow',
  config: 'Categories, SLAs & Rules',
  runbook: 'Lab Runbook & Export',
};

export function Header({
  activeView,
  onOpenNewTicket,
  onOpenMobileNav,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
            HomeDesk ITSM
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 truncate">
            {VIEW_TITLES[activeView]}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenNewTicket}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Log Ticket</span>
      </button>
    </header>
  );
}
