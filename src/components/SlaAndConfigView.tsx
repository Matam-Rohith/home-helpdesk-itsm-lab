import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type {
  ApprovalRule,
  Category,
  ImpactLevel,
  ItsmPlatform,
  SlaPolicy,
  TicketType,
  UrgencyLevel,
} from '../types/itsm';
import { AGENTS, calculatePriority, formatMinutes } from '../utils/itsmHelpers';
import { PriorityText } from './StatusVisuals';

interface SlaAndConfigViewProps {
  platform: ItsmPlatform;
  onChangePlatform: (platform: ItsmPlatform) => void;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onToggleCategory: (id: string) => void;
  slaPolicies: SlaPolicy[];
  onUpdateSlaPolicy: (id: string, patch: Partial<SlaPolicy>) => void;
  approvalRules: ApprovalRule[];
  onToggleApprovalRule: (id: string) => void;
}

type ConfigTab = 'categories' | 'slas' | 'approvals' | 'platform';

const PLATFORMS: {
  name: ItsmPlatform;
  license: string;
  deployment: string;
  notes: string;
}[] = [
  {
    name: 'Zammad (Open-Source)',
    license: 'AGPLv3 · Self-Hosted Docker',
    deployment: 'docker compose up (Rails + PostgreSQL + Elasticsearch)',
    notes:
      'Strongest open-source ticketing UX with native SLA timers, trigger rules, and email/webhook intake.',
  },
  {
    name: 'GLPI (Open-Source)',
    license: 'GPLv2 · Self-Hosted LAMP',
    deployment: 'PHP + MariaDB + FusionInventory / GLPI Agent',
    notes:
      'Deep ITIL CMDB asset inventory paired with help desk queues, SLA escalations, and approval plugins.',
  },
  {
    name: 'Jira Service Management (Free)',
    license: 'Cloud Free Tier (up to 3 agents)',
    deployment: 'Atlassian Cloud Sandbox',
    notes:
      'Industry-standard request types, SLAs, JQL queues, and Confluence KB integration for portfolio demos.',
  },
  {
    name: 'Freshservice (Trial)',
    license: '14-Day SaaS Trial',
    deployment: 'Freshworks Cloud',
    notes:
      'Polished ITIL v4 incident, change, and workflow automator with visual approval routing.',
  },
];

const IMPACTS: ImpactLevel[] = ['High', 'Medium', 'Low'];
const URGENCIES: UrgencyLevel[] = ['High', 'Medium', 'Low'];

