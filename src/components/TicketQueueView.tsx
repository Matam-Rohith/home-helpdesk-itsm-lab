import { useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import type {
  Category,
  PriorityLevel,
  Ticket,
  TicketType,
} from '../types/itsm';
import { formatMinutes, formatShortDate, generateTicketsCsv } from '../utils/itsmHelpers';
import { PriorityText, SlaText, StatusText } from './StatusVisuals';

interface TicketQueueViewProps {
  tickets: Ticket[];
  categories: Category[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
}

type QueueTab = 'all' | 'active' | 'approval' | 'resolved';

export function TicketQueueView({
  tickets,
  categories,
  selectedTicketId,
  onSelectTicket,
  onOpenNewTicket,
}: TicketQueueViewProps) {
  const [tab, setTab] = useState<QueueTab>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TicketType | 'ALL'>('ALL');

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const counts = useMemo(() => {
    const active = tickets.filter(
      (t) =>
        t.status === 'New' ||
        t.status === 'In Progress' ||
        t.status === 'Waiting on User'
    ).length;
    const approval = tickets.filter((t) => t.status === 'Pending Approval').length;
    const resolved = tickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    ).length;
    return { all: tickets.length, active, approval, resolved };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (tab === 'active') {
        if (
          t.status !== 'New' &&
          t.status !== 'In Progress' &&
          t.status !== 'Waiting on User'
        ) {
          return false;
        }
      } else if (tab === 'approval') {
        if (t.status !== 'Pending Approval') return false;
      } else if (tab === 'resolved') {
        if (t.status !== 'Resolved' && t.status !== 'Closed') return false;
      }

      if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) {
        return false;
      }
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && t.type !== typeFilter) {
        return false;
      }
      if (q) {
        const hay = `${t.id} ${t.title} ${t.requester} ${t.assignee} ${t.affectedAsset}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, tab, categoryFilter, priorityFilter, typeFilter, search]);

  const handleExportCsv = () => {
    const csv = generateTicketsCsv(filtered, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'itsm-tickets-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setTab('all');
    setSearch('');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setTypeFilter('ALL');
  };

  const tabs: { id: QueueTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Tickets', count: counts.all },
    { id: 'active', label: 'Open & Active', count: counts.active },
    { id: 'approval', label: 'Pending Approval', count: counts.approval },
    { id: 'resolved', label: 'Resolved', count: counts.resolved },
  ];

  return (
    <div className="space-y-4 max-w-[1440px]">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tabs */}
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Ticket queue filter"
          >
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, title, asset, requester, assignee..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} · {cat.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityLevel | 'ALL')
            }
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
          </select>

          <select
            aria-label="Filter by ticket type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TicketType | 'ALL')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-700"
          >
            <option value="ALL">All Types</option>
            <option value="Incident">Incident</option>
            <option value="Service Request">Service Request</option>
            <option value="Change">Change</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-medium text-slate-900">
              No tickets match your current filters
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Adjust your search query or status tab, or log a new service desk
              incident directly into the queue.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={onOpenNewTicket}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Ticket</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="py-2.5 pl-4 pr-3 font-medium whitespace-nowrap">
                    Ticket
                  </th>
                  <th className="py-2.5 pr-4 font-medium">Summary & Asset</th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    Category
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    Priority
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    SLA
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap">
                    Assignee
                  </th>
                  <th className="py-2.5 pr-4 font-medium text-right whitespace-nowrap">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((ticket) => {
                  const selected = ticket.id === selectedTicketId;
                  const cat = catMap.get(ticket.categoryId);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      className={`h-12 cursor-pointer transition-colors ${
                        selected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="pl-4 pr-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="pr-4 max-w-md">
                        <div className="font-medium text-slate-900 truncate">
                          {ticket.title}
                        </div>
                        <div className="text-slate-500 truncate mt-0.5">
                          <span>{ticket.type}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono">{ticket.affectedAsset}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{ticket.requester}</span>
                        </div>
                      </td>
                      <td className="pr-4 text-slate-700 whitespace-nowrap">
                        {cat ? cat.name : ticket.categoryId}
                      </td>
                      <td className="pr-4 whitespace-nowrap">
                        <PriorityText priority={ticket.priority} />
                      </td>
                      <td className="pr-4 whitespace-nowrap">
                        <StatusText status={ticket.status} />
                      </td>
                      <td className="pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <SlaText state={ticket.slaState} />
                          <span className="font-mono text-slate-400 tabular-nums">
                            {formatMinutes(ticket.slaElapsedMinutes)}/
                            {formatMinutes(ticket.slaTargetMinutes)}
                          </span>
                        </div>
                      </td>
                      <td className="pr-4 text-slate-600 whitespace-nowrap">
                        {ticket.assignee.replace(/\s*\(.*?\)\s*/g, '')}
                      </td>
                      <td className="pr-4 text-right font-mono text-slate-500 whitespace-nowrap tabular-nums">
                        {formatShortDate(ticket.createdAt)}
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
  );
}
