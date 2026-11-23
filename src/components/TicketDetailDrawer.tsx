import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import type {
  Category,
  ResolutionCode,
  SlaPolicy,
  Ticket,
  TicketStatus,
} from '../types/itsm';
import {
  AGENTS,
  formatMinutes,
  formatShortDate,
} from '../utils/itsmHelpers';
import {
  ApprovalText,
  PriorityText,
  SlaText,
  StatusText,
} from './StatusVisuals';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  categories: Category[];
  slaPolicies: SlaPolicy[];
  onClose: () => void;
  onUpdateTicket: (ticketId: string, patch: Partial<Ticket>) => void;
  onAddComment: (
    ticketId: string,
    body: string,
    visibility: 'Public' | 'Internal'
  ) => void;
  onResolveTicket: (
    ticketId: string,
    resolutionCode: ResolutionCode,
    resolutionNotes: string,
    timeSpentMinutes: number
  ) => void;
  onApprovalDecision: (
    ticketId: string,
    decision: 'Approved' | 'Rejected',
    comment: string
  ) => void;
}

const RESOLUTION_CODES: ResolutionCode[] = [
  'Solved - Configuration',
  'Solved - Hardware Swap',
  'Solved - Access Granted',
  'Solved - Patch Applied',
  'Workaround Applied',
  'No Fault Found',
];

