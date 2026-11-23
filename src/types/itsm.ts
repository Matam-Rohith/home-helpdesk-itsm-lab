export type TicketType = 'Incident' | 'Service Request' | 'Change';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type ImpactLevel = 'High' | 'Medium' | 'Low';

export type UrgencyLevel = 'High' | 'Medium' | 'Low';

export type TicketStatus =
  | 'New'
  | 'In Progress'
  | 'Pending Approval'
  | 'Waiting on User'
  | 'Resolved'
  | 'Closed';

export type ApprovalStatus = 'Not Required' | 'Pending' | 'Approved' | 'Rejected';

export type SlaState = 'Met' | 'On Track' | 'At Risk' | 'Breached';

export type ResolutionCode =
  | 'Solved - Configuration'
  | 'Solved - Hardware Swap'
  | 'Solved - Access Granted'
  | 'Solved - Patch Applied'
  | 'Workaround Applied'
  | 'No Fault Found'
  | 'Rejected by Approver';

export type ItsmPlatform =
  | 'Zammad (Open-Source)'
  | 'GLPI (Open-Source)'
  | 'Jira Service Management (Free)'
  | 'Freshservice (Trial)';

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultAssignee: string;
  requiresApprovalForRequests: boolean;
  active: boolean;
}

export interface SlaPolicy {
  id: string;
  priority: PriorityLevel;
  label: string;
  description: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  coverage: '24/7' | 'Business Hours (8x5)';
  escalationThresholdPct: number;
  autoEscalateTo: string;
  active: boolean;
}

export interface ApprovalStageConfig {
  stageName: string;
  approverName: string;
  approverRole: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  categoryId: string | 'ANY';
  ticketTypes: TicketType[];
  stages: ApprovalStageConfig[];
  active: boolean;
}

export interface ApprovalStep {
  id: string;
  stageName: string;
  approverName: string;
  approverRole: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedAt?: string;
  comment?: string;
}

export interface TicketComment {
  id: string;
  author: string;
  role: 'Requester' | 'Agent' | 'Approver' | 'System';
  visibility: 'Public' | 'Internal';
  body: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  categoryId: string;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  status: TicketStatus;
  requester: string;
  requesterDept: string;
  assignee: string;
  affectedAsset: string;
  createdAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  slaTargetMinutes: number;
  slaElapsedMinutes: number;
  slaState: SlaState;
  approvalStatus: ApprovalStatus;
  approvalRuleId?: string;
  approvalJustification?: string;
  estimatedCost?: string;
  approvalSteps: ApprovalStep[];
  resolutionCode?: ResolutionCode;
  resolutionNotes?: string;
  timeSpentMinutes?: number;
  comments: TicketComment[];
}

export type ActiveView =
  | 'overview'
  | 'tickets'
  | 'approvals'
  | 'config'
  | 'runbook';
