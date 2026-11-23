import { useEffect, useMemo, useState } from 'react';
import { ApprovalQueueView } from './components/ApprovalQueueView';
import { Header } from './components/Header';
import { LabRunbookView } from './components/LabRunbookView';
import { NewTicketModal } from './components/NewTicketModal';
import { OverviewView } from './components/OverviewView';
import { Sidebar } from './components/Sidebar';
import { SlaAndConfigView } from './components/SlaAndConfigView';
import { TicketDetailDrawer } from './components/TicketDetailDrawer';
import { TicketQueueView } from './components/TicketQueueView';
import {
  SEED_APPROVAL_RULES,
  SEED_CATEGORIES,
  SEED_SLA_POLICIES,
  SEED_TICKETS,
} from './data/seedItsm';
import type {
  ActiveView,
  ApprovalRule,
  Category,
  ItsmPlatform,
  ResolutionCode,
  SlaPolicy,
  Ticket,
} from './types/itsm';
import { computeSlaState } from './utils/itsmHelpers';

const STORAGE_KEY = 'homedesk-itsm-lab-v1';

interface PersistedState {
  platform: ItsmPlatform;
  categories: Category[];
  slaPolicies: SlaPolicy[];
  approvalRules: ApprovalRule[];
  tickets: Ticket[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.tickets) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.slaPolicies) &&
        Array.isArray(parsed.approvalRules)
      ) {
        return {
          platform: parsed.platform ?? 'Zammad (Open-Source)',
          categories: parsed.categories,
          slaPolicies: parsed.slaPolicies,
          approvalRules: parsed.approvalRules,
          tickets: parsed.tickets,
        };
      }
    }
  } catch {
    // Fall back to seed data if storage is malformed
  }
  return {
    platform: 'Zammad (Open-Source)',
    categories: SEED_CATEGORIES,
    slaPolicies: SEED_SLA_POLICIES,
    approvalRules: SEED_APPROVAL_RULES,
    tickets: SEED_TICKETS,
  };
}

