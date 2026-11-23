import { useMemo, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type {
  ApprovalRule,
  Category,
  ImpactLevel,
  SlaPolicy,
  Ticket,
  TicketType,
  UrgencyLevel,
} from '../types/itsm';
import {
  AGENTS,
  REQUESTERS,
  calculatePriority,
  formatMinutes,
} from '../utils/itsmHelpers';
import { PriorityText } from './StatusVisuals';

interface NewTicketModalProps {
  open: boolean;
  categories: Category[];
  slaPolicies: SlaPolicy[];
  approvalRules: ApprovalRule[];
  nextSequenceNumber: number;
  onClose: () => void;
  onCreateTicket: (ticket: Ticket) => void;
}

export function NewTicketModal({
  open,
  categories,
  slaPolicies,
  approvalRules,
  nextSequenceNumber,
  onClose,
  onCreateTicket,
}: NewTicketModalProps) {
  const activeCategories = categories.filter((c) => c.active);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TicketType>('Incident');
  const [categoryId, setCategoryId] = useState(
    activeCategories[0]?.id ?? 'cat-net'
  );
  const [impact, setImpact] = useState<ImpactLevel>('Medium');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Medium');
  const [requesterIdx, setRequesterIdx] = useState(0);
  const [affectedAsset, setAffectedAsset] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [justification, setJustification] = useState('');

  const computedPriority = calculatePriority(impact, urgency);
  const matchedSla = slaPolicies.find((s) => s.priority === computedPriority);
  const matchedCategory = categories.find((c) => c.id === categoryId);

  const matchedRule = useMemo(() => {
    return approvalRules.find(
      (r) =>
        r.active &&
        (r.categoryId === 'ANY' || r.categoryId === categoryId) &&
        r.ticketTypes.includes(type)
    );
  }, [approvalRules, categoryId, type]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const prefix =
      type === 'Incident' ? 'INC' : type === 'Change' ? 'CHG' : 'REQ';
    const id = `${prefix}-${nextSequenceNumber}`;
    const req = REQUESTERS[requesterIdx] ?? REQUESTERS[0];
    const now = new Date().toISOString();
    const needsApproval = Boolean(matchedRule);

    const newTicket: Ticket = {
      id,
      title: title.trim(),
      description: description.trim(),
      type,
      categoryId,
      impact,
      urgency,
      priority: computedPriority,
      status: needsApproval ? 'Pending Approval' : 'New',
      requester: req.name,
      requesterDept: req.dept,
      assignee: matchedCategory?.defaultAssignee ?? AGENTS[0],
      affectedAsset: affectedAsset.trim() || 'LAB-HOST-01',
      createdAt: now,
      slaTargetMinutes: matchedSla?.resolutionMinutes ?? 1440,
      slaElapsedMinutes: 1,
      slaState: 'On Track',
      approvalStatus: needsApproval ? 'Pending' : 'Not Required',
      approvalRuleId: matchedRule?.id,
      approvalJustification: needsApproval
        ? justification.trim() || description.trim()
        : undefined,
      estimatedCost: estimatedCost.trim() || undefined,
      approvalSteps: matchedRule
        ? matchedRule.stages.map((st, idx) => ({
            id: `st-${id}-${idx + 1}`,
            stageName: st.stageName,
            approverName: st.approverName,
            approverRole: st.approverRole,
            status: 'Pending',
          }))
        : [],
      comments: [
        {
          id: `c-${id}-1`,
          author: needsApproval ? 'System Workflow' : req.name,
          role: needsApproval ? 'System' : 'Requester',
          visibility: needsApproval ? 'Internal' : 'Public',
          body: needsApproval
            ? `Ticket logged and routed to Approval Rule ${matchedRule?.id} (${matchedRule?.name}).`
            : description.trim(),
          timestamp: now,
        },
      ],
    };

    onCreateTicket(newTicket);
    setTitle('');
    setDescription('');
    setAffectedAsset('');
    setEstimatedCost('');
    setJustification('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2
            id="new-ticket-title"
            className="font-display text-base font-semibold text-slate-900"
          >
            Log New Service Desk Ticket
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Ticket Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-900"
              >
                <option value="Incident">Incident (Break / Fix)</option>
                <option value="Service Request">Service Request</option>
                <option value="Change">Change Request</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-900"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.code} · {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Summary Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., WireGuard peer routing drop on VLAN 30"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Technical Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observed symptoms, affected service, error output, or requested configuration..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <div className="block font-medium text-slate-700 mb-1">
                Computed Priority & SLA
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <PriorityText priority={computedPriority} />
                <span className="font-mono text-slate-500 tabular-nums">
                  {matchedSla ? formatMinutes(matchedSla.resolutionMinutes) : '24h'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Requester
              </label>
              <select
                value={requesterIdx}
                onChange={(e) => setRequesterIdx(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
              >
                {REQUESTERS.map((r, i) => (
                  <option key={r.name} value={i}>
                    {r.name} ({r.dept})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Affected Host / Asset ID
              </label>
              <input
                type="text"
                value={affectedAsset}
                onChange={(e) => setAffectedAsset(e.target.value)}
                placeholder="e.g., PVE-NODE-01"
                className="w-full px-3 py-2 font-mono bg-white border border-slate-200 rounded-md"
              />
            </div>
          </div>

          {matchedRule && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 font-medium text-amber-900">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  Approval Workflow Triggered: {matchedRule.id} —{' '}
                  {matchedRule.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Business / lab justification for approvers..."
                  className="px-3 py-1.5 bg-white border border-amber-200 rounded-md"
                />
                <input
                  type="text"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Est. Cost (optional, e.g. $180.00)"
                  className="px-3 py-1.5 font-mono bg-white border border-amber-200 rounded-md"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
