# Siew's Capital — Mission Control v4 Architecture

**Based on:** https://x.com/pbteja1998/status/2017662163540971756  
**Tailored for:** Siew's Capital  
**Database:** Convex (signup pending — local JSON fallback for now)  
**Date:** March 11, 2026

---

## 🎯 SIEW'S CAPITAL AGENT SQUAD

| Employee | Role | Session Key | Personality | Specialty |
|----------|------|-------------|-------------|-----------|
| **JARVIS** | CEO / Squad Lead | `agent:main:main` | Sharp, capable, slightly dry humor. Decisive. | Coordination, delegation, final decisions |
| **ATLAS** | Senior Research Analyst | `agent:research:main` | Thorough, skeptical, evidence-based. | Deep research, literature review, fact-checking |
| **FORGE** | Lead Developer | `agent:dev:main` | Execution-focused, quality obsessed. | Code implementation, debugging, architecture |
| **SCRIBE** | Content Director | `agent:content:main` | Precise, humanizer expert. | Documentation, PR descriptions, writing |
| **PIXEL** | Creative Director | `agent:design:main` | Visual thinker, detail-oriented. | UI/UX, graphics, brand assets |
| **TRADER** | Portfolio Manager | `agent:trading:main` | Analytical, risk-aware. | Stock analysis, trading signals, market research |
| **SHIELD** | Risk Officer | `agent:risk:main` | Cautious, compliance-focused. | Security reviews, safety checks, risk assessment |
| **ECHO** | Communications Lead | `agent:comms:main` | Clear, concise, proactive. | Telegram updates, reporting, stakeholder comms |
| **CLOSER** | Execution Specialist | `agent:execution:main` | Detail-oriented, shipping-focused. | Final checks, deployment, task completion |
| **SENTINEL** | System Monitor | `agent:monitor:main` | Vigilant, alert-driven. | System health, cron monitoring, alerts |

---

## ⏰ HEARTBEAT SCHEDULE (Staggered)

All agents wake every 15 minutes, staggered to avoid simultaneous API calls:

| Time | Agent | Action |
|------|-------|--------|
| :00 | SENTINEL | Check system health, cron status, alerts |
| :02 | JARVIS | Review mission control, delegate tasks |
| :04 | ATLAS | Check research tasks, update findings |
| :06 | FORGE | Check dev tasks, code reviews |
| :08 | SCRIBE | Check content tasks, documentation needs |
| :10 | PIXEL | Check design tasks, visual updates |
| :12 | TRADER | Check market data, trading signals |
| :14 | SHIELD | Check security alerts, risk items |

---

## 🏗️ SYSTEM ARCHITECTURE

### 1. Data Layer (Convex → Local JSON fallback)

**Schema:**
```typescript
// agents
{
  id: string,
  name: string,           // "ATLAS"
  role: string,           // "Senior Research Analyst"
  status: "idle" | "active" | "blocked",
  currentTaskId: string,
  sessionKey: string,     // "agent:research:main"
  personality: string,    // Reference to SOUL.md
  lastHeartbeat: datetime,
  level: "intern" | "specialist" | "lead"
}

// tasks
{
  id: string,
  title: string,
  description: string,
  status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked",
  assigneeIds: string[],  // Agent IDs
  projectId: string,      // Link to project
  priority: "low" | "medium" | "high" | "urgent",
  createdAt: datetime,
  updatedAt: datetime,
  dueDate: datetime,
  tags: string[]
}

// cronJobs
{
  id: string,
  name: string,           // "sentinel-pr-monitor"
  schedule: string,       // "cron */30 * * * *"
  agentId: string,        // Which agent owns this
  lastRunAt: datetime,
  lastStatus: "success" | "failed" | "running",
  nextRunAt: datetime,
  durationMs: number,
  errorMessage: string,
  isActive: boolean
}

// projects
{
  id: string,
  name: string,           // "NarrativeAlpha"
  repo: string,           // "Siew-s-Capital/NarrativeAlpha"
  status: "active" | "idle" | "archived",
  health: "good" | "warning" | "critical",
  progress: number,       // 0-100
  lastCommitAt: datetime,
  openIssues: number,
  openPRs: number,
  owner: string           // Agent ID
}

// messages (task comments)
{
  id: string,
  taskId: string,
  fromAgentId: string,
  content: string,
  attachments: string[],
  createdAt: datetime
}

// activities (feed)
{
  id: string,
  type: "task_created" | "task_updated" | "message_sent" | "agent_heartbeat" | "cron_run",
  agentId: string,
  message: string,
  metadata: object,
  createdAt: datetime
}

// notifications
{
  id: string,
  mentionedAgentId: string,
  content: string,
  taskId: string,
  delivered: boolean,
  createdAt: datetime
}
```

### 2. Heartbeat System

**Cron Schedule:**
```bash
# SENTINEL — System monitoring
0,15,30,45 * * * *  → Check health, update metrics

# JARVIS — Coordination
2,17,32,47 * * * *  → Review tasks, delegate

# ATLAS — Research
4,19,34,49 * * * *  → Check research queue

# FORGE — Development
6,21,36,51 * * * *  → Check dev tasks

# SCRIBE — Content
8,23,38,53 * * * *  → Check docs needed

# PIXEL — Design
10,25,40,55 * * * * → Check design tasks

# TRADER — Markets
12,27,42,57 * * * * → Check trading signals

# SHIELD — Security
14,29,44,59 * * * * → Check security alerts
```

