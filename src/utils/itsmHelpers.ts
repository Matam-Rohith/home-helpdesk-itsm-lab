import type {
  ImpactLevel,
  PriorityLevel,
  SlaPolicy,
  SlaState,
  Ticket,
  UrgencyLevel,
  Category,
  ApprovalRule,
  ItsmPlatform,
} from '../types/itsm';

export const AGENTS = [
  'Matam Rohith (Lead Admin)',
  'Sana Patel (Tier 2 Desk)',
  'Devon Brooks (Network Ops)',
  'Elena Vance (Security & IAM)',
];

export const REQUESTERS = [
  { name: 'Liam Chen', dept: 'Home Lab / DevOps' },
  { name: 'Maya Lin', dept: 'Workstation Endpoint' },
  { name: 'Noah Alvarez', dept: 'Remote Access' },
  { name: 'Priya Nair', dept: 'Media & NAS' },
  { name: 'Owen Gallagher', dept: 'Finance & Licensing' },
  { name: 'Clara Morales', dept: 'Security Ops' },
];

export function calculatePriority(impact: ImpactLevel, urgency: UrgencyLevel): PriorityLevel {
  if (impact === 'High' && urgency === 'High') return 'P1';
  if (
    (impact === 'High' && urgency === 'Medium') ||
    (impact === 'Medium' && urgency === 'High')
  ) {
    return 'P2';
  }
  if (impact === 'Low' && urgency === 'Low') return 'P4';
  return 'P3';
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const remH = h % 24;
    return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function computeSlaState(
  ticket: Pick<Ticket, 'status' | 'slaElapsedMinutes' | 'slaTargetMinutes'>,
  policy?: SlaPolicy
): SlaState {
  const isClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';
  if (isClosed) {
    return ticket.slaElapsedMinutes <= ticket.slaTargetMinutes ? 'Met' : 'Breached';
  }
  if (ticket.slaElapsedMinutes > ticket.slaTargetMinutes) return 'Breached';
  const pct = (ticket.slaElapsedMinutes / Math.max(1, ticket.slaTargetMinutes)) * 100;
  const threshold = policy?.escalationThresholdPct ?? 80;
  if (pct >= threshold) return 'At Risk';
  return 'On Track';
}

export function getInitials(name: string): string {
  const clean = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function generateTicketsCsv(tickets: Ticket[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = [
    'Ticket ID',
    'Type',
    'Title',
    'Category',
    'Priority',
    'Impact',
    'Urgency',
    'Status',
    'Approval Status',
    'SLA State',
    'SLA Elapsed (min)',
    'SLA Target (min)',
    'Requester',
    'Assignee',
    'Affected Asset',
    'Created At',
    'Resolved At',
    'Resolution Code',
    'Time Spent (min)',
  ];

  const escape = (val: string | number | undefined) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = tickets.map((t) =>
    [
      t.id,
      t.type,
      t.title,
      catMap.get(t.categoryId) ?? t.categoryId,
      t.priority,
      t.impact,
      t.urgency,
      t.status,
      t.approvalStatus,
      t.slaState,
      t.slaElapsedMinutes,
      t.slaTargetMinutes,
      t.requester,
      t.assignee,
      t.affectedAsset,
      t.createdAt,
      t.resolvedAt ?? '',
      t.resolutionCode ?? '',
      t.timeSpentMinutes ?? '',
    ]
      .map(escape)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function generateLabMarkdownReport(
  platform: ItsmPlatform,
  tickets: Ticket[],
  categories: Category[],
  slaPolicies: SlaPolicy[],
  approvalRules: ApprovalRule[]
): string {
  const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
  const slaMet = resolved.filter((t) => t.slaState === 'Met').length;
  const compliancePct = resolved.length > 0 ? ((slaMet / resolved.length) * 100).toFixed(1) : '0.0';
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const lines: string[] = [
    `# Home Help Desk ITSM Lab Report`,
    ``,
    `- **Active ITSM Tool Model**: ${platform}`,
    `- **Total Tickets Logged**: ${tickets.length}`,
    `- **Resolved / Closed Tickets**: ${resolved.length}`,
    `- **SLA Compliance Rate**: ${compliancePct}% (${slaMet}/${resolved.length} resolved within target)`,
    ``,
    `## 1. Configured Categories`,
    `| Code | Category | Default Queue Owner | Approval Gate |`,
    `| :--- | :--- | :--- | :--- |`,
    ...categories.map(
      (c) =>
        `| \`${c.code}\` | ${c.name} | ${c.defaultAssignee} | ${c.requiresApprovalForRequests ? 'Required for Requests' : 'Standard'} |`
    ),
    ``,
    `## 2. Priority & SLA Policy Matrix`,
    `| Priority | Label | First Response | Resolution Target | Coverage | Escalation |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...slaPolicies.map(
      (s) =>
        `| **${s.priority}** | ${s.label} | ${formatMinutes(s.firstResponseMinutes)} | ${formatMinutes(s.resolutionMinutes)} | ${s.coverage} | ${s.escalationThresholdPct}% (${s.autoEscalateTo}) |`
    ),
    ``,
    `## 3. Approval Workflow Rules`,
    ...approvalRules.map(
      (r) =>
        `- **${r.id} — ${r.name}**: ${r.description} (${r.stages.map((st) => st.stageName).join(' -> ')})`
    ),
    ``,
    `## 4. Ticket Log & Resolutions`,
    `| ID | Type | Title | Category | Priority | Status | SLA | Resolution |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...tickets.map(
      (t) =>
        `| ${t.id} | ${t.type} | ${t.title} | ${catMap.get(t.categoryId) ?? t.categoryId} | ${t.priority} | ${t.status} | ${t.slaState} | ${t.resolutionCode ?? t.approvalStatus} |`
    ),
    ``,
  ];

  return lines.join('\n');
}