export function SlaAndConfigView({
  platform,
  onChangePlatform,
  categories,
  onAddCategory,
  onToggleCategory,
  slaPolicies,
  onUpdateSlaPolicy,
  approvalRules,
  onToggleApprovalRule,
}: SlaAndConfigViewProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('categories');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState(AGENTS[0]);
  const [newReqApproval, setNewReqApproval] = useState(false);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    onAddCategory({
      code: newCode.trim().toUpperCase().slice(0, 5),
      name: newName.trim(),
      description:
        newDesc.trim() || 'Custom service desk category for lab routing.',
      defaultAssignee: newOwner,
      requiresApprovalForRequests: newReqApproval,
      active: true,
    });
    setNewCode('');
    setNewName('');
    setNewDesc('');
    setNewReqApproval(false);
  };

  const tabs: { id: ConfigTab; label: string }[] = [
    { id: 'categories', label: 'Categories' },
    { id: 'slas', label: 'Priority Matrix & SLAs' },
    { id: 'approvals', label: 'Approval Rules' },
    { id: 'platform', label: 'ITSM Tool Setup' },
  ];

  return (
    <div className="space-y-6 max-w-[1440px]">
      {/* Sub-navigation */}
      <div
        className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-md overflow-x-auto max-w-full"
        role="tablist"
        aria-label="Configuration sections"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeTab === t.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Service Desk Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 pb-4 border-b border-slate-100">
              Maps incoming tickets to default queue owners and approval policies
            </p>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-3 font-medium">Code</th>
                    <th className="py-2.5 pr-4 font-medium">Category</th>
                    <th className="py-2.5 pr-4 font-medium">Queue Owner</th>
                    <th className="py-2.5 pr-4 font-medium">Approval Gate</th>
                    <th className="py-2.5 font-medium text-right">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="h-12">
                      <td className="pr-3 font-mono font-semibold text-slate-900">
                        {cat.code}
                      </td>
                      <td className="pr-4">
                        <div className="font-medium text-slate-900">
                          {cat.name}
                        </div>
                        <div className="text-slate-500 truncate max-w-sm">
                          {cat.description}
                        </div>
                      </td>
                      <td className="pr-4 text-slate-700 whitespace-nowrap">
                        {cat.defaultAssignee}
                      </td>
                      <td className="pr-4 text-slate-600 whitespace-nowrap">
                        {cat.requiresApprovalForRequests
                          ? 'Required on Requests'
                          : 'Standard'}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => onToggleCategory(cat.id)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            cat.active
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {cat.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5 h-fit">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Add Service Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 pb-4 border-b border-slate-100">
              Create a new queue route for home lab or endpoint support
            </p>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="IOT"
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Smart Home & IoT"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Default Queue Owner
                </label>
                <select
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
                >
                  {AGENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Scope Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Zigbee bridges, Home Assistant containers, VLAN 20 sensors"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newReqApproval}
                  onChange={(e) => setNewReqApproval(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Require approval on Service Requests</span>
              </label>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Category</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Priority Matrix & SLAs Tab */}
      {activeTab === 'slas' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              ITIL Priority Matrix (Impact × Urgency)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 pb-4 border-b border-slate-100">
              Automatically assigns ticket priority and SLA policy based on business impact and urgency
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full max-w-2xl text-left border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 font-medium text-slate-500 border-r border-slate-200">
                      Impact \ Urgency
                    </th>
                    {URGENCIES.map((u) => (
                      <th key={u} className="p-3 font-semibold text-slate-800">
                        {u} Urgency
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {IMPACTS.map((impact) => (
                    <tr key={impact}>
                      <td className="p-3 font-semibold text-slate-800 bg-slate-50 border-r border-slate-200">
                        {impact} Impact
                      </td>
                      {URGENCIES.map((urgency) => {
                        const pri = calculatePriority(impact, urgency);
                        return (
                          <td key={urgency} className="p-3">
                            <PriorityText priority={pri} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              SLA Policy Targets & Escalation Thresholds
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 pb-4 border-b border-slate-100">
              Adjust first-response and resolution targets in real time across the lab
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Priority</th>
                    <th className="py-2.5 pr-4 font-medium">Policy Name</th>
                    <th className="py-2.5 pr-4 font-medium">First Response</th>
                    <th className="py-2.5 pr-4 font-medium">Resolution Target</th>
                    <th className="py-2.5 pr-4 font-medium">Coverage</th>
                    <th className="py-2.5 font-medium">Auto-Escalate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slaPolicies.map((pol) => (
                    <tr key={pol.id} className="h-14">
                      <td className="pr-4">
                        <PriorityText priority={pol.priority} />
                      </td>
                      <td className="pr-4">
                        <div className="font-medium text-slate-900">
                          {pol.label}
                        </div>
                        <div className="text-slate-500 max-w-xs truncate">
                          {pol.description}
                        </div>
                      </td>
                      <td className="pr-4">
                        <select
                          aria-label={`${pol.priority} first response`}
                          value={pol.firstResponseMinutes}
                          onChange={(e) =>
                            onUpdateSlaPolicy(pol.id, {
                              firstResponseMinutes: Number(e.target.value),
                            })
                          }
                          className="px-2 py-1 border border-slate-200 rounded font-mono bg-white"
                        >
                          {[15, 30, 60, 120, 240, 480].map((m) => (
                            <option key={m} value={m}>
                              {formatMinutes(m)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="pr-4">
                        <select
                          aria-label={`${pol.priority} resolution target`}
                          value={pol.resolutionMinutes}
                          onChange={(e) =>
                            onUpdateSlaPolicy(pol.id, {
                              resolutionMinutes: Number(e.target.value),
                            })
                          }
                          className="px-2 py-1 border border-slate-200 rounded font-mono bg-white"
                        >
                          {[120, 240, 480, 720, 1440, 2880, 4320].map((m) => (
                            <option key={m} value={m}>
                              {formatMinutes(m)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="pr-4">
                        <select
                          aria-label={`${pol.priority} coverage`}
                          value={pol.coverage}
                          onChange={(e) =>
                            onUpdateSlaPolicy(pol.id, {
                              coverage: e.target.value as
                                | '24/7'
                                | 'Business Hours (8x5)',
                            })
                          }
                          className="px-2 py-1 border border-slate-200 rounded bg-white"
                        >
                          <option value="24/7">24/7</option>
                          <option value="Business Hours (8x5)">
                            Business Hours (8x5)
                          </option>
                        </select>
                      </td>
                      <td className="text-slate-600 tabular-nums">
                        At {pol.escalationThresholdPct}% →{' '}
                        {pol.autoEscalateTo.replace(/\s*\(.*?\)\s*/g, '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Approval Rules Tab */}
      {activeTab === 'approvals' && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Automated Approval Workflow Rules ({approvalRules.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 pb-4 border-b border-slate-100">
            Matches incoming requests and changes to multi-stage approval chains before fulfillment
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {approvalRules.map((rule) => {
              const catName =
                categories.find((c) => c.id === rule.categoryId)?.name ??
                'Any Category';
              return (
                <div
                  key={rule.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-900">
                        {rule.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">
                        {rule.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{rule.description}</p>
                    <div className="text-xs text-slate-500 pt-1">
                      <span>Trigger: {catName}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        Types: {(rule.ticketTypes as TicketType[]).join(', ')}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        Chain:{' '}
                        {rule.stages
                          .map((s) => `${s.stageName} (${s.approverRole})`)
                          .join(' → ')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleApprovalRule(rule.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium shrink-0 self-start sm:self-center transition-colors ${
                      rule.active
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {rule.active ? 'Rule Active' : 'Paused'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Platform Setup Tab */}
      {activeTab === 'platform' && (
        <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              ITSM Platform Profile
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the free/open-source ITSM tool architecture this home lab models and exports for
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORMS.map((item) => {
              const selected = platform === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onChangePlatform(item.name)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selected
                      ? 'border-blue-700 bg-blue-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-slate-900">
                      {item.name}
                    </span>
                    {selected && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Active Profile
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-mono text-slate-500">
                    {item.license}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {item.notes}
                  </p>
                  <div className="mt-2 text-xs font-mono text-slate-500">
                    Stack: {item.deployment}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
