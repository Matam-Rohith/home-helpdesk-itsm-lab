import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type {
  ActiveView,
  ApprovalRule,
  Category,
  ItsmPlatform,
  SlaPolicy,
  Ticket,
} from '../types/itsm';
import { formatMinutes, formatShortDate } from '../utils/itsmHelpers';
import { PriorityText, SlaText, StatusText } from './StatusVisuals';

interface OverviewViewProps {
  tickets: Ticket[];
  categories: Category[];
  slaPolicies: SlaPolicy[];
  approvalRules: ApprovalRule[];
  platform: ItsmPlatform;
  onNavigate: (view: ActiveView) => void;
  onSelectTicket: (ticketId: string) => void;
}

export function OverviewView({
  tickets,
  categories,
  slaPolicies,
  approvalRules,
  platform,
  onNavigate,
  onSelectTicket,
}: OverviewViewProps) {
  const resolved = tickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  );
  const active = tickets.filter(
    (t) =>
      t.status === 'New' ||
      t.status === 'In Progress' ||
      t.status === 'Waiting on User'
  );
  const pendingApprovals = tickets.filter(
    (t) => t.status === 'Pending Approval'
  );
  const slaMetCount = resolved.filter((t) => t.slaState === 'Met').length;
  const slaCompliance =
    resolved.length > 0
      ? ((slaMetCount / resolved.length) * 100).toFixed(1)
      : '100.0';

  const avgHandleTime =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((acc, t) => acc + (t.timeSpentMinutes ?? 30), 0) /
            resolved.length
        )
      : 0;

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const categoryBreakdown = categories.map((cat) => {
    const catTickets = tickets.filter((t) => t.categoryId === cat.id);
    const catResolved = catTickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    ).length;
    return {
      category: cat,
      total: catTickets.length,
      resolved: catResolved,
    };
  });

  const priorityBreakdown = slaPolicies.map((pol) => {
    const pTickets = tickets.filter((t) => t.priority === pol.priority);
    const pResolved = pTickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    );
    const pMet = pResolved.filter((t) => t.slaState === 'Met').length;
    return {
      policy: pol,
      total: pTickets.length,
      resolved: pResolved.length,
      met: pMet,
    };
  });

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  const labMilestones = [
    {
      label: `ITSM Platform Configured (${platform})`,
      done: true,
      target: 'config' as ActiveView,
      detail: 'Self-service catalog, agent routing, and audit timeline active',
    },
    {
      label: `${categories.filter((c) => c.active).length} Service Categories & Queue Owners`,
      done: categories.filter((c) => c.active).length >= 5,
      target: 'config' as ActiveView,
      detail: 'Network, Hardware, IAM, Software, Home Lab, Security',
    },
    {
      label: `${slaPolicies.filter((s) => s.active).length} Priority Tiers & SLA Policies (P1–P4)`,
      done: slaPolicies.length >= 4,
      target: 'config' as ActiveView,
      detail: 'Impact x Urgency matrix with response & resolution targets',
    },
    {
      label: `${approvalRules.filter((r) => r.active).length} Multi-Stage Approval Workflow Rules`,
      done: approvalRules.length >= 2,
      target: 'approvals' as ActiveView,
      detail: `${pendingApprovals.length} waiting in queue · ${
        tickets.filter((t) => t.approvalStatus === 'Approved').length
      } approved`,
    },
    {
      label: `${tickets.length} Realistic Tickets Logged & ${resolved.length} Resolved`,
      done: tickets.length >= 20 && resolved.length >= 20,
      target: 'tickets' as ActiveView,
      detail: `Average active resolution time ${formatMinutes(avgHandleTime)}`,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1440px]">
      {/* KPI Summary Strip */}
      <section
        aria-label="Key service desk metrics"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Tickets Logged
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {tickets.length}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {active.length} active · {pendingApprovals.length} approval
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Resolved & Closed
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {resolved.length}
            </span>
            <span className="text-xs text-emerald-700 font-medium tabular-nums">
              Avg handle {formatMinutes(avgHandleTime)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            SLA Compliance Rate
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {slaCompliance}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {slaMetCount} of {resolved.length} within target
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Pending Approvals
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {pendingApprovals.length}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Review queue</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Category & SLA Distributions */}
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Volume & Resolution by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ticket distribution across all configured service desk queues
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tickets')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
              >
                Open full queue
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {categoryBreakdown.map(({ category, total, resolved: catRes }) => {
                const maxTotal = Math.max(
                  1,
                  ...categoryBreakdown.map((item) => item.total)
                );
                const widthPct = Math.round((total / maxTotal) * 100);
                const resPct = total > 0 ? Math.round((catRes / total) * 100) : 0;
                return (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-slate-500 shrink-0">
                          {category.code}
                        </span>
                        <span className="font-medium text-slate-800 truncate">
                          {category.name}
                        </span>
                        <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 hidden sm:inline truncate">
                          {category.defaultAssignee}
                        </span>
                      </div>
                      <div className="font-mono text-slate-700 shrink-0 tabular-nums">
                        {catRes}/{total} resolved ({resPct}%)
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-sm transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  SLA Target Performance by Priority
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  First response & resolution compliance across P1–P4 tiers
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('config')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
              >
                Edit SLA policies
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Priority</th>
                    <th className="py-2.5 pr-4 font-medium">Coverage</th>
                    <th className="py-2.5 pr-4 font-medium text-right">
                      Response
                    </th>
                    <th className="py-2.5 pr-4 font-medium text-right">
                      Resolution
                    </th>
                    <th className="py-2.5 pr-4 font-medium text-right">
                      Tickets
                    </th>
                    <th className="py-2.5 font-medium text-right">SLA Met</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {priorityBreakdown.map(({ policy, total, resolved: pRes, met }) => (
                    <tr key={policy.id} className="h-10">
                      <td className="pr-4">
                        <PriorityText priority={policy.priority} />
                      </td>
                      <td className="pr-4 text-slate-600">{policy.coverage}</td>
                      <td className="pr-4 text-right font-mono text-slate-700 tabular-nums">
                        {formatMinutes(policy.firstResponseMinutes)}
                      </td>
                      <td className="pr-4 text-right font-mono text-slate-700 tabular-nums">
                        {formatMinutes(policy.resolutionMinutes)}
                      </td>
                      <td className="pr-4 text-right font-mono text-slate-900 tabular-nums">
                        {total}
                      </td>
                      <td className="text-right font-mono text-slate-700 tabular-nums">
                        {met}/{pRes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Lab Setup Verification Checklist */}
        <aside className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Lab Implementation Checklist
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live verification against core ITSM lab objectives
              </p>
            </div>

            <ul className="mt-4 divide-y divide-slate-100">
              {labMilestones.map((item) => (
                <li key={item.label} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.target)}
                    className="w-full text-left group flex items-start gap-2.5"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        item.done ? 'text-emerald-700' : 'text-slate-300'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.detail}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Need portfolio artifacts?
            </span>
            <button
              type="button"
              onClick={() => onNavigate('runbook')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Export Markdown & CSV
            </button>
          </div>
        </aside>
      </div>

      {/* Recent Ticket Activity Table */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Latest Tickets & Pending Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any ticket row to inspect timeline, approval steps, or resolve
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tickets')}
            className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            View all {tickets.length} tickets
          </button>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">ID</th>
                <th className="py-2.5 pr-4 font-medium">Summary</th>
                <th className="py-2.5 pr-4 font-medium">Category</th>
                <th className="py-2.5 pr-4 font-medium">Priority</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 pr-4 font-medium">SLA</th>
                <th className="py-2.5 font-medium text-right">Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className="h-11 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="pr-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {ticket.id}
                  </td>
                  <td className="pr-4 text-slate-900 font-medium max-w-md truncate">
                    {ticket.title}
                  </td>
                  <td className="pr-4 text-slate-600 whitespace-nowrap">
                    {catMap.get(ticket.categoryId)?.name ?? ticket.categoryId}
                  </td>
                  <td className="pr-4">
                    <PriorityText priority={ticket.priority} />
                  </td>
                  <td className="pr-4">
                    <StatusText status={ticket.status} />
                  </td>
                  <td className="pr-4">
                    <SlaText state={ticket.slaState} />
                  </td>
                  <td className="text-right font-mono text-slate-500 whitespace-nowrap tabular-nums">
                    {formatShortDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
