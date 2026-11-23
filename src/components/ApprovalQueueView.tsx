import { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import type { ApprovalRule, Category, Ticket } from '../types/itsm';
import { formatShortDate } from '../utils/itsmHelpers';
import { ApprovalText, PriorityText } from './StatusVisuals';

interface ApprovalQueueViewProps {
  tickets: Ticket[];
  categories: Category[];
  approvalRules: ApprovalRule[];
  onApprovalDecision: (
    ticketId: string,
    decision: 'Approved' | 'Rejected',
    comment: string
  ) => void;
  onSelectTicket: (ticketId: string) => void;
}

export function ApprovalQueueView({
  tickets,
  categories,
  approvalRules,
  onApprovalDecision,
  onSelectTicket,
}: ApprovalQueueViewProps) {
  const [notesByTicket, setNotesByTicket] = useState<Record<string, string>>({});

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const ruleMap = new Map(approvalRules.map((r) => [r.id, r]));

  const pending = tickets.filter((t) => t.approvalStatus === 'Pending');
  const decided = tickets.filter(
    (t) => t.approvalStatus === 'Approved' || t.approvalStatus === 'Rejected'
  );

  const handleAction = (
    ticketId: string,
    decision: 'Approved' | 'Rejected'
  ) => {
    const note = notesByTicket[ticketId]?.trim();
    onApprovalDecision(
      ticketId,
      decision,
      note ||
        (decision === 'Approved'
          ? 'Approved via ITSM approval queue.'
          : 'Rejected via ITSM approval queue.')
    );
    setNotesByTicket((prev) => ({ ...prev, [ticketId]: '' }));
  };

  return (
    <div className="space-y-6 max-w-[1440px]">
      {/* Pending Approvals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Pending Approval Queue ({pending.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Service requests and changes gated by active ITSM approval policies
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="text-sm font-medium text-slate-900">
              All pending approvals cleared
            </div>
            <p className="text-xs text-slate-500 mt-1">
              New hardware purchases, privileged IAM requests, or firewall changes
              will automatically enter this queue when logged.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((ticket) => {
              const rule = ticket.approvalRuleId
                ? ruleMap.get(ticket.approvalRuleId)
                : undefined;
              const currentStepIdx = ticket.approvalSteps.findIndex(
                (s) => s.status === 'Pending'
              );
              const currentStep =
                currentStepIdx >= 0
                  ? ticket.approvalSteps[currentStepIdx]
                  : undefined;

              return (
                <article
                  key={ticket.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => onSelectTicket(ticket.id)}
                            className="font-mono font-semibold text-blue-700 hover:underline"
                          >
                            {ticket.id}
                          </button>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.type}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {catMap.get(ticket.categoryId) ?? ticket.categoryId}
                          </span>
                        </div>
                        <h3 className="mt-1 font-display text-sm font-semibold text-slate-900">
                          {ticket.title}
                        </h3>
                      </div>
                      <PriorityText priority={ticket.priority} />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ticket.approvalJustification || ticket.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Requester:{' '}
                        <strong className="font-medium text-slate-800">
                          {ticket.requester}
                        </strong>
                      </span>
                      {ticket.estimatedCost && (
                        <span>
                          Cost:{' '}
                          <strong className="font-mono font-medium text-slate-800">
                            {ticket.estimatedCost}
                          </strong>
                        </span>
                      )}
                      {rule && (
                        <span>
                          Policy:{' '}
                          <strong className="font-medium text-slate-800">
                            {rule.id} ({rule.name})
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Stage Chain */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {ticket.approvalSteps.map((step, i) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-700">
                            Stage {i + 1}: {step.stageName} ({step.approverName})
                          </span>
                          {step.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Approved
                            </span>
                          ) : step.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              Awaiting Sign-off
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentStep && (
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <input
                        type="text"
                        value={notesByTicket[ticket.id] ?? ''}
                        onChange={(e) =>
                          setNotesByTicket((prev) => ({
                            ...prev,
                            [ticket.id]: e.target.value,
                          }))
                        }
                        placeholder={`Review comment as ${currentStep.approverName}...`}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(ticket.id, 'Approved')}
                            className="px-3.5 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-md transition-colors whitespace-nowrap"
                          >
                            Approve Stage {currentStepIdx + 1}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(ticket.id, 'Rejected')}
                            className="px-3.5 py-1.5 text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket.id)}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
                        >
                          Inspect Ticket
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Approval Decisions */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-slate-700" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Completed Approval Audit Log ({decided.length})
          </h2>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Ticket</th>
                <th className="py-2.5 pr-4 font-medium">Request Summary</th>
                <th className="py-2.5 pr-4 font-medium">Rule</th>
                <th className="py-2.5 pr-4 font-medium">Decision</th>
                <th className="py-2.5 pr-4 font-medium">Last Approver</th>
                <th className="py-2.5 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {decided.map((ticket) => {
                const lastStep =
                  ticket.approvalSteps[ticket.approvalSteps.length - 1];
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket.id)}
                    className="h-11 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="pr-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {ticket.id}
                    </td>
                    <td className="pr-4 font-medium text-slate-900 max-w-md truncate">
                      {ticket.title}
                    </td>
                    <td className="pr-4 font-mono text-slate-600 whitespace-nowrap">
                      {ticket.approvalRuleId ?? '—'}
                    </td>
                    <td className="pr-4 whitespace-nowrap">
                      <ApprovalText status={ticket.approvalStatus} />
                    </td>
                    <td className="pr-4 text-slate-600 whitespace-nowrap">
                      {lastStep?.approverName ?? '—'}
                    </td>
                    <td className="text-right font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {lastStep?.decidedAt
                        ? formatShortDate(lastStep.decidedAt)
                        : formatShortDate(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
