import { Download, RotateCcw } from 'lucide-react';
import type {
  ApprovalRule,
  Category,
  ItsmPlatform,
  SlaPolicy,
  Ticket,
} from '../types/itsm';
import {
  formatMinutes,
  generateLabMarkdownReport,
  generateTicketsCsv,
} from '../utils/itsmHelpers';

interface LabRunbookViewProps {
  platform: ItsmPlatform;
  tickets: Ticket[];
  categories: Category[];
  slaPolicies: SlaPolicy[];
  approvalRules: ApprovalRule[];
  onResetLab: () => void;
}

export function LabRunbookView({
  platform,
  tickets,
  categories,
  slaPolicies,
  approvalRules,
  onResetLab,
}: LabRunbookViewProps) {
  const resolved = tickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  );
  const slaMet = resolved.filter((t) => t.slaState === 'Met').length;
  const compliance =
    resolved.length > 0 ? ((slaMet / resolved.length) * 100).toFixed(1) : '100.0';

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = generateLabMarkdownReport(
      platform,
      tickets,
      categories,
      slaPolicies,
      approvalRules
    );
    downloadFile('README-ITSM-Lab-Report.md', md, 'text/markdown;charset=utf-8;');
  };

  const handleExportCsv = () => {
    const csv = generateTicketsCsv(tickets, categories);
    downloadFile('itsm-tickets-log.csv', csv, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Home Help Desk ITSM Lab — Portfolio Runbook
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export live Markdown documentation and CSV ticket logs for your GitHub repository or resume showcase
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export Markdown Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-xs">
          <div>
            <div className="text-slate-500">ITSM Stack</div>
            <div className="mt-1 font-medium text-slate-900">{platform}</div>
          </div>
          <div>
            <div className="text-slate-500">Tickets Logged</div>
            <div className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
              {tickets.length}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Resolved Tickets</div>
            <div className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
              {resolved.length}
            </div>
          </div>
          <div>
            <div className="text-slate-500">SLA Compliance</div>
            <div className="mt-1 font-mono font-semibold text-emerald-700 tabular-nums">
              {compliance}% ({slaMet}/{resolved.length})
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-3 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              1. Lab Architecture & Tooling
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              This lab models an end-to-end ITIL v4 service desk built on{' '}
              <strong className="font-medium text-slate-900">{platform}</strong>,
              managing incidents, service requests, and infrastructure changes across
              workstations, networking (OPNsense / WireGuard / UniFi), identity
              (Authentik SSO / SSH CA), and virtualization (Proxmox VE / TrueNAS ZFS).
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              2. SLA Policy Matrix Summary
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 font-mono">
              {slaPolicies.map((s) => (
                <li key={s.id}>
                  {s.priority} ({s.label}): First Response{' '}
                  {formatMinutes(s.firstResponseMinutes)} · Resolution{' '}
                  {formatMinutes(s.resolutionMinutes)} · {s.coverage}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              3. Multi-Stage Approval Gates
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {approvalRules.map((r) => (
                <li key={r.id}>
                  <span className="font-mono font-medium text-slate-900">
                    {r.id}
                  </span>{' '}
                  — {r.name}: {r.stages.map((st) => st.stageName).join(' → ')}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            Changes are persisted automatically in your browser.
          </span>
          <button
            type="button"
            onClick={onResetLab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Lab to 26 Seed Tickets</span>
          </button>
        </div>
      </section>
    </div>
  );
}
