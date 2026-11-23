import { useState } from 'react';
import { BookOpen, Download, ExternalLink, RotateCcw } from 'lucide-react';
import type {
  ActiveView,
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
  onNavigate: (view: ActiveView) => void;
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
}

const KNOWLEDGE_BASE_SOPS = [
  {
    id: 'KB-01',
    linkedTicketId: 'INC-1001',
    category: 'Network & VPN',
    title: 'WireGuard Handshake Timeout After OPNsense Upgrade',
    symptom: 'Remote LTE clients fail handshake on UDP/51820 while LAN hosts stay reachable.',
    commands: 'tcpdump -i igb0 udp port 51820 · wg show · Outbound NAT MSS clamp 1380',
    resolution: 'Verify WAN outbound NAT rules survived upgrade, clamp WireGuard MTU/MSS to 1380 for LTE links, and restart wireguard-kmod.',
  },
  {
    id: 'KB-02',
    linkedTicketId: 'INC-1002',
    category: 'Home Lab & Infra',
    title: 'Proxmox VE High I/O Wait During Concurrent Backups',
    symptom: 'Guest VMs freeze during nightly backup window with iowait > 50%.',
    commands: 'iostat -xz 1 · zpool status · vzdump --bwlimit 60000',
    resolution: 'Stagger Proxmox Backup Server schedules away from ZFS trim cron windows and apply bandwidth limits to protect consumer SSD pools.',
  },
  {
    id: 'KB-03',
    linkedTicketId: 'INC-1003',
    category: 'Hardware & Peripherals',
    title: 'Cross-VLAN AirPrint / IPP Printer Discovery Failure',
    symptom: 'macOS clients report "Looking for printer" despite ICMP reachability across VLANs.',
    commands: 'avahi-daemon reflector · Static DHCP 10.20.0.45 · IPP direct queue',
    resolution: 'Enable mDNS reflection between workstation and IoT/printer VLANs or bind queues directly via static IPP URI.',
  },
  {
    id: 'KB-04',
    linkedTicketId: 'INC-1010',
    category: 'Security & Compliance',
    title: 'BitLocker Recovery Prompt Triggered by UEFI / BIOS Update',
    symptom: 'Windows endpoint boots to 48-digit BitLocker recovery screen after firmware flash.',
    commands: 'manage-bde -protectors -disable C: · manage-bde -protectors -enable C:',
    resolution: 'Verify user identity out-of-band, retrieve escrowed key from vault, unlock OS volume, and re-bind TPM PCR7 protectors.',
  },
  {
    id: 'KB-05',
    linkedTicketId: 'INC-1012',
    category: 'Home Lab & Infra',
    title: 'TrueNAS Degraded ZFS Pool Replacement & P1 Alert Bypass',
    symptom: 'NVMe drive drops out of pool during scrub with checksum/read errors.',
    commands: 'zpool status -v tank · smartctl -a /dev/nvme0 · zpool replace tank <old> <new>',
    resolution: 'Swap failing NVMe with verified spare, monitor resilver completion, and configure high-priority ntfy override for P1 storage alerts.',
  },
];

export function LabRunbookView({
  platform,
  tickets,
  categories,
  slaPolicies,
  approvalRules,
  onResetLab,
  onNavigate,
  onSelectTicket,
  onOpenNewTicket,
}: LabRunbookViewProps) {
  const [selectedKb, setSelectedKb] = useState<string>(KNOWLEDGE_BASE_SOPS[0].id);

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

  const activeSop =
    KNOWLEDGE_BASE_SOPS.find((k) => k.id === selectedKb) ?? KNOWLEDGE_BASE_SOPS[0];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Portfolio Summary & Export */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Home Help Desk ITSM Lab — Portfolio Runbook
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export live Markdown documentation and CSV ticket logs for GitHub, resumes, and technical interviews
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

        {/* Interactive Walkthrough for Reviewers */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Interactive Demo Walkthrough
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="text-left p-3.5 border border-slate-200 hover:border-blue-700 rounded-md transition-colors space-y-1"
            >
              <div className="font-medium text-slate-900 flex items-center justify-between">
                <span>1. Test Approval Gate</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              </div>
              <p className="text-slate-500">
                Approve Stage 2 on REQ-1021 to move hardware procurement into fulfillment.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectTicket('INC-1024')}
              className="text-left p-3.5 border border-slate-200 hover:border-blue-700 rounded-md transition-colors space-y-1"
            >
              <div className="font-medium text-slate-900 flex items-center justify-between">
                <span>2. Resolve Live Incident</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              </div>
              <p className="text-slate-500">
                Inspect INC-1024 (Pi-hole DNS sync) and log root cause + resolution code.
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenNewTicket}
              className="text-left p-3.5 border border-slate-200 hover:border-blue-700 rounded-md transition-colors space-y-1"
            >
              <div className="font-medium text-slate-900 flex items-center justify-between">
                <span>3. Trigger Auto-Routing</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              </div>
              <p className="text-slate-500">
                Log a new Hardware Service Request to see priority matrix & APR-01 trigger live.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Knowledge Base SOPs */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Standard Operating Procedures (Knowledge Base)
            </h2>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {KNOWLEDGE_BASE_SOPS.length} documented runbooks
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            {KNOWLEDGE_BASE_SOPS.map((sop) => {
              const active = sop.id === activeSop.id;
              return (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setSelectedKb(sop.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border text-xs transition-colors ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold">{sop.id}</span>
                    <span className={active ? 'text-slate-300' : 'text-slate-400'}>
                      {sop.linkedTicketId}
                    </span>
                  </div>
                  <div className="mt-1 font-medium truncate">{sop.title}</div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <div className="text-slate-500">
                  <span className="font-mono font-semibold text-slate-800">
                    {activeSop.id}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>{activeSop.category}</span>
                </div>
                <h3 className="mt-1 font-display text-sm font-semibold text-slate-900">
                  {activeSop.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTicket(activeSop.linkedTicketId)}
                className="text-xs font-medium text-blue-700 hover:underline font-mono shrink-0"
              >
                Inspect {activeSop.linkedTicketId}
              </button>
            </div>

            <div>
              <div className="font-semibold text-slate-800">Symptom</div>
              <p className="mt-1 text-slate-600 leading-relaxed">
                {activeSop.symptom}
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-800">
                Diagnostic Commands & Controls
              </div>
              <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded font-mono text-slate-800">
                {activeSop.commands}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800">
                Standard Resolution Procedure
              </div>
              <p className="mt-1 text-slate-600 leading-relaxed">
                {activeSop.resolution}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-500 space-x-3">
            <span>SLA Tiers: {slaPolicies.map((s) => `${s.priority} (${formatMinutes(s.resolutionMinutes)})`).join(' · ')}</span>
          </div>
          <button
            type="button"
            onClick={onResetLab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Lab to 26 Seed Tickets</span>
          </button>
        </div>
      </section>
    </div>
  );
}