export function TicketDetailDrawer({
  ticket,
  categories,
  slaPolicies,
  onClose,
  onUpdateTicket,
  onAddComment,
  onResolveTicket,
  onApprovalDecision,
}: TicketDetailDrawerProps) {
  const [replyText, setReplyText] = useState('');
  const [replyVisibility, setReplyVisibility] = useState<'Public' | 'Internal'>(
    'Public'
  );
  const [resolutionCode, setResolutionCode] = useState<ResolutionCode>(
    'Solved - Configuration'
  );
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState('35');
  const [approvalNote, setApprovalNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  if (!ticket) return null;

  const category = categories.find((c) => c.id === ticket.categoryId);
  const slaPolicy = slaPolicies.find((s) => s.priority === ticket.priority);
  const isResolved =
    ticket.status === 'Resolved' || ticket.status === 'Closed';
  const slaPct = Math.min(
    100,
    Math.round(
      (ticket.slaElapsedMinutes / Math.max(1, ticket.slaTargetMinutes)) * 100
    )
  );
  const currentPendingStep = ticket.approvalSteps.find(
    (s) => s.status === 'Pending'
  );

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddComment(ticket.id, replyText.trim(), replyVisibility);
    setReplyText('');
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    const mins = Math.max(5, Number(timeSpent) || 30);
    onResolveTicket(ticket.id, resolutionCode, resolutionNotes.trim(), mins);
    setResolutionNotes('');
    setShowResolveForm(false);
  };

  const handleDecision = (decision: 'Approved' | 'Rejected') => {
    onApprovalDecision(
      ticket.id,
      decision,
      approvalNote.trim() ||
        (decision === 'Approved'
          ? 'Approved via service desk review.'
          : 'Rejected by approver.')
    );
    setApprovalNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label={`Ticket ${ticket.id} details`}
        className="relative z-10 w-full max-w-2xl bg-white h-full border-l border-slate-200 flex flex-col shadow-xl"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-900">
                {ticket.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>{ticket.type}</span>
              <span aria-hidden="true">·</span>
              <span>{category?.name ?? ticket.categoryId}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{ticket.affectedAsset}</span>
            </div>
            <h2 className="mt-1 font-display text-base font-semibold text-slate-900 leading-snug">
              {ticket.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket inspector"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status, Priority & SLA Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 mb-1">Status</div>
              <StatusText status={ticket.status} />
            </div>
            <div>
              <div className="text-slate-500 mb-1">Priority</div>
              <PriorityText priority={ticket.priority} />
            </div>
            <div>
              <div className="text-slate-500 mb-1">SLA Compliance</div>
              <SlaText state={ticket.slaState} />
            </div>
            <div>
              <div className="text-slate-500 mb-1">Approval Gate</div>
              <ApprovalText status={ticket.approvalStatus} />
            </div>
          </div>

          {/* SLA Progress */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-800">
                SLA Timer ({slaPolicy?.label ?? ticket.priority} ·{' '}
                {slaPolicy?.coverage ?? '24/7'})
              </span>
              <span className="font-mono text-slate-600 tabular-nums">
                {formatMinutes(ticket.slaElapsedMinutes)} elapsed /{' '}
                {formatMinutes(ticket.slaTargetMinutes)} target
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm ${
                  ticket.slaState === 'Breached'
                    ? 'bg-red-600'
                    : ticket.slaState === 'At Risk'
                    ? 'bg-amber-600'
                    : ticket.slaState === 'Met'
                    ? 'bg-emerald-600'
                    : 'bg-blue-700'
                }`}
                style={{ width: `${slaPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>Created {formatShortDate(ticket.createdAt)}</span>
              <span>
                First Response Target:{' '}
                {slaPolicy
                  ? formatMinutes(slaPolicy.firstResponseMinutes)
                  : '30m'}
              </span>
            </div>
          </section>

          {/* Description & Metadata */}
          <section className="space-y-2 pb-5 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-900">
              Issue Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {ticket.description}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Requester:{' '}
                <strong className="font-medium text-slate-800">
                  {ticket.requester}
                </strong>{' '}
                ({ticket.requesterDept})
              </span>
              <span>
                Impact / Urgency:{' '}
                <strong className="font-medium text-slate-800">
                  {ticket.impact} / {ticket.urgency}
                </strong>
              </span>
              {ticket.estimatedCost && (
                <span>
                  Est. Cost:{' '}
                  <strong className="font-medium text-slate-800 font-mono">
                    {ticket.estimatedCost}
                  </strong>
                </span>
              )}
            </div>
          </section>

          {/* Approval Workflow Section */}
          {ticket.approvalSteps.length > 0 && (
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <span>
                    Approval Workflow{' '}
                    {ticket.approvalRuleId ? `(${ticket.approvalRuleId})` : ''}
                  </span>
                </div>
                <ApprovalText status={ticket.approvalStatus} />
              </div>

              {ticket.approvalJustification && (
                <p className="text-xs text-slate-600">
                  Justification: {ticket.approvalJustification}
                </p>
              )}

              <ol className="space-y-2">
                {ticket.approvalSteps.map((step, idx) => (
                  <li
                    key={step.id}
                    className="flex items-start justify-between gap-3 bg-white border border-slate-200 rounded-md p-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-900">
                        Stage {idx + 1}: {step.stageName}
                      </div>
                      <div className="text-slate-500">
                        {step.approverName} · {step.approverRole}
                      </div>
                      {step.comment && (
                        <div className="text-slate-700 pt-1">
                          “{step.comment}”
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {step.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Approved
                        </span>
                      )}
                      {step.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Rejected
                        </span>
                      )}
                      {step.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          Pending
                        </span>
                      )}
                      {step.decidedAt && (
                        <div className="text-slate-400 font-mono mt-0.5 tabular-nums">
                          {formatShortDate(step.decidedAt)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {ticket.approvalStatus === 'Pending' && currentPendingStep && (
                <div className="pt-2 space-y-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder={`Approver note for ${currentPendingStep.stageName}...`}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision('Approved')}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-md transition-colors"
                    >
                      Approve Stage {ticket.approvalSteps.indexOf(currentPendingStep) + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision('Rejected')}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Resolution Summary (if resolved) or Triage + Resolve Workbench */}
          {isResolved ? (
            <section className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-emerald-900">
                  Resolution Summary · {ticket.resolutionCode}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTicket(ticket.id, {
                      status: 'In Progress',
                      resolvedAt: undefined,
                    })
                  }
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
                >
                  Reopen Ticket
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {ticket.resolutionNotes}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 tabular-nums">
                {ticket.resolvedAt && (
                  <span>Resolved: {formatShortDate(ticket.resolvedAt)}</span>
                )}
                {typeof ticket.timeSpentMinutes === 'number' && (
                  <span>
                    Time Logged: {formatMinutes(ticket.timeSpentMinutes)}
                  </span>
                )}
              </div>
            </section>
          ) : (
            <section className="space-y-4 pb-5 border-b border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="drawer-status"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Queue Status
                  </label>
                  <select
                    id="drawer-status"
                    value={ticket.status}
                    onChange={(e) =>
                      onUpdateTicket(ticket.id, {
                        status: e.target.value as TicketStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Waiting on User">Waiting on User</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="drawer-assignee"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Assigned Agent
                  </label>
                  <select
                    id="drawer-assignee"
                    value={ticket.assignee}
                    onChange={(e) =>
                      onUpdateTicket(ticket.id, { assignee: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
                  >
                    {AGENTS.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!showResolveForm ? (
                <button
                  type="button"
                  onClick={() => setShowResolveForm(true)}
                  disabled={ticket.approvalStatus === 'Pending'}
                  className="px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-md transition-colors"
                >
                  {ticket.approvalStatus === 'Pending'
                    ? 'Complete Approval Before Resolving'
                    : 'Resolve Ticket'}
                </button>
              ) : (
                <form
                  onSubmit={handleResolveSubmit}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Log Resolution Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowResolveForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Resolution Code
                      </label>
                      <select
                        value={resolutionCode}
                        onChange={(e) =>
                          setResolutionCode(e.target.value as ResolutionCode)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      >
                        {RESOLUTION_CODES.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Time Spent (minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Root Cause & Steps Taken
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Document root cause, commands/changes applied, and verification result..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-md transition-colors"
                  >
                    Mark as Resolved
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Conversation & Audit Log */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Activity & Audit Trail ({ticket.comments.length})
            </h3>
            <div className="space-y-2.5">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-md border text-xs ${
                    comment.visibility === 'Internal'
                      ? 'bg-amber-50/40 border-amber-200/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span className="font-medium text-slate-900">
                      {comment.author}{' '}
                      <span className="font-normal text-slate-500">
                        · {comment.role} · {comment.visibility}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatShortDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-slate-700 leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendComment} className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyVisibility('Public')}
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    replyVisibility === 'Public'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Reply
                </button>
                <button
                  type="button"
                  onClick={() => setReplyVisibility('Internal')}
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    replyVisibility === 'Internal'
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Internal Note
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyVisibility === 'Public'
                      ? 'Write a public update to the requester...'
                      : 'Add an internal troubleshooting note...'
                  }
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </aside>
    </div>
  );
}
