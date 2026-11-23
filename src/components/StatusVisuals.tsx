import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type {
  ApprovalStatus,
  PriorityLevel,
  SlaState,
  TicketStatus,
} from '../types/itsm';

export function PriorityText({ priority }: { priority: PriorityLevel }) {
  const styles: Record<PriorityLevel, { label: string; cls: string }> = {
    P1: { label: 'P1 Critical', cls: 'text-red-700 font-semibold' },
    P2: { label: 'P2 High', cls: 'text-amber-700 font-semibold' },
    P3: { label: 'P3 Medium', cls: 'text-blue-700 font-medium' },
    P4: { label: 'P4 Low', cls: 'text-slate-600 font-medium' },
  };
  const cfg = styles[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap tabular-nums ${cfg.cls}`}>
      {priority === 'P1' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {cfg.label}
    </span>
  );
}

export function StatusText({ status }: { status: TicketStatus }) {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {status}
        </span>
      );
    case 'Pending Approval':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Pending Approval
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
          <CircleDot className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          In Progress
        </span>
      );
    case 'Waiting on User':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <PauseCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Waiting on User
        </span>
      );
    case 'New':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0 text-blue-700" aria-hidden="true" />
          New
        </span>
      );
  }
}

export function SlaText({ state }: { state: SlaState }) {
  switch (state) {
    case 'Met':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Met
        </span>
      );
    case 'At Risk':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          At Risk
        </span>
      );
    case 'Breached':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Breached
        </span>
      );
    case 'On Track':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          On Track
        </span>
      );
  }
}

export function ApprovalText({ status }: { status: ApprovalStatus }) {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Approved
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Pending
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Rejected
        </span>
      );
    case 'Not Required':
    default:
      return <span className="text-xs text-slate-400 whitespace-nowrap">Standard</span>;
  }
}