### 3. Mission Control UI Structure

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  SIEW'S CAPITAL — MISSION CONTROL          [Clock] [User]│
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  SIDEBAR │               MAIN CONTENT                   │
│          │                                              │
│  🏠 Home │  Tab: Tasks | Calendar | Projects | Analytics│
│  📋 Tasks│                                              │
│  📅 Cal  │  ┌─────────────────────────────────────────┐ │
│  🚀 Proj │  │           CONTENT AREA                  │ │
│  📊 Anal │  │                                         │ │
│  👥 Team │  │  [Kanban | Calendar Grid | Project List]│ │
│  🏢 Office│ │                                         │ │
│          │  └─────────────────────────────────────────┘ │
│  ────────┤                                              │
│  🔔 Notif│  AGENT STATUS BAR                          │
│          │  [ATLAS] [FORGE] [SCRIBE] [PIXEL] ...       │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Tabs:**
1. **Home** — Overview dashboard, stats, recent activity
2. **Tasks** — Kanban board (Inbox → Assigned → In Progress → Review → Done)
3. **Calendar** — Cron schedules, deadlines, milestones
4. **Projects** — All Siew's Capital repos, health, progress
5. **Analytics** — OSS contributions, PR metrics, agent activity
6. **Team** — Agent profiles, status, current work
7. **Office** — Visual floor plan with agent positions

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Data Layer (2 hours)
- [ ] Read `~/.openclaw/cron.json` → populate cronJobs table
- [ ] Read `gh repo list Siew-s-Capital` → populate projects table
- [ ] Create agents table with Siew's Capital squad
- [ ] Create tasks table (initial empty)
- [ ] Set up local JSON storage (until Convex ready)

### Phase 2: Core UI (3 hours)
- [ ] Sidebar navigation
- [ ] Agent status bar
- [ ] Home dashboard
- [ ] Tasks Kanban board
- [ ] Calendar view with cron jobs

### Phase 3: Features (3 hours)
- [ ] Projects directory (GitHub sync)
- [ ] Analytics dashboard (real data)
- [ ] Team profiles
- [ ] Office floor plan
- [ ] Notification system

### Phase 4: Polish (2 hours)
- [ ] Styling match Siew's Capital brand
- [ ] Real-time updates (polling)
- [ ] Error handling
- [ ] Build & deploy

**Total: 10 hours (can parallelize with multiple employees)**

---

## 🔌 DATA SOURCES

### Cron Jobs
```bash
# Source: ~/.openclaw/cron.json
openclaw cron list → JSON → cronJobs table
```

### Projects
```bash
# Source: GitHub API
gh repo list Siew-s-Capital --limit 30 --json name,description,updatedAt,pushedAt,openIssuesCount,openPullRequestsCount
```

### PRs / Contributions
```bash
# Source: GitHub Search API
gh search prs --repo Siew-s-Capital/NarrativeAlpha --state merged --created ">2026-01-01"
```

### Agent Activity
```bash
# Source: ~/.openclaw/workspace/memory/
ls memory/YYYY-MM-DD.md → parse for activity
```

---

## 🎨 DESIGN SYSTEM

**Colors:**
- Background: `#0a0a0a` (near black)
- Surface: `#141414` (card backgrounds)
- Border: `#27272a` (subtle dividers)
- Text Primary: `#fafafa` (white)
- Text Secondary: `#a1a1aa` (muted)
- Accent: `#f59e0b` (amber/orange — finance/trading theme)
- Success: `#22c55e` (green)
- Warning: `#eab308` (yellow)
- Error: `#ef4444` (red)

**Typography:**
- Font: Inter (system fallback)
- Scale: 12px (labels) → 14px (body) → 18px (headings) → 24px (titles)

**Spacing:**
- Tight: 4px, 8px
- Normal: 12px, 16px, 20px
- Loose: 24px, 32px

---

## 📝 DOCUMENTATION FILES TO CREATE

1. `~/Desktop/Siew's Capital/MissionControl/docs/ARCHITECTURE.md` — This file
2. `~/Desktop/Siew's Capital/MissionControl/docs/AGENTS.md` — Agent reference
3. `~/Desktop/Siew's Capital/MissionControl/docs/API.md` — Data contracts
4. `~/Desktop/Siew's Capital/MissionControl/docs/DEPLOYMENT.md` — How to deploy

---

## 🚀 DEPLOYMENT

**Current URL:** https://mission-control-beryl-five.vercel.app

**Deploy command:**
```bash
cd ~/Desktop/Siew's Capital/MissionControl
vercel --prod
```

**Environment Variables (for Convex later):**
```
CONVEX_URL=
CONVEX_DEPLOYMENT=
```

---

## ⚠️ CRITICAL NOTES

1. **Convex Signup Pending** — Using local JSON files for now. Will migrate to Convex when Brayden signs up.

2. **Real Data Only** — No mock data. Everything comes from:
   - `~/.openclaw/cron.json`
   - GitHub API
   - Local memory files

3. **Employee Names** — Use Siew's Capital names (ATLAS, FORGE, etc.), NOT the article's names (Shuri, Fury, etc.).

4. **Cron Schedule** — Must match actual `openclaw cron list` output.

5. **Projects** — Must match actual `Siew-s-Capital` GitHub repos.

---

**Next Step:** Spawn employees to implement Phase 1 (Data Layer) in parallel.
