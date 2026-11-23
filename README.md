# HomeDesk ITSM Lab

An interactive **IT Service Management (ITSM) & Home Help Desk Lab** designed around open-source **Zammad / GLPI** and ITIL v4 service desk workflows. Built to demonstrate practical Tier 1/Tier 2 troubleshooting, SLA governance, priority triage, multi-stage approval workflows, and root-cause documentation across **26 realistic lab tickets**.

## Core Capabilities Implemented

- **Service Desk Categories (6 Queues)**: Network & VPN (`NET`), Hardware & Peripherals (`HW`), Identity & Access (`IAM`), Software & Licensing (`SW`), Home Lab & Infra (`LAB`), and Security & Compliance (`SEC`), each mapped to default queue owners and approval gates.
- **ITIL Priority Matrix (Impact × Urgency)**: Automatically computes `P1 Critical` through `P4 Low` from ticket impact and urgency.
- **SLA Policy Engine**: Configures First Response Targets (`15m`–`8h`), Resolution Targets (`4h`–`72h`), coverage windows (`24/7` vs `8x5`), and escalation thresholds with live elapsed-vs-target progress bars.
- **Multi-Stage Approval Workflow (`APR-01` – `APR-04`)**: Automatically intercepts Hardware Procurement (`>$150`), Privileged IAM Elevation, Edge Firewall/VLAN Changes, and Commercial SaaS Seat Requests before moving them into fulfillment.
- **26 Realistic Lab Tickets (20 Resolved + 3 Pending Approval + 3 Active)**:
  - **20 Resolved / Closed Incidents & Requests**: Covers WireGuard MTU/NAT drops, Proxmox ZFS I/O wait stalls, OPNsense mDNS VLAN printing, Authentik OIDC proxy loops, BitLocker TPM recovery, OpenSSH CVE patching, and a realistic **P1 ZFS NVMe failure (`INC-1012`)** including an SLA breach post-mortem.
  - **3 Pending Approvals & 3 Active Tickets**: Ready for live stage sign-off, agent triage, internal/public replies, and ticket resolution.
- **Portfolio Exports & Knowledge Base SOPs**: Export live **Markdown Lab Reports** (`README-ITSM-Lab-Report.md`) and **CSV Ticket Logs** (`itsm-tickets-log.csv`), plus inspect 5 SOPs derived from recurring incidents.

## SLA Policy Matrix

| Priority | Tier Label | First Response | Resolution Target | Coverage | Escalation Trigger |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | Critical Outage | 15m | 4h | 24/7 | 75% |
| **P2** | High Degradation | 30m | 8h | 24/7 | 80% |
| **P3** | Medium Standard | 2h | 24h | Business Hours (8x5) | 85% |
| **P4** | Low / Planned | 8h | 72h | Business Hours (8x5) | 90% |

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Build & Tooling**: Vite 6, ESLint, strict TypeScript (`tsc --noEmit`)
- **State Persistence**: Browser `localStorage` with one-click reset to the 26-ticket baseline

## Running Locally

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run preview
```