export function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const [platform, setPlatform] = useState<ItsmPlatform>(initial.platform);
  const [categories, setCategories] = useState<Category[]>(initial.categories);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>(
    initial.slaPolicies
  );
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(
    initial.approvalRules
  );
  const [tickets, setTickets] = useState<Ticket[]>(initial.tickets);

  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        platform,
        categories,
        slaPolicies,
        approvalRules,
        tickets,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors in ephemeral environments
    }
  }, [platform, categories, slaPolicies, approvalRules, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const openCount = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.status !== 'Resolved' &&
          t.status !== 'Closed'
      ).length,
    [tickets]
  );

  const pendingApprovalCount = useMemo(
    () => tickets.filter((t) => t.approvalStatus === 'Pending').length,
    [tickets]
  );

  const nextSequenceNumber = useMemo(() => {
    const nums = tickets.map((t) => {
      const match = t.id.match(/(\d+)$/);
      return match ? Number(match[1]) : 1000;
    });
    return Math.max(1026, ...nums) + 1;
  }, [tickets]);

  const handleCreateTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setActiveView('tickets');
  };

  const handleUpdateTicket = (ticketId: string, patch: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updated = { ...t, ...patch };
        const policy = slaPolicies.find((s) => s.priority === updated.priority);
        updated.slaState = computeSlaState(updated, policy);
        return updated;
      })
    );
  };

  const handleAddComment = (
    ticketId: string,
    body: string,
    visibility: 'Public' | 'Internal'
  ) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          firstResponseAt: t.firstResponseAt ?? now,
          comments: [
            ...t.comments,
            {
              id: `c-${Date.now()}`,
              author: 'Matam Rohith (Lead Admin)',
              role: 'Agent',
              visibility,
              body,
              timestamp: now,
            },
          ],
        };
      })
    );
  };

  const handleResolveTicket = (
    ticketId: string,
    resolutionCode: ResolutionCode,
    resolutionNotes: string,
    timeSpentMinutes: number
  ) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const policy = slaPolicies.find((s) => s.priority === t.priority);
        const updated: Ticket = {
          ...t,
          status: 'Resolved',
          resolvedAt: now,
          firstResponseAt: t.firstResponseAt ?? now,
          resolutionCode,
          resolutionNotes,
          timeSpentMinutes,
          comments: [
            ...t.comments,
            {
              id: `c-res-${Date.now()}`,
              author: 'Matam Rohith (Lead Admin)',
              role: 'Agent',
              visibility: 'Public',
              body: `Resolved (${resolutionCode}): ${resolutionNotes}`,
              timestamp: now,
            },
          ],
        };
        updated.slaState = computeSlaState(updated, policy);
        return updated;
      })
    );
  };

  const handleApprovalDecision = (
    ticketId: string,
    decision: 'Approved' | 'Rejected',
    comment: string
  ) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const pendingIdx = t.approvalSteps.findIndex(
          (s) => s.status === 'Pending'
        );
        if (pendingIdx < 0) return t;

        const targetStep = t.approvalSteps[pendingIdx];
        const nextSteps = t.approvalSteps.map((step, idx) =>
          idx === pendingIdx
            ? {
                ...step,
                status: decision,
                decidedAt: now,
                comment,
              }
            : step
        );

        if (decision === 'Rejected') {
          return {
            ...t,
            approvalSteps: nextSteps,
            approvalStatus: 'Rejected',
            status: 'Closed',
            resolvedAt: now,
            resolutionCode: 'Rejected by Approver',
            resolutionNotes: `Approval rejected at stage "${targetStep.stageName}" by ${targetStep.approverName}: ${comment}`,
            slaState: 'Met',
            comments: [
              ...t.comments,
              {
                id: `c-apr-${Date.now()}`,
                author: `${targetStep.approverName} (${targetStep.approverRole})`,
                role: 'Approver',
                visibility: 'Public',
                body: `Rejected Stage ${pendingIdx + 1}: ${comment}`,
                timestamp: now,
              },
            ],
          };
        }

        const hasMorePending = nextSteps.some((s) => s.status === 'Pending');
        return {
          ...t,
          approvalSteps: nextSteps,
          approvalStatus: hasMorePending ? 'Pending' : 'Approved',
          status: hasMorePending ? 'Pending Approval' : 'In Progress',
          comments: [
            ...t.comments,
            {
              id: `c-apr-${Date.now()}`,
              author: `${targetStep.approverName} (${targetStep.approverRole})`,
              role: 'Approver',
              visibility: 'Internal',
              body: `Approved Stage ${pendingIdx + 1} (${targetStep.stageName}): ${comment}${
                hasMorePending
                  ? ''
                  : ' All approval gates satisfied — moved to In Progress for fulfillment.'
              }`,
              timestamp: now,
            },
          ],
        };
      })
    );
  };

  const handleAddCategory = (cat: Omit<Category, 'id'>) => {
    setCategories((prev) => [
      ...prev,
      {
        ...cat,
        id: `cat-${Date.now()}`,
      },
    ]);
  };

  const handleToggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleUpdateSlaPolicy = (id: string, patch: Partial<SlaPolicy>) => {
    setSlaPolicies((prev) => {
      const nextPolicies = prev.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      );
      const updatedPol = nextPolicies.find((p) => p.id === id);
      if (updatedPol && patch.resolutionMinutes !== undefined) {
        setTickets((prevTickets) =>
          prevTickets.map((t) => {
            if (t.priority !== updatedPol.priority) return t;
            const updatedTicket = {
              ...t,
              slaTargetMinutes: updatedPol.resolutionMinutes,
            };
            updatedTicket.slaState = computeSlaState(
              updatedTicket,
              updatedPol
            );
            return updatedTicket;
          })
        );
      }
      return nextPolicies;
    });
  };

  const handleToggleApprovalRule = (id: string) => {
    setApprovalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleResetLab = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPlatform('Zammad (Open-Source)');
    setCategories(SEED_CATEGORIES);
    setSlaPolicies(SEED_SLA_POLICIES);
    setApprovalRules(SEED_APPROVAL_RULES);
    setTickets(SEED_TICKETS);
    setSelectedTicketId(null);
    setActiveView('overview');
  };

  return (
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        openCount={openCount}
        pendingApprovalCount={pendingApprovalCount}
        totalCount={tickets.length}
        platform={platform}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeView={activeView}
          onOpenNewTicket={() => setNewTicketOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeView === 'overview' && (
            <OverviewView
              tickets={tickets}
              categories={categories}
              slaPolicies={slaPolicies}
              approvalRules={approvalRules}
              platform={platform}
              onNavigate={setActiveView}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          )}

          {activeView === 'tickets' && (
            <TicketQueueView
              tickets={tickets}
              categories={categories}
              selectedTicketId={selectedTicketId}
              onSelectTicket={(id) => setSelectedTicketId(id)}
              onOpenNewTicket={() => setNewTicketOpen(true)}
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalQueueView
              tickets={tickets}
              categories={categories}
              approvalRules={approvalRules}
              onApprovalDecision={handleApprovalDecision}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          )}

          {activeView === 'config' && (
            <SlaAndConfigView
              platform={platform}
              onChangePlatform={setPlatform}
              categories={categories}
              onAddCategory={handleAddCategory}
              onToggleCategory={handleToggleCategory}
              slaPolicies={slaPolicies}
              onUpdateSlaPolicy={handleUpdateSlaPolicy}
              approvalRules={approvalRules}
              onToggleApprovalRule={handleToggleApprovalRule}
            />
          )}

          {activeView === 'runbook' && (
            <LabRunbookView
              platform={platform}
              tickets={tickets}
              categories={categories}
              slaPolicies={slaPolicies}
              approvalRules={approvalRules}
              onResetLab={handleResetLab}
            />
          )}
        </main>
      </div>

      <TicketDetailDrawer
        ticket={selectedTicket}
        categories={categories}
        slaPolicies={slaPolicies}
        onClose={() => setSelectedTicketId(null)}
        onUpdateTicket={handleUpdateTicket}
        onAddComment={handleAddComment}
        onResolveTicket={handleResolveTicket}
        onApprovalDecision={handleApprovalDecision}
      />

      <NewTicketModal
        open={newTicketOpen}
        categories={categories}
        slaPolicies={slaPolicies}
        approvalRules={approvalRules}
        nextSequenceNumber={nextSequenceNumber}
        onClose={() => setNewTicketOpen(false)}
        onCreateTicket={handleCreateTicket}
      />
    </div>
  );
}

export default App;
