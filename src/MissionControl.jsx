import React, { useState, useEffect, useRef, useCallback, Component } from "react";

/* ── IndexedDB Utilities for Persistent Storage ── */
const DB_NAME = 'MissionControlDB';
const DB_VERSION = 2; // Increment version to add settings store
const TASKS_STORE = 'tasks';
const SETTINGS_STORE = 'settings';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
};

const getSetting = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get setting from IndexedDB:', e);
    return null;
  }
};

const saveSetting = async (key, value) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save setting to IndexedDB:', e);
  }
};

const getTasksFromDB = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TASKS_STORE, 'readonly');
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get tasks from IndexedDB:', e);
    return [];
  }
};

const saveTaskToDB = async (task) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TASKS_STORE, 'readwrite');
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.put(task);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save task to IndexedDB:', e);
  }
};

const deleteTaskFromDB = async (taskId) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TASKS_STORE, 'readwrite');
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.delete(taskId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to delete task from IndexedDB:', e);
  }
};

/* ── Subagent Spawner ── */
const spawnSubagentForTask = (task) => {
  const agentName = task.assignee.toUpperCase();
  console.log(`[MISSION CONTROL] Spawning ${agentName} for task: ${task.title}`);
  
  // Update agent_positions.json via API call (simulated)
  fetch('/api/spawn-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent: task.assignee, task: task.title, taskId: task.id })
  }).catch(() => {}); // Ignore if endpoint doesn't exist yet
  
  // Log delegation
  const delegation = {
    timestamp: new Date().toISOString(),
    from: 'JARVIS',
    to: agentName,
    task: task.title,
    taskId: task.id
  };
  
  // Save to shared brain
  console.log('[DELEGATION]', delegation);
};


/* ── ErrorBoundary — catches crashes to prevent full black screen ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12, color: "#EF4444" }}>⚠️ View crashed</div>
          <div style={{ fontSize: 12, color: "#71717A", marginBottom: 16, maxWidth: 400, margin: "0 auto 16px" }}>{this.state.error?.message || "An unexpected error occurred."}</div>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding: "8px 20px", background: "#F59E0B22", border: "1px solid #F59E0B44", borderRadius: 8, color: "#F59E0B", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>↻ Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Clock — isolated component to prevent full-tree re-renders every second ── */
function ClockDisplay({ dm }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "11px", color: dm ? "#52525B" : "#71717A", fontVariantNumeric: "tabular-nums" }}>{time.toLocaleTimeString("en-US", { hour12: false })}</div>
      <div style={{ fontSize: "9px", color: dm ? "#3F3F46" : "#8A8A9A" }}>{time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SIEW'S CAPITAL — MISSION CONTROL v3
   ═══════════════════════════════════════════════════════════════════════════════
   
   🤖 OPENCLAW / JARVIS INTEGRATION GUIDE
   ═══════════════════════════════════════
   This dashboard is the central UI for Siew's Capital. OpenClaw (via JARVIS)
   can programmatically update any data displayed here. Each section below
   documents its data schema so agents know exactly what fields to modify.
   
   📌 HOW TO ADD/MODIFY DATA:
   Each stateful component (Tasks, Calendar, Memory, Projects, Docs) stores
   its data in a useState array. To update the dashboard, modify the relevant
   array entries. Each item has a unique `id` field (use Date.now() for new ones).
   
   📌 DATA FLOW:
   Chairman (Brayden) → JARVIS (CEO) → Agents → Dashboard updates
   
   📌 TABS (8 total):
   🏠 Home      — Overview dashboard with stats, activity feed, notifications
   📋 Tasks     — Unified kanban board (Inbox→Assigned→In Progress→Review→Done)
   📅 Calendar  — Monthly view with scheduled events per day
   🧠 Memory    — Searchable knowledge base with categories
   🚀 Projects  — High-level goals & sprints with progress tracking
   📄 Docs      — Document library (strategies, reports, newsletters, etc.)
   👥 Team      — Agent profiles with roles, models, and responsibilities
   🏛 Org Chart — Department-grouped hierarchy with expandable cards
   📊 Analytics — Performance metrics, charts, agent stats
   🕹 Office    — Pixel art floor plan with living agent animations
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════════
   AGENTS REGISTRY
   ═══════════════════════════════════════════════════════════════════════════════
   Master list of all AI agents. Referenced by `id` throughout the app.
   
   Schema: { id: string, name: string, role: string, color: hex, initials: string, icon: emoji }
   
   Status groups:
   - ACTIVE (Phase 1): jarvis, atlas, forge, scribe, pixel, shield, sentinel
   - STANDBY (Phase 2): trader, echo, closer
   
   To add a new agent: push to this array + add to relevant components
   ═══════════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════════
   UNIFIED AGENT REGISTRY — Single source of truth for ALL views
   type: "agent" = regular employee, "council" = advisory council, "oracle" = oracle consultant
   ═══════════════════════════════════════════════════════════════════════════════ */
let AGENTS = [
  // ── Regular Employees ──
  { id: "jarvis", name: "JARVIS", role: "CEO", color: "#3B82F6", initials: "JV", icon: "⚙️", type: "agent", status: "online" },
  // Council Advisory
  {
    id: "risk", name: "RISK", role: "Risk Analyst", color: "#EF4444", initials: "RK", icon: "⚠️", type: "council", status: "online",
    desc: "Finds what could go wrong. Worst-case scenarios, hidden downsides, black swan events."
  },
  {
    id: "growth", name: "GROWTH", role: "Growth Strategist", color: "#10B981", initials: "GR", icon: "📈", type: "council", status: "online",
    desc: "Finds the upside. Timing, positioning, market opportunity, scaling paths."
  },
  {
    id: "devils", name: "DEVIL'S ADVOCATE", role: "Critical Thinker", color: "#F59E0B", initials: "DA", icon: "🔥", type: "council", status: "online",
    desc: "Pokes holes in BOTH arguments. Challenges assumptions, stress-tests logic."
  },
  // ── Oracle Consultant ──
  {
    id: "oracle", name: "ORACLE", role: "Strategic Consultant", color: "#A855F7", initials: "OR", icon: "🔮", type: "oracle", status: "online",
    desc: "McKinsey-level strategy. Called for high-stakes decisions, major pivots, when Council can't agree."
  },
];

/* Listeners for state changes — all views re-render when agents change */
const _agentListeners = new Set();
function onAgentsChange(fn) { _agentListeners.add(fn); return () => _agentListeners.delete(fn); }
function notifyAgentsChange() { _agentListeners.forEach(fn => fn([...AGENTS])); _syncOpenClawState(); }

/* ── Agent CRUD — syncs across Office, Team, Org Chart, everything ── */
function addAgent(newAgent) {
  if (AGENTS.find(a => a.id === newAgent.id)) return false;
  AGENTS = [...AGENTS, { ...newAgent, type: newAgent.type || "agent", status: newAgent.status || "online" }];
  notifyAgentsChange();
  return true;
}
function removeAgent(agentId) {
  if (!AGENTS.find(a => a.id === agentId)) return false;
  AGENTS = AGENTS.filter(a => a.id !== agentId);
  notifyAgentsChange();
  return true;
}
function updateAgentStatus(agentId, status) {
  AGENTS = AGENTS.map(a => a.id === agentId ? { ...a, status } : a);
  notifyAgentsChange();
}

/* ── OpenClaw global state export — accessible via window.__MISSION_CONTROL_STATE__ ── */
function _syncOpenClawState() {
  const mapAgent = (a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    type: a.type,
    status: a.status || "online",
    isWorking: a.status !== "offline",
    isIdle: a.status === "standby",
    statusNote: a.status === "online" ? "WORKING — actively processing tasks"
      : a.status === "standby" ? "IDLE — on standby, not actively working"
        : a.status === "offline" ? "OFFLINE — agent is not available"
          : "WORKING — actively processing tasks",
    specialization: a.specialization || "",
    description: a.description || "",
    currentTask: a.currentTask || null,
    capabilities: a.capabilities || [],
  });

  window.__MISSION_CONTROL_STATE__ = {
    timestamp: new Date().toISOString(),
    version: "3.1",

    // ── Agent roster by category ──
    employees: AGENTS.filter(a => a.type === "agent").map(mapAgent),
    council: AGENTS.filter(a => a.type === "council").map(mapAgent),
    oracle: AGENTS.filter(a => a.type === "oracle").map(mapAgent),
    allAgents: AGENTS.map(mapAgent),

    // ── Quick status counts ──
    counts: {
      total: AGENTS.length,
      working: AGENTS.filter(a => a.status !== "offline").length,
      idle: AGENTS.filter(a => a.status === "standby").length,
      offline: AGENTS.filter(a => a.status === "offline").length,
    },

    // ── OpenClaw instruction guide ──
    openclaw: {
      guide: "Use window.__MISSION_CONTROL_API__ to manage agents programmatically.",
      methods: {
        addAgent: { call: "window.__MISSION_CONTROL_API__.addAgent(agentObj)", desc: "Add a new agent. Returns true/false." },
        removeAgent: { call: "window.__MISSION_CONTROL_API__.removeAgent(agentId)", desc: "Remove agent by ID. Returns true/false." },
        updateStatus: { call: "window.__MISSION_CONTROL_API__.updateAgentStatus(agentId, status)", desc: "Set status to 'online', 'standby', or 'offline'." },
        assignTask: { call: "window.__MISSION_CONTROL_API__.assignTask(agentId, taskObj)", desc: "Assign a task object {title, priority, deadline} to an agent." },
        getAll: { call: "window.__MISSION_CONTROL_API__.getAgents()", desc: "Get array of all agents." },
      },
      statusValues: ["online", "standby", "offline"],
      agentTypes: ["agent", "council", "oracle"],
      notes: "All changes auto-sync across Office, Team, Org Chart, and Home views. State refreshes on every mutation.",
    },
  };

  window.__MISSION_CONTROL_API__ = {
    addAgent,
    removeAgent,
    updateAgentStatus,
    assignTask: (agentId, task) => {
      AGENTS = AGENTS.map(a => a.id === agentId ? { ...a, currentTask: task, status: "online" } : a);
      notifyAgentsChange();
    },
    getAgents: () => [...AGENTS],
    getState: () => window.__MISSION_CONTROL_STATE__,
  };
}
_syncOpenClawState(); // Initialize on load

/* ── Custom hook: subscribe to agent changes ── */
function useAgents() {
  const [agents, setAgents] = useState([...AGENTS]);
  
  // Poll agent_positions.json for live office status
  useEffect(() => {
    const fetchAgentPositions = async () => {
      try {
        const response = await fetch('/agent_positions.json');
        if (response.ok) {
          const data = await response.json();
          // Update agent positions based on office data
          setAgents(prevAgents => prevAgents.map(agent => {
            const officeData = data.agents?.[agent.id];
            if (officeData) {
              return {
                ...agent,
                x: officeData.x ?? agent.x,
                y: officeData.y ?? agent.y,
                desk: officeData.desk ?? agent.desk,
                status: officeData.status ?? agent.status,
                activity: officeData.activity ?? agent.activity,
                room: officeData.room ?? agent.room,
                animation: officeData.animation ?? agent.animation
              };
            }
            return agent;
          }));
        }
      } catch (e) {
        // Silent fail - use default positions
      }
    };
    
    fetchAgentPositions();
    const interval = setInterval(fetchAgentPositions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const unsub = onAgentsChange(setAgents);
    return unsub;
  }, []);
  return agents;
}

/* Helper: look up agent by id. Returns fallback if not found. */
const getAgent = (id) => AGENTS.find(a => a.id === id) || { name: id, color: "var(--mc-text3)", initials: "??" };
/* Helper: get only regular employees (backwards compat) */
const getEmployees = () => AGENTS.filter(a => a.type === "agent");
const getCouncil = () => AGENTS.filter(a => a.type === "council");
const getOracle = () => AGENTS.filter(a => a.type === "oracle");

/* ─────────────────────────────────────
   DRAG & DROP HOOK
   ───────────────────────────────────── */
function useDragDrop(items, setItems, columnKey) {
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };

  const onDrop = (e, colId) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("text/plain")) || dragId;
    if (id) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, [columnKey]: colId } : item));
    }
    setDragId(null);
    setDragOverCol(null);
  };

  const onDragEnd = () => {
    setDragId(null);
    setDragOverCol(null);
  };

  return { dragId, dragOverCol, onDragStart, onDragOver, onDrop, onDragEnd };
}

/* ─────────────────────────────────────
   TASKS BOARD (Drag & Drop)
   ───────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════════
   TASKS BOARD — Unified Kanban
   ═══════════════════════════════════════════════════════════════════════════════
   🤖 OPENCLAW TASK SCHEMA:
   {
     id: number,           // Unique ID. Use Date.now() for new tasks.
     title: string,        // Task name/description
     assignee: string,     // Agent id ("forge", "atlas", etc.) or "brayden" for Chairman
     status: string,       // One of: "inbox" | "assigned" | "in-progress" | "review" | "done"
     priority: string,     // One of: "high" | "medium" | "low"
     type: string,         // One of: "ops" | "dev" | "research" | "content" | "design"
     notes: string,        // Optional freeform notes/context
   }
   
   📌 STATUS FLOW: inbox → assigned → in-progress → review → done
   - inbox:       Unassigned ideas. No one owns it yet.
   - assigned:    Agent owns it but hasn't started. Queued.
   - in-progress: Agent is actively working on it.
   - review:      Agent finished. Needs Chairman (Brayden) approval.
   - done:        Approved and shipped.
   
   📌 TYPE CATEGORIES:
   - ops:      Operations & infrastructure (Discord setup, configs, etc.)
   - dev:      Development (bots, scripts, dashboards, etc.)
   - research: Analysis & research (market reports, token research, etc.)
   - content:  Published content (Twitter threads, blogs, newsletters)
   - design:   Visual work (logos, graphics, infographics)
   
   📌 TO ADD A TASK (OpenClaw):
   Push new object to tasks array: { id: Date.now(), title: "...", assignee: "forge",
   status: "inbox", priority: "high", type: "dev", notes: "..." }
   
   📌 TO MOVE A TASK: Change the `status` field to the target column id.
   📌 TO REASSIGN: Change the `assignee` field to a different agent id.
   ═══════════════════════════════════════════════════════════════════════════════ */
function TasksBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");

  // Load tasks: 1) IndexedDB, 2) synced tasks.json, 3) fallback defaults
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetch('/tasks.json');
        if (res.ok) {
          const payload = await res.json();
          const fileTasks = (payload.tasks || []).map((t) => ({
            id: (t.id || Date.now()).toString(),
            title: t.title || 'Untitled Task',
            assignee: (t.assignee || 'jarvis').toLowerCase(),
            status: t.status || 'inbox',
            priority: t.priority || 'medium',
            type: t.type || 'ops',
            notes: t.notes || '',
          }));
          setTasks(fileTasks);
          for (const task of fileTasks) await saveTaskToDB(task);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to load /tasks.json, checking local DB...', e);
      }

      const dbTasks = await getTasksFromDB();
      if (dbTasks.length > 0) {
        setTasks(dbTasks);
        setLoading(false);
        return;
      }

      const defaultTasks = [
        { id: "1", title: "Sync Mission Control with Workspace", assignee: "jarvis", status: "in-progress", priority: "high", type: "ops", notes: "Keep .openclaw + MissionControl synchronized" },
        { id: "2", title: "OSS Campaign: 10 PR target", assignee: "forge", status: "in-progress", priority: "high", type: "dev", notes: "7 submitted, 3 remaining" },
        { id: "3", title: "Stock Research - Dr. Tee Methodology", assignee: "trader", status: "assigned", priority: "high", type: "research", notes: "Nightly analysis via giantdetector.com" },
      ];
      setTasks(defaultTasks);
      for (const task of defaultTasks) await saveTaskToDB(task);
      setLoading(false);
    };
    loadTasks();
  }, []);

  const autoAssignAgent = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('content') || lower.includes('twitter') || lower.includes('thread') || lower.includes('blog') || lower.includes('write')) return 'scribe';
    if (lower.includes('design') || lower.includes('logo') || lower.includes('graphic') || lower.includes('visual') || lower.includes('asset')) return 'pixel';
    if (lower.includes('research') || lower.includes('market') || lower.includes('analysis') || lower.includes('report')) return 'atlas';
    if (lower.includes('trade') || lower.includes('stock') || lower.includes('crypto') || lower.includes('portfolio')) return 'trader';
    if (lower.includes('risk') || lower.includes('security')) return 'shield';
    if (lower.includes('discord') || lower.includes('community')) return 'echo';
    if (lower.includes('sales') || lower.includes('outreach') || lower.includes('email')) return 'closer';
    if (lower.includes('server') || lower.includes('deploy') || lower.includes('health')) return 'sentinel';
    if (lower.includes('build') || lower.includes('code') || lower.includes('script') || lower.includes('api') || lower.includes('github')) return 'forge';
    return 'jarvis';
  };

  const autoAssignType = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('content') || lower.includes('twitter') || lower.includes('blog')) return 'content';
    if (lower.includes('design') || lower.includes('logo') || lower.includes('graphic')) return 'design';
    if (lower.includes('research') || lower.includes('market') || lower.includes('analysis')) return 'research';
    if (lower.includes('server') || lower.includes('deploy') || lower.includes('config')) return 'ops';
    return 'dev';
  };
  const [expandedTask, setExpandedTask] = useState(null);
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortPriority, setSortPriority] = useState(false);
  const { dragId, dragOverCol, onDragStart, onDragOver, onDrop, onDragEnd } = useDragDrop(tasks, setTasks, "status");

  const columns = [
    { id: "inbox", label: "📥 INBOX", color: "#71717A" },
    { id: "assigned", label: "📌 ASSIGNED", color: "#F59E0B" },
    { id: "in-progress", label: "⚡ IN PROGRESS", color: "#3B82F6" },
    { id: "review", label: "👁 REVIEW", color: "#A855F7" },
    { id: "done", label: "✅ DONE", color: "#10B981" },
  ];
  const typeColors = { ops: "#71717A", dev: "#60A5FA", research: "#F59E0B", content: "#EC4899", design: "#A855F7" };
  const typeLabels = { ops: "OPS", dev: "DEV", research: "RESEARCH", content: "CONTENT", design: "DESIGN" };
  const priorityColors = { high: "#EF4444", medium: "#F59E0B", low: "#52525B" };
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const filteredTasks = tasks.filter(t => (filterAgent === "all" || t.assignee === filterAgent) && (filterType === "all" || t.type === filterType));
  const sortTasks = (arr) => sortPriority ? [...arr].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) : arr;

  const addTask = async () => {
    if (!newTask.trim()) return;
    const assignee = autoAssignAgent(newTask);
    const type = autoAssignType(newTask);
    const newTaskObj = { id: Date.now().toString(), title: newTask, assignee, status: "inbox", priority: "medium", type, notes: "" };
    const updated = [...tasks, newTaskObj];
    setTasks(updated);
    await saveTaskToDB(newTaskObj);
    setNewTask("");
    
    // Spawn subagent for the task
    spawnSubagentForTask(newTaskObj);
  };

  // Save all task changes to IndexedDB
  const updateTaskNotes = async (taskId, notes) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, notes } : t);
    setTasks(updated);
    const task = updated.find(t => t.id === taskId);
    if (task) await saveTaskToDB(task);
  };

  // Handle drag/drop save
  const handleDrop = async (e, colId) => {
    onDrop(e, colId);
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) {
      const updated = tasks.map(t => t.id.toString() === id.toString() ? { ...t, status: colId } : t);
      setTasks(updated);
      const task = updated.find(t => t.id.toString() === id.toString());
      if (task) await saveTaskToDB(task);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Delegate task to JARVIS..." style={{ flex: "1 1 300px", padding: "10px 14px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "8px", color: "var(--mc-text)", fontSize: "12px", fontFamily: "inherit", outline: "none" }} />
        <button onClick={addTask} style={{ padding: "10px 18px", background: "#F59E0B22", border: "1px solid #F59E0B44", borderRadius: "8px", color: "#F59E0B", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ DELEGATE</button>
      </div>
      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "var(--mc-text5)", fontWeight: 600 }}>Type:</span>
        {[{ id: "all", label: "ALL", color: "var(--mc-text3)" }, ...Object.entries(typeColors).map(([k, c]) => ({ id: k, label: typeLabels[k], color: c }))].map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)} style={{ padding: "4px 10px", background: filterType === t.id ? (t.color === "var(--mc-text3)" ? "var(--mc-card2)" : t.color + "18") : "transparent", border: `1px solid ${filterType === t.id ? (t.color === "var(--mc-text3)" ? "var(--mc-border3)" : t.color + "44") : "var(--mc-border2)"}`, borderRadius: "5px", color: filterType === t.id ? t.color : "var(--mc-text5)", fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.5px" }}>{t.label}</button>
        ))}
        <span style={{ color: "var(--mc-border3)", fontSize: "10px" }}>|</span>
        <span style={{ fontSize: "9px", color: "var(--mc-text5)", fontWeight: 600 }}>Agent:</span>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={{ padding: "4px 8px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "5px", color: "var(--mc-text)", fontSize: "9px", fontFamily: "inherit" }}>
          <option value="all">All</option>
          <option value="brayden">Brayden</option>
          {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={() => setSortPriority(!sortPriority)} style={{ padding: "4px 10px", background: sortPriority ? "#EF444418" : "var(--mc-card2)", border: `1px solid ${sortPriority ? "#EF444433" : "var(--mc-border3)"}`, borderRadius: "5px", color: sortPriority ? "#EF4444" : "var(--mc-text5)", fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          ⇅ PRIORITY
        </button>
      </div>
      <p style={{ fontSize: "9px", color: "var(--mc-text5)", margin: "0 0 10px" }}>Drag cards between columns · Inbox → Assigned → In Progress → Review → Done</p>
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
        {columns.map(col => {
          const colTasks = sortTasks(filteredTasks.filter(t => t.status === col.id));
          const isOver = dragOverCol === col.id;
          return (
            <div key={col.id} onDragOver={e => onDragOver(e, col.id)} onDrop={e => handleDrop(e, col.id)}
              style={{ flex: "1 1 220px", minWidth: "220px", background: isOver ? "var(--mc-card2)" : "var(--mc-card)", border: `1px solid ${isOver ? col.color + "55" : "#1E1E28"}`, borderRadius: "12px", padding: "12px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 4px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: col.color, letterSpacing: "1.5px" }}>{col.label}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text5)", background: "var(--mc-border)", padding: "2px 7px", borderRadius: "10px" }}>{colTasks.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minHeight: "80px" }}>
                {colTasks.map(task => {
                  const agent = task.assignee === "brayden" ? { name: "BRAYDEN", color: "#F59E0B", initials: "BS" } : getAgent(task.assignee);
                  const isDragging = dragId === task.id;
                  const isExp = expandedTask === task.id;
                  return (
                    <div key={task.id} draggable onDragStart={e => onDragStart(e, task.id)} onDragEnd={onDragEnd}
                      style={{ background: "var(--mc-card2)", border: `1px solid ${isExp ? agent.color + "44" : "var(--mc-border2)"}`, borderRadius: "8px", padding: "10px 12px", cursor: "grab", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.15s, border-color 0.15s", userSelect: "none" }}>
                      <div onClick={e => { e.stopPropagation(); setExpandedTask(isExp ? null : task.id); }} style={{ fontSize: "11px", color: "var(--mc-text)", lineHeight: 1.5, marginBottom: "6px", cursor: "pointer" }}>{task.title}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                          {task.assignee && <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: agent.color }}>{agent.initials}</div>}
                          <span style={{ fontSize: "7px", fontWeight: 700, color: typeColors[task.type] || "var(--mc-text3)", background: (typeColors[task.type] || "#71717A") + "18", padding: "2px 5px", borderRadius: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{typeLabels[task.type] || task.type}</span>
                          <span style={{ fontSize: "7px", fontWeight: 700, color: priorityColors[task.priority], background: priorityColors[task.priority] + "18", padding: "2px 5px", borderRadius: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{task.priority}</span>
                        </div>
                        <span style={{ fontSize: "8px", color: "var(--mc-text6)" }}>⠿</span>
                      </div>
                      {isExp && (
                        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px solid var(--mc-border3)` }}>
                          <textarea
                            value={task.notes}
                            onChange={e => updateTaskNotes(task.id, e.target.value)}
                            placeholder="Add notes..."
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            draggable={false}
                            rows={2}
                            style={{ width: "100%", padding: "6px 8px", background: "var(--mc-card)", border: "1px solid var(--mc-border3)", borderRadius: "4px", color: "var(--mc-text2)", fontSize: "9px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   CALENDAR
   ───────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════════
   CALENDAR — Monthly Scheduler
   ═══════════════════════════════════════════════════════════════════════════════
   🤖 OPENCLAW EVENT SCHEMA:
   {
     day: number,          // Day of month (1-31)
     month: number,        // Optional. 0=Jan, 1=Feb, ... 11=Dec. If omitted, shows on current month.
     year: number,         // Optional. Defaults to current view year.
     time: string,         // 24h format "HH:MM" (e.g., "09:00", "14:30")
     agent: string,        // Agent id who owns this event
     task: string,         // Event description
     recurring: boolean,   // true = shows every day, false = one-time only
   }
   
   📌 TO ADD EVENT: Push to scheduledTasks array.
   📌 RECURRING EVENTS: Set recurring:true — event appears on ALL days.
   📌 MONTH NAV: calMonth (0-11), calYear (number). Navigate with prevMonth()/nextMonth().
   ═══════════════════════════════════════════════════════════════════════════════ */
function CalendarView() {
  const [calMonth, setCalMonth] = useState(1); // 0=Jan, 1=Feb, ...
  const [calYear, setCalYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(28);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState("09:00");
  const [newAgent, setNewAgent] = useState("jarvis");
  const [newTask, setNewTask] = useState("");
  const [scheduledTasks, setScheduledTasks] = useState([
    { day: 27, time: "06:00", agent: "atlas", task: "Morning market scan & macro news digest", recurring: true },
    { day: 27, time: "07:00", agent: "jarvis", task: "Daily briefing → #headquarters", recurring: true },
    { day: 27, time: "09:00", agent: "atlas", task: "On-chain whale movement scan", recurring: true },
    { day: 27, time: "14:00", agent: "forge", task: "Build daily briefing automation", recurring: false },
    { day: 27, time: "20:00", agent: "sentinel", task: "System health check & agent status", recurring: true },
    { day: 27, time: "22:00", agent: "shield", task: "End-of-day risk report", recurring: true },
    { day: 28, time: "06:00", agent: "atlas", task: "Morning market scan & macro news digest", recurring: true },
    { day: 28, time: "07:00", agent: "jarvis", task: "Daily briefing → #headquarters", recurring: true },
    { day: 28, time: "09:00", agent: "forge", task: "Discord server bot integration setup", recurring: false },
    { day: 28, time: "11:00", agent: "scribe", task: "Write blog post draft — AI agent companies", recurring: false },
    { day: 28, time: "15:00", agent: "atlas", task: "Weekly deep research: top 20 AI tokens", recurring: false },
    { day: 28, time: "20:00", agent: "sentinel", task: "System health check", recurring: true },
    { day: 1, time: "08:00", agent: "jarvis", task: "Monthly operations review", recurring: false },
    { day: 1, time: "10:00", agent: "atlas", task: "Q1 2026 macro outlook report", recurring: false },
  ]);

  const addEvent = () => {
    if (!newTask.trim()) return;
    setScheduledTasks(prev => [...prev, { day: selectedDay, month: calMonth, year: calYear, time: newTime, agent: newAgent, task: newTask, recurring: false }]);
    setNewTask(""); setShowAdd(false);
  };

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const isCurrentMonth = calMonth === 1 && calYear === 2026;
  const today = isCurrentMonth ? 28 : -1;
  const dayTasks = scheduledTasks.filter(t => t.day === selectedDay && (!t.month || t.month === calMonth));

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelectedDay(1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelectedDay(1); };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <button onClick={prevMonth} style={{ padding: "4px 10px", background: "var(--mc-card2)", border: "1px solid var(--mc-border2)", borderRadius: "6px", color: "var(--mc-text3)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>◀</button>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--mc-text)" }}>{monthNames[calMonth]} {calYear}</div>
          <button onClick={nextMonth} style={{ padding: "4px 10px", background: "var(--mc-card2)", border: "1px solid var(--mc-border2)", borderRadius: "6px", color: "var(--mc-text3)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "4px" }}>
          {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: "8px", color: "var(--mc-text5)", fontWeight: 700, padding: "4px 0", letterSpacing: "1px" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
          {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={"e" + i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const hasTasks = scheduledTasks.some(t => t.day === day && (!t.month || t.month === calMonth));
            const isToday = day === today;
            const isSel = day === selectedDay;
            return (
              <button key={day} onClick={() => setSelectedDay(day)} style={{ padding: "6px 2px", textAlign: "center", fontSize: "11px", background: isSel ? "#F59E0B22" : isToday ? "var(--mc-border)" : "transparent", border: isSel ? "1px solid #F59E0B44" : "1px solid transparent", borderRadius: "6px", color: isSel ? "#F59E0B" : isToday ? "var(--mc-text)" : hasTasks ? "var(--mc-text2)" : "var(--mc-text5)", cursor: "pointer", fontFamily: "inherit", fontWeight: isToday ? 700 : 400 }}>
                {day}{hasTasks && <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#F59E0B", margin: "2px auto 0" }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--mc-text)" }}>
            {monthNames[calMonth].slice(0, 3)} {selectedDay}{selectedDay === today ? " · TODAY" : ""}<span style={{ fontSize: "10px", color: "var(--mc-text5)", marginLeft: "8px" }}>{dayTasks.length} tasks</span>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "5px 12px", background: showAdd ? "#EF444422" : "#F59E0B22", border: `1px solid ${showAdd ? "#EF444444" : "#F59E0B44"}`, borderRadius: "6px", color: showAdd ? "#EF4444" : "#F59E0B", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {showAdd ? "✕ Cancel" : "+ Add Event"}
          </button>
        </div>
        {showAdd && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap", padding: "10px", background: "var(--mc-card2)", borderRadius: "8px", border: "1px solid #F59E0B22" }}>
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ padding: "6px 8px", background: "var(--mc-card)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit" }} />
            <select value={newAgent} onChange={e => setNewAgent(e.target.value)} style={{ padding: "6px 8px", background: "var(--mc-card)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit" }}>
              {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addEvent()} placeholder="Event description..." style={{ flex: "1 1 150px", padding: "6px 10px", background: "var(--mc-card)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit", outline: "none" }} />
            <button onClick={addEvent} style={{ padding: "6px 12px", background: "#F59E0B22", border: "1px solid #F59E0B44", borderRadius: "6px", color: "#F59E0B", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
          </div>
        )}
        {dayTasks.length === 0 ? <p style={{ fontSize: "11px", color: "var(--mc-text5)", textAlign: "center", padding: "20px 0" }}>No scheduled tasks</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {dayTasks.sort((a, b) => a.time.localeCompare(b.time)).map((task, i) => {
              const agent = getAgent(task.agent);
              return (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 12px", background: "var(--mc-card2)", borderRadius: "8px", border: "1px solid var(--mc-border2)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--mc-text4)", minWidth: "42px", flexShrink: 0 }}>{task.time}</div>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: agent.color, flexShrink: 0 }}>{agent.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", color: "var(--mc-text)", lineHeight: 1.5 }}>{task.task}</div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <span style={{ fontSize: "8px", color: agent.color, fontWeight: 700 }}>{agent.name}</span>
                      {task.recurring && <span style={{ fontSize: "8px", color: "var(--mc-text4)", background: "var(--mc-border)", padding: "1px 5px", borderRadius: "3px" }}>RECURRING</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MEMORY
   ───────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════════
   MEMORY — Knowledge Base
   ═══════════════════════════════════════════════════════════════════════════════
   🤖 OPENCLAW MEMORY SCHEMA:
   {
     id: number,           // Unique ID. Use Date.now() for new memories.
     title: string,        // Memory title (searchable)
     category: string,     // One of: "strategy" | "operations" | "risk" | "content" | "personal"
     agent: string,        // Agent id who created/owns this memory
     date: string,         // ISO date "YYYY-MM-DD" when memory was CREATED
     updated: string,      // ISO date "YYYY-MM-DD" when memory was LAST UPDATED (optional)
     content: string,      // Full memory text (searchable)
     tags: string[],       // Array of lowercase tag strings (searchable)
   }
   
   📌 TO ADD MEMORY: Push new object with id: Date.now(), date: new Date().toISOString().slice(0,10)
   📌 TO UPDATE: Change `content` and set `updated` to today's date.
   📌 SEARCH: Searches title, content, and tags fields.
   📌 CATEGORIES: strategy (amber), operations (blue), risk (red), content (pink), personal (purple)
   ═══════════════════════════════════════════════════════════════════════════════ */
function MemoryView() {
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCat, setNewCat] = useState("operations");
  const [newTags, setNewTags] = useState("");
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        const res = await fetch('/workspace_memory.json');
        if (res.ok) {
          const payload = await res.json();
          if (Array.isArray(payload.memories) && payload.memories.length > 0) {
            setMemories(payload.memories);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load workspace_memory.json', e);
      }
      setMemories([
        { id: 1, title: 'Workspace Memory Not Synced', category: 'operations', agent: 'jarvis', date: new Date().toISOString().slice(0,10), updated: null, content: 'Run sync to generate workspace_memory.json from .openclaw/workspace files.', tags: ['sync','memory'] },
      ]);
    };
    loadMemories();
  }, []);

  const addMemory = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    setMemories(prev => [{ id: Date.now(), title: newTitle, category: newCat, agent: "brayden", date: today, content: newContent, tags: newTags.split(",").map(t => t.trim()).filter(Boolean) }, ...prev]);
    setNewTitle(""); setNewContent(""); setNewTags(""); setShowAdd(false);
  };
  const categories = [
    { id: "all", label: "All", color: "var(--mc-text)" }, { id: "strategy", label: "Strategy", color: "#F59E0B" },
    { id: "operations", label: "Operations", color: "#3B82F6" }, { id: "risk", label: "Risk", color: "#EF4444" },
    { id: "content", label: "Content", color: "#EC4899" }, { id: "personal", label: "Personal", color: "#A855F7" },
  ];
  const filtered = memories.filter(m => (selCat === "all" || m.category === selCat) && (!search || m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.includes(search.toLowerCase()))));

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--mc-text5)" }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." style={{ width: "100%", padding: "10px 14px 10px 32px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "8px", color: "var(--mc-text)", fontSize: "12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "10px 16px", background: showAdd ? "#EF444422" : "#F59E0B22", border: `1px solid ${showAdd ? "#EF444444" : "#F59E0B44"}`, borderRadius: "8px", color: showAdd ? "#EF4444" : "#F59E0B", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {showAdd ? "✕ Cancel" : "+ Add Memory"}
        </button>
      </div>
      {showAdd && (
        <div style={{ background: "var(--mc-card)", border: "1px solid #F59E0B33", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Memory title..." style={{ width: "100%", padding: "8px 12px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "11px", fontFamily: "inherit", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Content..." rows={3} style={{ width: "100%", padding: "8px 12px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "11px", fontFamily: "inherit", outline: "none", resize: "vertical", marginBottom: "8px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ padding: "6px 10px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit" }}>
              <option value="strategy">Strategy</option><option value="operations">Operations</option><option value="risk">Risk</option><option value="content">Content</option><option value="personal">Personal</option>
            </select>
            <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma separated)" style={{ flex: 1, padding: "6px 10px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "6px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit", outline: "none" }} />
            <button onClick={addMemory} style={{ padding: "6px 14px", background: "#F59E0B22", border: "1px solid #F59E0B44", borderRadius: "6px", color: "#F59E0B", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
        {categories.map(c => <button key={c.id} onClick={() => setSelCat(c.id)} style={{ padding: "6px 12px", background: selCat === c.id ? c.color + "18" : "transparent", border: selCat === c.id ? `1px solid ${c.color}33` : "1px solid var(--mc-border2)", borderRadius: "6px", color: selCat === c.id ? c.color : "#52525B", fontSize: "10px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.label}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(m => {
          const agent = getAgent(m.agent);
          const catColor = categories.find(c => c.id === m.category)?.color || "#71717A";
          return (
            <div key={m.id} style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px", borderLeft: `3px solid ${catColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mc-text)" }}>{m.title}</div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "8px", color: agent.color, fontWeight: 700 }}>{agent.name}</span>
                  <span style={{ fontSize: "7px", color: "var(--mc-text5)" }}>Created {m.date}</span>
                  {m.updated && <span style={{ fontSize: "7px", color: "#10B981", background: "#10B98115", padding: "1px 4px", borderRadius: "3px" }}>Updated {m.updated}</span>}
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "var(--mc-text2)", margin: "0 0 10px", lineHeight: 1.7 }}>{m.content}</p>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {m.tags.map(t => <span key={t} style={{ fontSize: "8px", color: "var(--mc-text4)", background: "var(--mc-border)", border: "1px solid var(--mc-border3)", borderRadius: "3px", padding: "2px 6px" }}>{t}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamView() {
  const allAgents = useAgents();
  const employees = allAgents.filter(a => a.type === "agent");
  const councilMembers = allAgents.filter(a => a.type === "council");
  const oracleMembers = allAgents.filter(a => a.type === "oracle");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const details = {
    jarvis: { desc: "Your AI CEO. Runs the company day-to-day, coordinates all agents.", model: "Kimi K2-P5 · ChatGPT 5.3 Codex", handles: ["Strategic planning", "Task orchestration", "Cross-agent comms", "Escalation filtering"] },
    atlas: { desc: "Researches any topic — crypto, AI, macro, competitors.", model: "Gemini 3.1 Pro · ChatGPT 5.2", handles: ["Market research & signals", "AI trends", "On-chain intel", "Due diligence"] },
    forge: { desc: "Builds everything. Bots, apps, automations, pipelines.", model: "ChatGPT 5.3 Codex · Kimi K2-P5", handles: ["Trading bot dev", "Web/app prototyping", "API integrations", "Automation scripts"] },
    scribe: { desc: "Writes everything. Threads, blogs, newsletters, pitches.", model: "Gemini 3 Flash · ChatGPT 5.2", handles: ["Twitter threads", "Blog articles", "Newsletters", "Pitch decks"] },
    pixel: { desc: "All visual work. Brand, graphics, presentations, UI.", model: "Gemini 3 Flash · ChatGPT 5.2", handles: ["Brand identity", "Social graphics", "AI image gen", "UI/UX mockups"] },
    trader: { desc: "Executes trades, manages portfolio, enforces risk.", model: "Kimi K2-P5 · ChatGPT 5.2", handles: ["Trade execution", "Position sizing", "Portfolio rebalancing", "Exchange management"] },
    shield: { desc: "Risk monitoring with OVERRIDE authority.", model: "ChatGPT 5.2 · Gemini 3 Flash", handles: ["Real-time risk", "Circuit breakers", "Kill-switch", "Compliance checks"] },
    echo: { desc: "Community management across Discord & Telegram.", model: "Gemini 3 Flash · ChatGPT 5.2", handles: ["Discord moderation", "Customer inquiries", "Onboarding", "Sentiment tracking"] },
    closer: { desc: "Outbound sales, partnerships, lead nurturing.", model: "ChatGPT 5.2 · Gemini 3 Flash", handles: ["Cold outreach", "Email campaigns", "Lead qualification", "Proposal drafting"] },
    sentinel: { desc: "IT — monitors agents, APIs, auto-restarts failures.", model: "Gemini 3 Flash · ChatGPT 5.2", handles: ["Agent health checks", "API monitoring", "Auto-restart", "Error tracking"] },
  };
  const statusColors = { online: "#10B981", standby: "#F59E0B", offline: "#EF4444" };

  const handleAddAgent = () => {
    if (!newName.trim() || !newRole.trim()) return;
    const id = newName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const initials = newName.slice(0, 2).toUpperCase();
    const colors = ["#3B82F6", "#F59E0B", "#EC4899", "#10B981", "#A855F7", "#F97316", "#06B6D4", "#EF4444"];
    addAgent({ id, name: newName.toUpperCase(), role: newRole, color: colors[employees.length % colors.length], initials, icon: "🤖", type: "agent" });
    setNewName(""); setNewRole(""); setShowAddForm(false);
  };

  const AgentCard = ({ a, d, showRemove = false }) => (
    <div style={{ background: "var(--mc-card)", border: `1px solid ${a.color}22`, borderRadius: "12px", padding: "14px 16px", opacity: a.status === "standby" ? 0.7 : 1, position: "relative" }}>
      <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColors[a.status || "online"] }} />
        {showRemove && <button onClick={(e) => { e.stopPropagation(); removeAgent(a.id); }} style={{ background: "#EF444422", border: "1px solid #EF444444", borderRadius: "4px", color: "#EF4444", fontSize: "8px", padding: "2px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✕</button>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: a.color }}>{a.initials}</div>
        <div><div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mc-text)" }}>{a.name}</div><div style={{ fontSize: "10px", color: "var(--mc-text3)" }}>{a.role}{a.status === "standby" ? " · Phase 2" : ""}</div></div>
      </div>
      {/* Always show details — no more empty bottoms */}
      {d && (
        <div style={{ paddingTop: "8px", borderTop: "1px solid var(--mc-border2)" }}>
          <p style={{ fontSize: "10px", color: "var(--mc-text2)", margin: "0 0 6px", lineHeight: 1.5, fontStyle: "italic" }}>{d.desc || a.desc}</p>
          {d.handles && d.handles.map((h, i) => <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}><span style={{ color: a.color, fontSize: "6px", marginTop: "3px" }}>●</span><span style={{ fontSize: "9px", color: "var(--mc-text3)" }}>{h}</span></div>)}
          {d.model && <div style={{ marginTop: "6px" }}><span style={{ fontSize: "8px", color: "var(--mc-text4)", background: "var(--mc-border)", padding: "3px 8px", borderRadius: "4px" }}>{d.model}</span></div>}
        </div>
      )}
      {!d && a.desc && (
        <div style={{ paddingTop: "8px", borderTop: "1px solid var(--mc-border2)" }}>
          <p style={{ fontSize: "10px", color: "var(--mc-text2)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{a.desc}</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Chairman header */}
      <div style={{ background: "linear-gradient(135deg, #1A1508, #12100A)", border: "1px solid #F59E0B44", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "8px", fontWeight: 700, color: "#F59E0B", letterSpacing: "2px", marginBottom: "6px" }}>HUMAN · CHAIRMAN</div>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#F5F5F5" }}>Brayden Siew</div>
      </div>

      {/* ── EMPLOYEES ({employees.length}) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px" }}>👥 EMPLOYEES · {employees.length}</div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: "#10B98122", border: "1px solid #10B98144", borderRadius: "6px", color: "#10B981", fontSize: "9px", padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>➕ {showAddForm ? "Cancel" : "Hire Agent"}</button>
      </div>

      {/* Add agent form */}
      {showAddForm && (
        <div style={{ background: "var(--mc-card)", border: "1px solid #10B98133", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Agent name" style={{ flex: 1, background: "var(--mc-input)", border: "1px solid var(--mc-border2)", borderRadius: "6px", padding: "6px 10px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit" }} />
          <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role" style={{ flex: 1, background: "var(--mc-input)", border: "1px solid var(--mc-border2)", borderRadius: "6px", padding: "6px 10px", color: "var(--mc-text)", fontSize: "10px", fontFamily: "inherit" }} />
          <button onClick={handleAddAgent} style={{ background: "#10B981", border: "none", borderRadius: "6px", color: "#FFF", fontSize: "10px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Add</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px", marginBottom: "20px" }}>
        {employees.map(a => <AgentCard key={a.id} a={a} d={details[a.id]} showRemove={true} />)}
      </div>

      {/* ── COUNCIL ADVISORY ── */}
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#A78BFA", letterSpacing: "1.5px", marginBottom: "8px" }}>🏛 COUNCIL ADVISORY · {councilMembers.length}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px", marginBottom: "20px" }}>
        {councilMembers.map(a => <AgentCard key={a.id} a={a} d={null} />)}
      </div>

      {/* ── ORACLE CONSULTANT ── */}
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#A855F7", letterSpacing: "1.5px", marginBottom: "8px" }}>🔮 ORACLE CONSULTANT · {oracleMembers.length}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
        {oracleMembers.map(a => <AgentCard key={a.id} a={a} d={null} />)}
      </div>
    </div>
  );
}


/* ─────────────────────────────────────
   ORG HIERARCHY (department-grouped)
   ───────────────────────────────────── */
function OrgHierarchy() {
  const [exp, setExp] = useState(null);
  const [agentPositions, setAgentPositions] = useState({});

  // SYNC HEARTBEAT: Fetch live status from Office (agent_positions.json) every 5s
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('/agent_positions.json');
        if (response.ok) {
          const data = await response.json();
          setAgentPositions(data.agents || {});
        }
      } catch (e) {}
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAgentStatus = (agentName) => {
    const pos = agentPositions[agentName.toUpperCase()];
    return pos?.desk ? "online" : "standby";
  };

  const modelRegistry = {
    "ATLAS": { p: "Gemini 3.1 Pro", f: "ChatGPT 5.2" },
    "FORGE": { p: "ChatGPT 5.3 Codex", f: "Kimi K2-P5" },
    "SENTINEL": { p: "Gemini 3 Flash", f: "ChatGPT 5.2" },
    "SCRIBE": { p: "Gemini 3 Flash", f: "ChatGPT 5.2" },
    "PIXEL": { p: "Gemini 3 Flash", f: "ChatGPT 5.2" },
    "TRADER": { p: "Kimi K2-P5", f: "ChatGPT 5.2" },
    "SHIELD": { p: "ChatGPT 5.2", f: "Gemini 3 Flash" },
    "ECHO": { p: "Gemini 3 Flash", f: "ChatGPT 5.2" },
    "CLOSER": { p: "ChatGPT 5.2", f: "Gemini 3 Flash" },
    "JARVIS": { p: "Kimi K2-P5", f: "ChatGPT 5.3 Codex" }
  };

  const council = [
    { name: "RISK", color: "#EF4444", role: "Finds what could go wrong. Worst-case scenarios, hidden downsides." },
    { name: "GROWTH", color: "#10B981", role: "Finds the upside. Timing, positioning, market opportunity." },
    { name: "DEVIL'S ADVOCATE", color: "#F59E0B", role: "Pokes holes in BOTH arguments. Challenges assumptions." },
  ];

  const departments = [
    {
      name: "INTELLIGENCE", icon: "🔍", color: "#F59E0B",
      agents: [
        { name: "ATLAS", initials: "AT", color: "#F59E0B", title: "Senior Research Analyst", tags: ["DEEP RESEARCH", "ON-CHAIN INTEL"], status: "online", desc: "Your eyes and ears. Researches any topic — crypto, AI, macro, competitors.", handles: ["Market research & signal generation", "AI industry trend tracking", "On-chain intelligence (whale movements)", "Macro news monitoring"], primaryModel: "Gemini 3.1 Pro", fallbackModel: "ChatGPT 5.2" },
      ]
    },
    {
      name: "DEVELOPMENT", icon: "🔧", color: "#60A5FA",
      agents: [
        { name: "FORGE", initials: "FO", color: "#60A5FA", title: "Senior Developer", tags: ["FULL-STACK DEV", "AUTOMATION"], status: "online", desc: "Your builder. Writes code, builds tools, creates automations, debugs scripts.", handles: ["Trading bot development", "API integrations & data pipelines", "Web/app prototyping", "Automation scripts"], primaryModel: "ChatGPT 5.3 Codex", fallbackModel: "Kimi K2-P5" },
        { name: "SENTINEL", initials: "SE", color: "#64748B", title: "QA Monitor", tags: ["SYSTEM MONITORING", "HEALTH CHECKS"], status: "online", desc: "Your IT department. Monitors all agents, checks uptime, auto-restarts failures.", handles: ["Agent health checks every 15 min", "API connection monitoring", "Auto-restart failed agents", "Error tracking & logging"], primaryModel: "Gemini 3 Flash", fallbackModel: "ChatGPT 5.2" },
      ]
    },
    {
      name: "CONTENT", icon: "✍️", color: "#EC4899",
      agents: [
        { name: "SCRIBE", initials: "SC", color: "#EC4899", title: "Content Director", tags: ["CONTENT CREATION", "COPYWRITING"], status: "online", desc: "Your voice. Writes threads, blogs, newsletters, ad copy, pitch decks.", handles: ["Twitter/X threads & posts", "Blog articles & long-form", "Newsletter writing", "Pitch decks & investor materials"], primaryModel: "Gemini 3 Flash", fallbackModel: "ChatGPT 5.2" },
        { name: "PIXEL", initials: "PX", color: "#A855F7", title: "Lead Designer", tags: ["DESIGN CONCEPTS", "IMAGE GEN"], status: "online", desc: "Your creative eye. All visual work — brand, graphics, image gen, UI/UX.", handles: ["Brand identity & logos", "Social media graphics", "AI image generation", "UI/UX wireframes & mockups"], primaryModel: "Gemini 3 Flash", fallbackModel: "ChatGPT 5.2" },
      ]
    },
    {
      name: "TRADING", icon: "📈", color: "#10B981",
      agents: [
        { name: "TRADER", initials: "TR", color: "#10B981", title: "Head Trader", tags: ["TRADE EXECUTION", "PORTFOLIO MGMT"], status: "standby", desc: "Your money maker. Executes trades, manages portfolio, enforces risk rules.", handles: ["Trade execution (spot, later futures)", "Position sizing & entry/exit", "Portfolio rebalancing", "P&L tracking & daily reports"], primaryModel: "Kimi K2-P5", fallbackModel: "ChatGPT 5.2" },
        { name: "SHIELD", initials: "SH", color: "#EF4444", title: "Risk Officer", tags: ["CIRCUIT BREAKERS", "KILL-SWITCH"], status: "online", desc: "Your safety net. Has OVERRIDE authority to halt any operation that breaches risk.", handles: ["Real-time risk monitoring", "Circuit breaker enforcement", "Kill-switch on all trading", "Daily risk reports to Chairman"], primaryModel: "ChatGPT 5.2", fallbackModel: "Gemini 3 Flash" },
      ]
    },
    {
      name: "OUTREACH", icon: "📧", color: "#F97316",
      agents: [
        { name: "ECHO", initials: "EC", color: "#06B6D4", title: "Community Manager", tags: ["DISCORD MOD", "SENTIMENT"], status: "standby", desc: "Your front desk. Manages Discord, Telegram, customer inquiries.", handles: ["Discord & Telegram moderation", "Customer inquiry responses", "Community sentiment tracking", "New member onboarding"], primaryModel: "Gemini 3 Flash", fallbackModel: "ChatGPT 5.2" },
        { name: "CLOSER", initials: "CL", color: "#F97316", title: "Account Executive", tags: ["COLD OUTREACH", "LEAD NURTURE"], status: "standby", desc: "Your dealmaker. Outbound outreach, partnerships, lead nurturing.", handles: ["Cold outreach & introductions", "Email sequences & nurture", "Partnership inquiries", "Proposal & pitch drafting"], primaryModel: "ChatGPT 5.2", fallbackModel: "Gemini 3 Flash" },
      ]
    },
  ];

  const SDot = ({ s }) => (
    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s === "online" ? "#10B981" : "#EF4444", boxShadow: s === "online" ? "0 0 6px #10B98166" : "none", position: "absolute", top: "12px", right: "12px" }} />
  );

  const VLine = ({ h = 24 }) => <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: "1px", height: h, background: "var(--mc-border3)" }} /></div>;

  const AgentCard = ({ agent }) => {
    const isExp = exp === agent.name;
    // SYNC: Get live status from Office
    const liveStatus = getAgentStatus(agent.name);
    return (
      <div onClick={() => setExp(isExp ? null : agent.name)} style={{ background: isExp ? "var(--mc-bg4)" : "var(--mc-card2)", border: `1px solid ${isExp ? agent.color + "44" : "#1E1E28"}`, borderRadius: "12px", padding: "14px 16px", position: "relative", cursor: "pointer", transition: "all 0.15s" }}>
        <SDot s={liveStatus} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: agent.color, flexShrink: 0 }}>{agent.initials}</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mc-text)" }}>{agent.name}</div>
            <div style={{ fontSize: "10px", color: "var(--mc-text3)" }}>{agent.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {agent.tags.map(t => <span key={t} style={{ fontSize: "8px", fontWeight: 600, color: agent.color, background: agent.color + "15", border: `1px solid ${agent.color}25`, borderRadius: "4px", padding: "3px 8px", letterSpacing: "0.5px" }}>{t}</span>)}
        </div>
        {isExp && agent.desc && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${agent.color}22` }}>
            <p style={{ fontSize: "10px", color: "var(--mc-text2)", margin: "0 0 10px", lineHeight: 1.6, fontStyle: "italic" }}>{agent.desc}</p>
            {agent.handles && agent.handles.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                <span style={{ color: agent.color, fontSize: "6px", marginTop: "5px" }}>●</span>
                <span style={{ fontSize: "9px", color: "var(--mc-text3)", lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
            {agent.primaryModel && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "8px", color: "var(--mc-text4)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "2px 6px", borderRadius: "4px" }}>PRIMARY: {agent.primaryModel}</span>
                  <span style={{ fontSize: "8px", color: "var(--mc-text4)", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "2px 6px", borderRadius: "4px" }}>FALLBACK: {agent.fallbackModel}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* ── CHAIRMAN ── */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #1A1508, #12100A)", border: "1px solid #F59E0B33", borderRadius: "14px", padding: "20px 48px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#F5F5F5" }}>Brayden Siew</div>
          <div style={{ fontSize: "11px", color: "#F59E0B", marginTop: "4px", fontWeight: 600 }}>Chairman</div>
        </div>
      </div>
      <VLine h={32} />

      {/* ── COO + COUNCIL ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* JARVIS */}
        <div onClick={() => setExp(exp === "jarvis" ? null : "jarvis")} style={{ background: exp === "jarvis" ? "var(--mc-bg4)" : "var(--mc-card2)", border: `1px solid ${exp === "jarvis" ? "#3B82F644" : "#1E1E28"}`, borderRadius: "12px", padding: "14px 18px", position: "relative", width: "280px", cursor: "pointer", transition: "all 0.15s" }}>
          <SDot s="online" />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#3B82F622", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#3B82F6" }}>JV</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--mc-text)" }}>JARVIS</div>
              <div style={{ fontSize: "10px", color: "var(--mc-text3)" }}>Chief Executive Officer</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {["STRATEGIC PLANNING", "TASK ORCHESTRATION"].map(t => <span key={t} style={{ fontSize: "8px", fontWeight: 600, color: "#3B82F6", background: "#3B82F615", border: "1px solid #3B82F625", borderRadius: "4px", padding: "3px 8px", letterSpacing: "0.5px" }}>{t}</span>)}
          </div>
          {exp === "jarvis" && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #3B82F622" }}>
              <p style={{ fontSize: "10px", color: "var(--mc-text2)", margin: "0 0 10px", lineHeight: 1.6, fontStyle: "italic" }}>Your AI CEO. Runs the company day-to-day, coordinates all agents, filters what needs your attention.</p>
              {["Strategic planning & execution", "Task orchestration across all agents", "Cross-agent communication", "Escalation filtering to Chairman", "Daily briefing compilation", "Priority management"].map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                  <span style={{ color: "#3B82F6", fontSize: "6px", marginTop: "5px" }}>●</span>
                  <span style={{ fontSize: "9px", color: "var(--mc-text3)", lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "8px", color: "var(--mc-text4)", background: "var(--mc-border)", padding: "3px 8px", borderRadius: "4px" }}>PRIMARY: Kimi K2-P5 | FALLBACK: ChatGPT 5.3 Codex</span>
              </div>
            </div>
          )}
        </div>
        {/* COUNCIL */}
        <div onClick={() => setExp(exp === "council" ? null : "council")} style={{ background: "linear-gradient(135deg, #14101A, #0E0C14)", border: "1px solid #8B5CF633", borderRadius: "14px", padding: "14px 20px", width: "280px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "14px" }}>🏛</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#A78BFA", letterSpacing: "1.5px" }}>COUNCIL (ADVISORY)</span>
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
            {council.map(m => <span key={m.name} style={{ fontSize: "9px", fontWeight: 700, color: m.color, background: m.color + "18", border: `1px solid ${m.color}33`, padding: "4px 10px", borderRadius: "6px" }}>{m.name}</span>)}
          </div>
          <div style={{ fontSize: "9px", color: "var(--mc-text4)" }}>Weekly Strategy Review · Opus 4.6</div>
          {exp === "council" && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--mc-border3)" }}>
              {council.map(a => (
                <div key={a.name} style={{ padding: "8px 10px", background: a.color + "08", border: `1px solid ${a.color}22`, borderRadius: "8px", marginBottom: "5px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: a.color, marginBottom: "3px" }}>{a.name}</div>
                  <p style={{ fontSize: "9px", color: "var(--mc-text2)", margin: 0, lineHeight: 1.5 }}>{a.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <VLine h={24} />

      {/* ── ORACLE ── */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div onClick={() => setExp(exp === "oracle" ? null : "oracle")} style={{ background: "linear-gradient(135deg, #130F1A, #0D0B12)", border: "1px solid #A855F733", borderRadius: "12px", padding: "14px 28px", textAlign: "center", cursor: "pointer", maxWidth: "380px", width: "100%" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#A855F7", letterSpacing: "1px" }}>🔮 ORACLE · CONSULTANT</div>
          <div style={{ marginTop: "6px" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#A855F7", background: "#A855F720", padding: "3px 10px", borderRadius: "4px" }}>ORACLE</span>
          </div>
          <div style={{ fontSize: "9px", color: "var(--mc-text4)", marginTop: "6px" }}>On-Demand · McKinsey-Level Strategy · Opus 4.6</div>
          {exp === "oracle" && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--mc-border3)", textAlign: "left" }}>
              <p style={{ fontSize: "10px", color: "var(--mc-text2)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>Strategic consultant for high-stakes decisions. Called on-demand when stakes are high — major pivots, allocations over 20%, when Council can't agree.</p>
            </div>
          )}
        </div>
      </div>
      <VLine h={24} />

      {/* ── BRANCH LINES — TOP ROW ── */}
      <div style={{ position: "relative", margin: "0 20px" }}>
        <div style={{ height: "1px", background: "var(--mc-border3)" }} />
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {departments.slice(0, 3).map((_, i) => <div key={i} style={{ width: "1px", height: "16px", background: "var(--mc-border3)" }} />)}
        </div>
      </div>

      {/* ── DEPARTMENTS — TOP ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {departments.slice(0, 3).map(dept => (
          <div key={dept.name} style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "14px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px" }}>{dept.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: dept.color, letterSpacing: "1.5px" }}>{dept.name}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dept.agents.map(a => <AgentCard key={a.name} agent={a} />)}
            </div>
          </div>
        ))}
      </div>

      {/* ── BRANCH LINES — BOTTOM ROW ── */}
      <div style={{ position: "relative", margin: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {departments.slice(3).map((_, i) => <div key={i} style={{ width: "1px", height: "16px", background: "var(--mc-border3)" }} />)}
        </div>
        <div style={{ height: "1px", background: "var(--mc-border3)" }} />
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {departments.slice(3).map((_, i) => <div key={i} style={{ width: "1px", height: "16px", background: "var(--mc-border3)" }} />)}
        </div>
      </div>

      {/* ── DEPARTMENTS — BOTTOM ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
        {departments.slice(3).map(dept => (
          <div key={dept.name} style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "14px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px" }}>{dept.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: dept.color, letterSpacing: "1.5px" }}>{dept.name}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dept.agents.map(a => <AgentCard key={a.name} agent={a} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap", padding: "10px 14px", background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "var(--mc-text5)", letterSpacing: "1px", fontWeight: 700 }}>STATUS:</span>
        {[{ l: "Online", c: "#10B981" }, { l: "Standby", c: "#EF4444" }].map(s => (
          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.c }} />
            <span style={{ fontSize: "10px", color: "var(--mc-text3)" }}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   PIXEL ART HELPERS
   ───────────────────────────────────── */
const PX = 2; // global pixel scale

// Pixel block helper
const B = ({ x, y, w, h, c, r, style: s }) => (
  <div style={{ position: "absolute", left: x * PX, top: y * PX, width: w * PX, height: h * PX, background: c, borderRadius: r ? r + "px" : undefined, ...s }} />
);

// Pixel art plant/tree
function PixelPlant({ x, y, size = "medium" }) {
  const s = size === "large" ? 1.5 : size === "small" ? 0.7 : 1;
  const base = Math.round;
  return (
    <div style={{ position: "absolute", left: x * PX, top: y * PX }}>
      {/* Pot */}
      <B x={base(4 * s)} y={base(18 * s)} w={base(8 * s)} h={base(6 * s)} c="#8B5E34" />
      <B x={base(3 * s)} y={base(17 * s)} w={base(10 * s)} h={base(2 * s)} c="#A0724B" />
      {/* Soil */}
      <B x={base(5 * s)} y={base(16 * s)} w={base(6 * s)} h={base(2 * s)} c="#3D2914" />
      {/* Leaves */}
      <B x={base(4 * s)} y={base(6 * s)} w={base(8 * s)} h={base(10 * s)} c="#2D6B3F" r={3} />
      <B x={base(2 * s)} y={base(8 * s)} w={base(4 * s)} h={base(6 * s)} c="#3A8A52" r={2} />
      <B x={base(10 * s)} y={base(8 * s)} w={base(4 * s)} h={base(6 * s)} c="#3A8A52" r={2} />
      <B x={base(6 * s)} y={base(3 * s)} w={base(4 * s)} h={base(5 * s)} c="#4CAF66" r={2} />
    </div>
  );
}

// Unique pixel art characters per agent
function AgentSprite({ agentName, isWorking, animFrame }) {
  const s = PX;
  const armOff = isWorking ? 0 : (animFrame % 2);
  const legOff = isWorking ? 0 : animFrame % 2;

  // JARVIS — suit & tie, slicked hair, CEO energy
  if (agentName === "JARVIS") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Slicked hair */}
        <B x={2} y={0} w={8} h={3} c="#1E293B" />
        <B x={1} y={1} w={1} h={2} c="#1E293B" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={5} y={6} w={2} h={1} c="#E8A060" />
        {/* Suit jacket */}
        <B x={1} y={7} w={10} h={6} c="#1E293B" />
        {/* Tie */}
        <B x={5} y={7} w={2} h={5} c="#3B82F6" />
        <B x={4} y={7} w={4} h={1} c="#E4E4E7" />
        {/* White shirt collar */}
        <B x={3} y={7} w={1} h={2} c="#E4E4E7" /><B x={8} y={7} w={1} h={2} c="#E4E4E7" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#1E293B" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#1E293B" />
        {isWorking && <><B x={0} y={12} w={1} h={1} c="#FDBF7C" /><B x={11} y={12} w={1} h={1} c="#FDBF7C" /></>}
        {/* Pants */}
        <B x={2} y={13} w={8} h={5} c="#0F172A" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#0F172A" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#0F172A" />
        {/* Shoes */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#1a1a2e" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#1a1a2e" />
      </div>
    );
  }

  // ATLAS — explorer hat, goggles on forehead, vest. Globe/compass energy
  if (agentName === "ATLAS") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Explorer hat */}
        <B x={0} y={0} w={12} h={2} c="#8B6914" />
        <B x={2} y={-1} w={8} h={2} c="#A0824B" />
        <B x={3} y={-2} w={6} h={2} c="#8B6914" />
        {/* Goggles */}
        <B x={2} y={2} w={3} h={2} c="#87CEEB" r={1} /><B x={7} y={2} w={3} h={2} c="#87CEEB" r={1} />
        <B x={5} y={2} w={2} h={1} c="#4A4A5A" />
        {/* Face */}
        <B x={2} y={4} w={8} h={3} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        {/* Vest over shirt */}
        <B x={1} y={7} w={10} h={6} c="#D4A94B" />
        <B x={3} y={7} w={6} h={6} c="#F5E6C8" />
        <B x={5} y={8} w={2} h={3} c="#D4A94B" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#D4A94B" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#D4A94B" />
        {/* Pants — cargo style */}
        <B x={2} y={13} w={8} h={5} c="#5C6B3A" />
        <B x={4} y={15} w={2} h={2} c="#4A5A2E" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#5C6B3A" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#5C6B3A" />
        {/* Boots */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#5C3D1E" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#5C3D1E" />
      </div>
    );
  }

  // FORGE — hoodie with hood up, headphones, coffee cup. Classic dev
  if (agentName === "FORGE") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Hood */}
        <B x={1} y={0} w={10} h={5} c="#1E3A5F" r={2} />
        <B x={0} y={2} w={2} h={4} c="#1E3A5F" r={1} />
        <B x={10} y={2} w={2} h={4} c="#1E3A5F" r={1} />
        {/* Headphones band */}
        <B x={2} y={-1} w={8} h={1} c="#4A4A5A" />
        {/* Headphone cups */}
        <B x={0} y={2} w={2} h={3} c="#EF4444" r={1} />
        <B x={10} y={2} w={2} h={3} c="#EF4444" r={1} />
        {/* Face (in hood shadow) */}
        <B x={3} y={3} w={6} h={4} c="#E8A862" />
        <B x={4} y={4} w={1} h={1} c="#1a1a2e" /><B x={7} y={4} w={1} h={1} c="#1a1a2e" />
        <B x={5} y={6} w={2} h={1} c="#D49050" />
        {/* Hoodie body */}
        <B x={1} y={7} w={10} h={6} c="#1E3A5F" />
        {/* Hoodie strings */}
        <B x={4} y={7} w={1} h={3} c="#87CEEB" /><B x={7} y={7} w={1} h={3} c="#87CEEB" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#1E3A5F" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#1E3A5F" />
        {isWorking && <><B x={0} y={12} w={1} h={1} c="#E8A862" /><B x={11} y={12} w={1} h={1} c="#E8A862" /></>}
        {/* Jeans */}
        <B x={2} y={13} w={8} h={5} c="#2A3A5C" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#2A3A5C" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#2A3A5C" />
        {/* Sneakers */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#E4E4E7" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#E4E4E7" />
      </div>
    );
  }

  // SCRIBE — beret, glasses, scarf, writer vibes
  if (agentName === "SCRIBE") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Beret */}
        <B x={1} y={-1} w={10} h={3} c="#EC4899" r={2} />
        <B x={0} y={0} w={12} h={1} c="#BE185D" />
        <B x={9} y={-2} w={2} h={2} c="#EC4899" r={1} />
        {/* Hair peeking out */}
        <B x={1} y={1} w={2} h={2} c="#6B2142" /><B x={9} y={1} w={2} h={2} c="#6B2142" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        {/* Glasses */}
        <B x={2} y={4} w={3} h={2} c="transparent" style={{ border: `${s}px solid #4A4A5A`, boxSizing: "border-box" }} />
        <B x={7} y={4} w={3} h={2} c="transparent" style={{ border: `${s}px solid #4A4A5A`, boxSizing: "border-box" }} />
        <B x={5} y={4} w={2} h={1} c="#4A4A5A" />
        {/* Scarf */}
        <B x={2} y={7} w={8} h={2} c="#F97316" />
        <B x={8} y={9} w={2} h={3} c="#F97316" />
        {/* Sweater */}
        <B x={1} y={9} w={10} h={4} c="#7C3AED" />
        {/* Arms */}
        <B x={0} y={9 + armOff} w={1} h={4} c="#7C3AED" />
        <B x={11} y={9 + (1 - armOff)} w={1} h={4} c="#7C3AED" />
        {/* Pants */}
        <B x={2} y={13} w={8} h={5} c="#1E1E28" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#1E1E28" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#1E1E28" />
        <B x={1} y={20 + legOff} w={4} h={1} c="#4A1D2E" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#4A1D2E" />
      </div>
    );
  }

  // PIXEL — wild spiked rainbow hair, paint splatter on clothes, artist
  if (agentName === "PIXEL") {
    return (
      <div style={{ width: 14 * s, height: 22 * s, position: "relative" }}>
        {/* Wild spiked hair */}
        <B x={2} y={-3} w={3} h={4} c="#A855F7" />
        <B x={5} y={-4} w={3} h={5} c="#EC4899" />
        <B x={8} y={-2} w={3} h={3} c="#3B82F6" />
        <B x={1} y={-1} w={2} h={3} c="#F59E0B" />
        <B x={10} y={-1} w={2} h={2} c="#10B981" />
        <B x={2} y={0} w={10} h={3} c="#A855F7" />
        {/* Face */}
        <B x={3} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={4} y={4} w={2} h={1} c="#1a1a2e" /><B x={8} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={6} y={5} w={2} h={1} c="#EC4899" style={{ opacity: 0.5 }} />
        {/* Smock / art shirt */}
        <B x={2} y={7} w={10} h={6} c="#1a1a2e" />
        {/* Paint splatters on shirt */}
        <B x={3} y={8} w={2} h={2} c="#EF4444" r={1} />
        <B x={7} y={9} w={2} h={2} c="#3B82F6" r={1} />
        <B x={5} y={10} w={2} h={1} c="#F59E0B" />
        <B x={9} y={8} w={2} h={1} c="#10B981" />
        {/* Arms */}
        <B x={1} y={8 + armOff} w={1} h={4} c="#1a1a2e" />
        <B x={12} y={8 + (1 - armOff)} w={1} h={4} c="#1a1a2e" />
        {/* Paint on hand */}
        {!isWorking && <B x={12} y={12} w={1} h={1} c="#EC4899" />}
        {/* Ripped jeans */}
        <B x={3} y={13} w={8} h={5} c="#2D2D3A" />
        <B x={5} y={15} w={2} h={1} c="#FDBF7C" />
        <B x={3} y={18} w={3} h={2 + legOff} c="#2D2D3A" />
        <B x={8} y={18} w={3} h={2 + (1 - legOff)} c="#2D2D3A" />
        <B x={2} y={20 + legOff} w={4} h={1} c="#A855F7" />
        <B x={8} y={20 + (1 - legOff)} w={4} h={1} c="#EC4899" />
      </div>
    );
  }

  // SHIELD — armored look, helmet visor, shield emblem on chest. The guardian.
  if (agentName === "SHIELD") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Helmet */}
        <B x={1} y={-1} w={10} h={4} c="#4A4A5A" r={2} />
        <B x={2} y={0} w={8} h={3} c="#5A5A6A" />
        {/* Visor (red glow) */}
        <B x={2} y={2} w={8} h={2} c="#EF4444" r={1} style={{ opacity: 0.8 }} />
        <B x={3} y={2} w={6} h={1} c="#FF6B6B" style={{ opacity: 0.6 }} />
        {/* Face behind visor */}
        <B x={3} y={4} w={6} h={3} c="#FDBF7C" />
        {/* Armor torso */}
        <B x={1} y={7} w={10} h={6} c="#4A4A5A" />
        <B x={2} y={7} w={8} h={6} c="#5A5A6A" />
        {/* Shield emblem on chest */}
        <B x={4} y={8} w={4} h={4} c="#EF4444" />
        <B x={5} y={9} w={2} h={2} c="#FF8888" />
        {/* Shoulder pads */}
        <B x={0} y={7} w={2} h={3} c="#5A5A6A" r={1} />
        <B x={10} y={7} w={2} h={3} c="#5A5A6A" r={1} />
        {/* Arms */}
        <B x={0} y={10 + armOff} w={1} h={3} c="#4A4A5A" />
        <B x={11} y={10 + (1 - armOff)} w={1} h={3} c="#4A4A5A" />
        {/* Armored pants */}
        <B x={2} y={13} w={8} h={5} c="#3A3A4A" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#3A3A4A" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#3A3A4A" />
        {/* Heavy boots */}
        <B x={1} y={20 + legOff} w={4} h={2} c="#2D2D3A" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={2} c="#2D2D3A" />
      </div>
    );
  }

  // SENTINEL — robot/cyborg. Antenna, glowing eye, metal body
  if (agentName === "SENTINEL") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Antenna */}
        <B x={5} y={-4} w={2} h={3} c="#4A4A5A" />
        <B x={4} y={-5} w={4} h={2} c="#64748B" r={2} />
        {/* Blinking light on antenna */}
        <B x={5} y={-5} w={2} h={1} c={animFrame % 2 ? "#10B981" : "#064E3B"} r={1} />
        {/* Head — metallic */}
        <B x={2} y={0} w={8} h={7} c="#4A5568" r={1} />
        <B x={3} y={1} w={6} h={5} c="#64748B" />
        {/* Eyes — one red, one green (cyborg) */}
        <B x={3} y={3} w={2} h={2} c="#EF4444" r={1} />
        <B x={7} y={3} w={2} h={2} c="#10B981" r={1} />
        {/* Mouth — LED grid */}
        <B x={4} y={5} w={1} h={1} c="#3B82F6" style={{ opacity: 0.5 }} />
        <B x={5} y={5} w={1} h={1} c="#3B82F6" />
        <B x={6} y={5} w={1} h={1} c="#3B82F6" style={{ opacity: 0.5 }} />
        <B x={7} y={5} w={1} h={1} c="#3B82F6" />
        {/* Metal torso */}
        <B x={1} y={7} w={10} h={6} c="#475569" />
        <B x={3} y={8} w={6} h={4} c="#64748B" />
        {/* Chest display */}
        <B x={4} y={9} w={4} h={2} c="#0A1628" r={1} />
        <B x={5} y={9} w={2} h={1} c="#3B82F6" style={{ opacity: animFrame % 3 ? 0.8 : 0.3 }} />
        {/* Arms — pistons */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#4A5568" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#4A5568" />
        <B x={0} y={9 + armOff} w={1} h={1} c="#64748B" />
        <B x={11} y={9 + (1 - armOff)} w={1} h={1} c="#64748B" />
        {/* Legs — mechanical */}
        <B x={2} y={13} w={3} h={5} c="#475569" />
        <B x={7} y={13} w={3} h={5} c="#475569" />
        <B x={3} y={15} w={1} h={1} c="#64748B" />
        <B x={8} y={15} w={1} h={1} c="#64748B" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#475569" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#475569" />
        {/* Metal boots */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#374151" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#374151" />
      </div>
    );
  }

  // TRADER — green vest, sharp shirt, stock chart tie, trader energy
  if (agentName === "TRADER") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Slicked back hair */}
        <B x={2} y={0} w={8} h={3} c="#1a1a2e" />
        <B x={1} y={1} w={1} h={2} c="#1a1a2e" />
        <B x={10} y={1} w={1} h={1} c="#1a1a2e" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={5} y={6} w={2} h={1} c="#E8A060" />
        {/* Green vest over white shirt */}
        <B x={1} y={7} w={10} h={6} c="#065F46" />
        <B x={3} y={7} w={6} h={6} c="#E4E4E7" />
        {/* Chart-line tie (green) */}
        <B x={5} y={7} w={2} h={5} c="#10B981" />
        <B x={5} y={8} w={1} h={1} c="#065F46" />
        <B x={6} y={10} w={1} h={1} c="#065F46" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#065F46" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#065F46" />
        {isWorking && <><B x={0} y={12} w={1} h={1} c="#FDBF7C" /><B x={11} y={12} w={1} h={1} c="#FDBF7C" /></>}
        {/* Dark slacks */}
        <B x={2} y={13} w={8} h={5} c="#1E293B" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#1E293B" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#1E293B" />
        {/* Polished shoes */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#0F172A" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#0F172A" />
      </div>
    );
  }

  // ECHO — cyan hoodie, single headset ear, community manager vibes
  if (agentName === "ECHO") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Messy hair */}
        <B x={2} y={0} w={8} h={3} c="#374151" />
        <B x={1} y={1} w={2} h={2} c="#374151" />
        <B x={9} y={1} w={2} h={2} c="#374151" />
        <B x={3} y={-1} w={3} h={2} c="#374151" />
        {/* Headset — single ear */}
        <B x={0} y={1} w={2} h={3} c="#06B6D4" r={1} />
        <B x={1} y={0} w={8} h={1} c="#4A4A5A" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#D2A06D" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={4} y={6} w={4} h={1} c="#C08850" />
        {/* Mic boom */}
        <B x={0} y={4} w={1} h={3} c="#4A4A5A" />
        <B x={1} y={6} w={2} h={1} c="#06B6D4" />
        {/* Cyan hoodie */}
        <B x={1} y={7} w={10} h={6} c="#0E7490" />
        <B x={4} y={7} w={1} h={3} c="#06B6D4" /><B x={7} y={7} w={1} h={3} c="#06B6D4" />
        {/* Speech bubble logo on chest */}
        <B x={4} y={9} w={4} h={3} c="#06B6D4" r={1} />
        <B x={5} y={10} w={2} h={1} c="#0E7490" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#0E7490" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#0E7490" />
        {/* Joggers */}
        <B x={2} y={13} w={8} h={5} c="#1F2937" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#1F2937" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#1F2937" />
        {/* Sneakers */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#06B6D4" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#06B6D4" />
      </div>
    );
  }

  // CLOSER — sharp orange blazer, power tie, sales closer energy
  if (agentName === "CLOSER") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Styled hair — side part */}
        <B x={2} y={0} w={8} h={3} c="#292524" />
        <B x={1} y={1} w={1} h={2} c="#292524" />
        <B x={2} y={0} w={3} h={1} c="#44403C" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={4} y={6} w={4} h={1} c="#E8A060" />
        {/* Bold blazer */}
        <B x={1} y={7} w={10} h={6} c="#C2410C" />
        {/* White shirt + power tie */}
        <B x={4} y={7} w={4} h={1} c="#E4E4E7" />
        <B x={3} y={7} w={1} h={2} c="#E4E4E7" /><B x={8} y={7} w={1} h={2} c="#E4E4E7" />
        <B x={5} y={7} w={2} h={5} c="#F97316" />
        <B x={5} y={7} w={2} h={1} c="#FDE68A" />
        {/* Lapels */}
        <B x={2} y={7} w={1} h={4} c="#9A3412" />
        <B x={9} y={7} w={1} h={4} c="#9A3412" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#C2410C" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#C2410C" />
        {isWorking && <><B x={0} y={12} w={1} h={1} c="#FDBF7C" /><B x={11} y={12} w={1} h={1} c="#FDBF7C" /></>}
        {/* Tailored pants */}
        <B x={2} y={13} w={8} h={5} c="#1C1917" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#1C1917" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#1C1917" />
        {/* Oxford shoes */}
        <B x={1} y={20 + legOff} w={4} h={1} c="#44403C" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#44403C" />
      </div>
    );
  }

  // RISK — red suit, serious look, caution sign vibes
  if (agentName === "RISK") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Slicked back hair */}
        <B x={2} y={0} w={8} h={3} c="#1C1917" />
        <B x={1} y={1} w={1} h={2} c="#1C1917" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={5} y={6} w={2} h={1} c="#E8A060" />
        {/* Red suit jacket */}
        <B x={1} y={7} w={10} h={6} c="#991B1B" />
        <B x={5} y={7} w={2} h={5} c="#7F1D1D" />
        <B x={3} y={7} w={2} h={1} c="#E4E4E7" /><B x={7} y={7} w={2} h={1} c="#E4E4E7" />
        {/* Caution pin */}
        <B x={8} y={9} w={2} h={2} c="#FDE68A" />
        <B x={9} y={9} w={1} h={1} c="#EF4444" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#991B1B" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#991B1B" />
        {/* Pants */}
        <B x={2} y={13} w={8} h={5} c="#292524" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#292524" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#292524" />
        <B x={1} y={20 + legOff} w={4} h={1} c="#1C1917" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#1C1917" />
      </div>
    );
  }

  // GROWTH — green jacket, upward chart tie
  if (agentName === "GROWTH") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Neat hair */}
        <B x={2} y={0} w={8} h={3} c="#44403C" />
        <B x={10} y={1} w={1} h={2} c="#44403C" />
        {/* Face */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={4} y={6} w={4} h={1} c="#E8A060" />
        {/* Green blazer */}
        <B x={1} y={7} w={10} h={6} c="#166534" />
        <B x={4} y={7} w={4} h={1} c="#E4E4E7" />
        {/* Chart-up tie (green gradient) */}
        <B x={5} y={8} w={2} h={4} c="#10B981" />
        <B x={5} y={8} w={2} h={1} c="#34D399" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#166534" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#166534" />
        {/* Pants */}
        <B x={2} y={13} w={8} h={5} c="#1F2937" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#1F2937" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#1F2937" />
        <B x={1} y={20 + legOff} w={4} h={1} c="#292524" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#292524" />
      </div>
    );
  }

  // DEVIL'S ADVOCATE — amber hoodie with question mark
  if (agentName === "DEVIL'S ADVOCATE") {
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Hood */}
        <B x={1} y={0} w={10} h={4} c="#B45309" />
        <B x={0} y={1} w={1} h={3} c="#92400E" />
        <B x={11} y={1} w={1} h={3} c="#92400E" />
        {/* Face in hood */}
        <B x={2} y={3} w={8} h={4} c="#FDBF7C" />
        <B x={3} y={4} w={2} h={1} c="#1a1a2e" /><B x={7} y={4} w={2} h={1} c="#1a1a2e" />
        <B x={4} y={6} w={4} h={1} c="#E8A060" />
        {/* Hoodie body */}
        <B x={1} y={7} w={10} h={6} c="#B45309" />
        <B x={4} y={7} w={4} h={2} c="#92400E" />
        {/* Question mark on chest */}
        <B x={5} y={9} w={2} h={1} c="#FDE68A" />
        <B x={6} y={10} w={1} h={1} c="#FDE68A" />
        <B x={5} y={11} w={2} h={1} c="#FDE68A" />
        <B x={5} y={11} w={1} h={1} c="#FDE68A" />
        {/* Arms */}
        <B x={0} y={8 + armOff} w={1} h={4} c="#B45309" />
        <B x={11} y={8 + (1 - armOff)} w={1} h={4} c="#B45309" />
        {/* Pants */}
        <B x={2} y={13} w={8} h={5} c="#292524" />
        <B x={2} y={18} w={3} h={2 + legOff} c="#292524" />
        <B x={7} y={18} w={3} h={2 + (1 - legOff)} c="#292524" />
        <B x={1} y={20 + legOff} w={4} h={1} c="#1C1917" />
        <B x={7} y={20 + (1 - legOff)} w={4} h={1} c="#1C1917" />
      </div>
    );
  }

  // ORACLE — purple robe, glowing eyes, mystical
  if (agentName === "ORACLE") {
    const eyeGlow = 0.5 + 0.3 * Math.sin(animFrame * 0.4);
    return (
      <div style={{ width: 12 * s, height: 22 * s, position: "relative" }}>
        {/* Hooded robe top */}
        <B x={1} y={0} w={10} h={5} c="#581C87" />
        <B x={0} y={2} w={1} h={3} c="#4C1D95" />
        <B x={11} y={2} w={1} h={3} c="#4C1D95" />
        <B x={3} y={1} w={6} h={3} c="#3B0764" />
        {/* Face (shadowed) */}
        <B x={2} y={4} w={8} h={3} c="#44403C" />
        {/* Glowing eyes */}
        <B x={3} y={5} w={2} h={1} c="#A855F7" style={{ opacity: eyeGlow }} />
        <B x={7} y={5} w={2} h={1} c="#A855F7" style={{ opacity: eyeGlow }} />
        {/* Robe body */}
        <B x={0} y={7} w={12} h={8} c="#581C87" />
        <B x={1} y={7} w={10} h={8} c="#6D28D9" />
        {/* Robe sash */}
        <B x={5} y={8} w={2} h={6} c="#A855F7" style={{ opacity: 0.4 }} />
        {/* Robe bottom / flowing */}
        <B x={0} y={15} w={12} h={4} c="#581C87" />
        <B x={1} y={15} w={10} h={4} c="#4C1D95" />
        {/* Feet barely visible */}
        <B x={2} y={19} w={3} h={2 + legOff} c="#3B0764" />
        <B x={7} y={19} w={3} h={2 + (1 - legOff)} c="#3B0764" />
      </div>
    );
  }

  // Fallback generic
  return (
    <div style={{ width: 10 * s, height: 20 * s, position: "relative" }}>
      <B x={1} y={0} w={8} h={4} c="#71717A" /><B x={2} y={4} w={6} h={4} c="#FDBF7C" />
      <B x={3} y={5} w={1} h={1} c="#1a1a2e" /><B x={6} y={5} w={1} h={1} c="#1a1a2e" />
      <B x={1} y={8} w={8} h={5} c="#71717A" /><B x={2} y={13} w={6} h={7} c="#2D2D3A" />
    </div>
  );
}

// Pixel desk with monitor
function PixelDesk({ monitorOn, agentColor }) {
  const mC = monitorOn ? "#0A1628" : "#111118";
  const mB = monitorOn ? "#3B82F6" : "#27272F";
  return (
    <div style={{ width: 30 * PX, height: 22 * PX, position: "relative" }}>
      {/* Monitor */}
      <B x={3} y={0} w={24} h={14} c={mC} r={2} />
      <div style={{ position: "absolute", left: 3 * PX, top: 0, width: 24 * PX, height: 14 * PX, border: `${PX}px solid ${mB}`, borderRadius: "2px", boxSizing: "border-box" }} />
      {monitorOn && <>
        <B x={6} y={3} w={18} h={1} c={agentColor} style={{ opacity: 0.6 }} />
        <B x={6} y={6} w={14} h={1} c={agentColor} style={{ opacity: 0.35 }} />
        <B x={6} y={9} w={10} h={1} c={agentColor} style={{ opacity: 0.2 }} />
      </>}
      {/* Stand */}
      <B x={13} y={14} w={4} h={3} c="#4A4A5A" />
      <B x={10} y={17} w={10} h={1} c="#4A4A5A" />
      {/* Desk surface */}
      <B x={0} y={18} w={30} h={2} c="#5C3D1E" />
      <B x={0} y={20} w={30} h={2} c="#4A3018" />
    </div>
  );
}

// Pixel chair
function PixelChair({ color = "#2A2040" }) {
  return (
    <div style={{ width: 12 * PX, height: 16 * PX, position: "relative" }}>
      <B x={1} y={0} w={10} h={10} c={color} r={1} />
      <B x={0} y={10} w={12} h={3} c={color} />
      <B x={1} y={13} w={2} h={3} c="#1A1A28" />
      <B x={9} y={13} w={2} h={3} c="#1A1A28" />
    </div>
  );
}

// Pixel couch
function PixelCouch() {
  return (
    <div style={{ width: 40 * PX, height: 18 * PX, position: "relative" }}>
      <B x={0} y={4} w={4} h={14} c="#3B2F5C" r={1} />
      <B x={36} y={4} w={4} h={14} c="#3B2F5C" r={1} />
      <B x={4} y={0} w={32} h={6} c="#4A3D72" r={1} />
      <B x={4} y={6} w={32} h={10} c="#3B2F5C" />
      <B x={4} y={14} w={32} h={4} c="#4A3D72" r={1} />
      <B x={6} y={8} w={12} h={6} c="#4A3D72" r={1} />
      <B x={22} y={8} w={12} h={6} c="#4A3D72" r={1} />
    </div>
  );
}

// Pixel coffee table
function PixelCoffeeTable() {
  return (
    <div style={{ width: 22 * PX, height: 10 * PX, position: "relative" }}>
      <B x={0} y={0} w={22} h={3} c="#6B4A28" r={1} />
      <B x={0} y={3} w={22} h={1} c="#5C3D1E" />
      <B x={2} y={4} w={2} h={6} c="#5C3D1E" />
      <B x={18} y={4} w={2} h={6} c="#5C3D1E" />
      {/* Coffee cup on table */}
      <B x={9} y={-3} w={4} h={3} c="#E4E4E7" r={1} />
      <B x={10} y={-4} w={2} h={1} c="#8B6914" />
    </div>
  );
}

// Pixel water cooler
function PixelWaterCooler() {
  return (
    <div style={{ width: 10 * PX, height: 24 * PX, position: "relative" }}>
      <B x={2} y={0} w={6} h={8} c="#87CEEB" r={1} style={{ opacity: 0.6 }} />
      <B x={1} y={8} w={8} h={3} c="#D4D4D8" />
      <B x={0} y={11} w={10} h={10} c="#D4D4D8" r={1} />
      <B x={3} y={22} w={1} h={2} c="#71717A" />
      <B x={6} y={22} w={1} h={2} c="#71717A" />
      <B x={4} y={8} w={2} h={2} c="#3B82F6" r={1} />
    </div>
  );
}

// Pixel ping pong table
function PixelPingPong() {
  return (
    <div style={{ width: 36 * PX, height: 22 * PX, position: "relative" }}>
      <B x={0} y={0} w={36} h={14} c="#0D5A2D" />
      <B x={0} y={0} w={36} h={1} c="#E4E4E7" />
      <B x={0} y={13} w={36} h={1} c="#E4E4E7" />
      <B x={0} y={0} w={1} h={14} c="#E4E4E7" />
      <B x={35} y={0} w={1} h={14} c="#E4E4E7" />
      <B x={17} y={0} w={2} h={14} c="#E4E4E7" style={{ opacity: 0.7 }} />
      <B x={17} y={-2} w={2} h={2} c="#71717A" />
      <B x={2} y={14} w={3} h={8} c="#5C3D1E" />
      <B x={31} y={14} w={3} h={8} c="#5C3D1E" />
    </div>
  );
}

// Pixel whiteboard
function PixelWhiteboard() {
  return (
    <div style={{ width: 32 * PX, height: 22 * PX, position: "relative" }}>
      <B x={0} y={0} w={32} h={20} c="#E8E8EC" r={1} />
      <B x={1} y={1} w={30} h={18} c="#F5F5F5" />
      <B x={14} y={20} w={4} h={2} c="#71717A" />
      {/* Scribbles */}
      <B x={3} y={4} w={12} h={1} c="#EF4444" style={{ opacity: 0.5 }} />
      <B x={3} y={7} w={18} h={1} c="#3B82F6" style={{ opacity: 0.5 }} />
      <B x={3} y={10} w={8} h={1} c="#10B981" style={{ opacity: 0.5 }} />
      <B x={3} y={13} w={14} h={1} c="#F59E0B" style={{ opacity: 0.5 }} />
    </div>
  );
}

// Pixel bean bag
function PixelBeanBag({ color }) {
  return (
    <div style={{ width: 14 * PX, height: 12 * PX, position: "relative" }}>
      <B x={1} y={2} w={12} h={10} c={color} r={3} />
      <B x={3} y={0} w={8} h={4} c={color} r={2} />
    </div>
  );
}

// Pixel fridge
function PixelFridge() {
  return (
    <div style={{ width: 14 * PX, height: 28 * PX, position: "relative" }}>
      <B x={0} y={0} w={14} h={28} c="#D4D4D8" r={1} />
      <B x={1} y={1} w={12} h={14} c="#C4C4C8" />
      <B x={1} y={16} w={12} h={11} c="#B4B4B8" />
      <B x={11} y={5} w={1} h={6} c="#71717A" />
      <B x={11} y={20} w={1} h={4} c="#71717A" />
      <B x={0} y={15} w={14} h={1} c="#A1A1AA" />
    </div>
  );
}

// Pixel coffee machine
function PixelCoffeeMachine() {
  return (
    <div style={{ width: 12 * PX, height: 18 * PX, position: "relative" }}>
      <B x={0} y={4} w={12} h={14} c="#2D2D3A" r={1} />
      <B x={1} y={0} w={10} h={5} c="#3D3D4A" r={1} />
      <B x={3} y={8} w={6} h={4} c="#111118" r={1} />
      <B x={5} y={6} w={2} h={2} c="#EF4444" r={2} />
      <B x={4} y={14} w={4} h={3} c="#5C3D1E" r={1} />
    </div>
  );
}

// Pixel cabinets
function PixelCabinets() {
  return (
    <div style={{ width: 30 * PX, height: 14 * PX, position: "relative" }}>
      <B x={0} y={0} w={30} h={14} c="#E8E8EC" />
      <B x={1} y={1} w={13} h={12} c="#D4D4D8" />
      <B x={16} y={1} w={13} h={12} c="#D4D4D8" />
      <B x={7} y={5} w={1} h={4} c="#A1A1AA" />
      <B x={22} y={5} w={1} h={4} c="#A1A1AA" />
    </div>
  );
}

// Pixel round table
function PixelRoundTable() {
  return (
    <div style={{ width: 28 * PX, height: 16 * PX, position: "relative" }}>
      <B x={2} y={0} w={24} h={10} c="#5C3D1E" r={5} />
      <B x={4} y={2} w={20} h={6} c="#6B4A28" r={4} />
      <B x={12} y={10} w={4} h={6} c="#4A3018" />
    </div>
  );
}

/* ─────────────────────────────────────
   PIXEL ART OFFICE VIEW
   ───────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════════
   OFFICE — Retro Pixel Art Floor Plan Simulator
   ═══════════════════════════════════════════════════════════════════════════════
   🕹 RETRO OFFICE RPG — Living pixel art office where AI agents work, wander,
   chat, get coffee, and play ping pong. Think Habbo Hotel meets Stardew Valley
   meets an actual startup office.
   
   🤖 OPENCLAW STATUS API HOOK:
   ═══════════════════════════════════════════
   The behavior system below can be driven by a real API endpoint.
   Replace the static `behaviorSchedule` with a fetch call to your agent status API.
   
   Expected API response format (GET /api/agents/status):
   {
     agents: [
       {
         name: "JARVIS",
         status: "working" | "idle" | "meeting" | "break",
         location: "desk" | "conference" | "kitchen" | "lounge" | "watercooler" | "pingpong",
         activity: "Reviewing strategy doc...",   // current task description
         uptime: "4h 23m",                        // time since last restart
         lastTask: "Compiled daily briefing",      // most recent completed task
       },
       // ... one entry per active agent
     ]
   }
   
   To hook up real statuses, replace this line in the useEffect:
     // MOCK: setBehaviorCycle(v => v + 1)
     // REAL: fetch('/api/agents/status').then(r => r.json()).then(data => setAgentStatuses(data.agents))
   
   The dashboard will then show real-time agent positions and activities.
   ═══════════════════════════════════════════════════════════════════════════════ */
function OfficeView() {
  const [frame, setFrame] = useState(0);
  const [tick, setTick] = useState(0);
  const [hoveredDesk, setHoveredDesk] = useState(null);
  const prevLocations = useRef({});
  const [transitioning, setTransitioning] = useState({});
  const [agentPositions, setAgentPositions] = useState({});
  const [officeStats, setOfficeStats] = useState({ at_desk: 0, roaming: 0 });

  // Fetch real agent positions from agent_positions.json
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('/agent_positions.json');
        if (response.ok) {
          const data = await response.json();
          setAgentPositions(data.agents || {});
          setOfficeStats({ at_desk: data.at_desk || 0, roaming: data.roaming || 0 });
        }
      } catch (e) {
        console.error('Failed to fetch agent positions:', e);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % 100), 120000); // 2 minutes - purposeful movement
    const f = setInterval(() => setFrame(v => (v + 1) % 1000), 5000); // 5 seconds - subtle animation
    return () => { clearInterval(t); clearInterval(f); };
  }, []);

  // Detect location changes for walking transitions
  useEffect(() => {
    const newTransitions = {};
    Object.entries(agentPositions).forEach(([name, data]) => {
      const currentLoc = data.desk ? "desk" : (data.room || "lounge");
      const prevLoc = prevLocations.current[name];
      if (prevLoc && prevLoc !== currentLoc) {
        newTransitions[name] = { from: prevLoc, to: currentLoc };
      }
      prevLocations.current[name] = currentLoc;
    });
    if (Object.keys(newTransitions).length > 0) {
      setTransitioning(prev => ({ ...prev, ...newTransitions }));
      setTimeout(() => {
        setTransitioning(prev => {
          const next = { ...prev };
          Object.keys(newTransitions).forEach(name => delete next[name]);
          return next;
        });
      }, 3000);
    }
  }, [agentPositions]);

  // Old behaviorSchedule removed - now using real data from agent_positions.json

  // Detect location changes for walking transitions
  useEffect(() => {
    const newTransitions = {};
    Object.entries(agentPositions).forEach(([name, data]) => {
      const currentLoc = data.desk ? "desk" : (data.room || "lounge");
      const prevLoc = prevLocations.current[name];
      if (prevLoc && prevLoc !== currentLoc) {
        newTransitions[name] = { from: prevLoc, to: currentLoc };
      }
      prevLocations.current[name] = currentLoc;
    });
    if (Object.keys(newTransitions).length > 0) {
      setTransitioning(prev => ({ ...prev, ...newTransitions }));
      setTimeout(() => {
        setTransitioning(prev => {
          const next = { ...prev };
          Object.keys(newTransitions).forEach(name => delete next[name]);
          return next;
        });
      }, 3000);
    }
  }, [agentPositions]);

  const agents = [
    { name: "JARVIS", color: "#3B82F6", activities: { desk: "Reviewing strategy...", conference: "Leading standup...", coffee: "Getting espresso...", lounge: "Quick break...", watercooler: "Chatting..." } },
    { name: "ATLAS", color: "#F59E0B", activities: { desk: "Scanning markets...", conference: "Presenting findings...", coffee: "Refueling...", lounge: "Reading report...", watercooler: "Discussing trends..." } },
    { name: "FORGE", color: "#60A5FA", activities: { desk: "Debugging script...", conference: "Code review...", coffee: "Third coffee...", lounge: "Stretching...", watercooler: "Talking shop..." } },
    { name: "SCRIBE", color: "#EC4899", activities: { desk: "Drafting thread...", conference: "Pitching ideas...", coffee: "Tea break...", lounge: "Reading draft...", watercooler: "Brainstorming..." } },
    { name: "PIXEL", color: "#A855F7", activities: { desk: "Designing assets...", conference: "Design review...", coffee: "Getting matcha...", lounge: "Sketching ideas...", pingpong: "Playing ping pong!", watercooler: "Color talk..." } },
    { name: "SHIELD", color: "#EF4444", activities: { desk: "Monitoring risk...", conference: "Risk briefing...", coffee: "Quick break...", lounge: "Reviewing alerts...", watercooler: "Checking in..." } },
    { name: "SENTINEL", color: "#64748B", activities: { desk: "Health checks...", conference: "Status update...", coffee: "Recharging...", lounge: "Running diagnostics...", watercooler: "System talk..." } },
    { name: "TRADER", color: "#10B981", activities: { desk: "Reading charts...", conference: "Market review...", coffee: "Quick espresso...", lounge: "Watching tickers...", watercooler: "Talking alpha..." } },
    { name: "ECHO", color: "#06B6D4", activities: { desk: "Moderating Discord...", conference: "Community standup...", coffee: "Herbal tea...", lounge: "Chatting members...", watercooler: "Building rapport..." } },
    { name: "CLOSER", color: "#F97316", activities: { desk: "Writing cold email...", conference: "Sales review...", coffee: "Power coffee...", lounge: "Rehearsing pitch...", watercooler: "Networking..." } },
    // Council Advisory
    { name: "RISK", color: "#EF4444", activities: { council: "Worst-case analysis...", conference: "Risk assessment...", coffee: "Grabbing coffee..." } },
    { name: "GROWTH", color: "#10B981", activities: { council: "Opportunity mapping...", conference: "Growth pitch...", coffee: "Quick break..." } },
    { name: "DEVIL'S ADVOCATE", color: "#F59E0B", activities: { council: "Stress-testing logic...", conference: "Challenging plan...", coffee: "Thinking time..." } },
    // Oracle
    { name: "ORACLE", color: "#A855F7", activities: { oracle: "Consulting crystal ball...", council: "Advising council..." } },
  ];

  const getAgentBehavior = (name) => {
    if (transitioning[name]) return "walking";
    // Use real location from agent_positions.json if available
    const data = agentPositions[name];
    if (data) {
      return data.desk ? "desk" : (data.room || "lounge");
    }
    // Fallback for Council/Oracle (show in their proper rooms)
    if (name === "RISK" || name === "GROWTH" || name === "DEVIL'S ADVOCATE") return "council";
    if (name === "ORACLE") return "oracle";
    return "desk";
  };

  const agentsAt = (location) => agents.filter(a => getAgentBehavior(a.name) === location);
  const walkingAgents = agents.filter(a => transitioning[a.name]);

  const destLabel = (dest) => dest === "desk" ? "💻 desk" : dest === "coffee" ? "☕ kitchen" : dest === "conference" ? "🏛 war room" : dest === "watercooler" ? "💧 cooler" : dest === "lounge" ? "🛋 lounge" : dest === "pingpong" ? "🏓 game corner" : dest === "council" ? "🏛 council" : dest === "oracle" ? "🔮 oracle" : dest;

  const AgentBubble = ({ agent, showActivity = true }) => {
    const behavior = getAgentBehavior(agent.name);
    const activity = agent.activities[behavior] || "Idle...";
    const isWorking = behavior === "desk";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <AgentSprite agentName={agent.name} isWorking={isWorking} animFrame={frame + agents.indexOf(agent)} />
        {showActivity && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "8px", fontWeight: 700, color: agent.color, letterSpacing: "0.5px" }}>{agent.name}</div>
            <div style={{ fontSize: "7px", color: agent.color, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90px" }}>
              {activity}
            </div>
          </div>
        )}
      </div>
    );
  };

  const RoomLabel = ({ children, color = "var(--mc-text4)" }) => (
    <div style={{ fontSize: "8px", fontWeight: 700, color, letterSpacing: "1.5px", marginBottom: "8px", textTransform: "uppercase" }}>{children}</div>
  );

  const StatusDot = ({ working }) => (
    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: working ? "#10B981" : "#F59E0B", boxShadow: working ? "0 0 4px #10B98166" : "none" }} />
  );

  // Chat bubbles for agents who are chatting at locations
  const ChatBubble = ({ text, color }) => (
    <div style={{ fontSize: "6px", color, background: color + "15", border: `1px solid ${color}25`, borderRadius: "6px 6px 6px 0", padding: "2px 5px", maxWidth: "70px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {text}
    </div>
  );

  const chatPhrases = {
    JARVIS: ["Next quarter's plan?", "Update on pipeline?", "Let's align.", "Thoughts?"],
    ATLAS: ["BTC looking bullish.", "Whale alert!", "Check this chart.", "ETH volume up."],
    FORGE: ["Deployed to prod.", "PR looks good.", "Found the bug.", "CI passed."],
    SCRIBE: ["Thread going viral!", "New draft ready.", "Engagement up 30%.", "Good caption?"],
    PIXEL: ["New design ready!", "Colors are off.", "Logo v3 done.", "Love this palette."],
    SHIELD: ["Risk within limits.", "Watch BTC exposure.", "Circuit breaker OK.", "All green."],
    SENTINEL: ["99.9% uptime.", "All agents healthy.", "API latency low.", "Zero errors."],
    TRADER: ["BTC breakout incoming.", "Long ETH here.", "Whale accumulating.", "Check the chart!"],
    ECHO: ["Community loves it!", "DMs blowing up.", "Sentiment is bullish.", "New member joined!"],
    CLOSER: ["Deal almost closed.", "Follow-up sent.", "Proposal drafted.", "Lead qualified!"],
    RISK: ["Worst-case scenario.", "What if it fails?", "Too much exposure.", "Red flag here."],
    GROWTH: ["10x opportunity.", "Perfect timing.", "Scale this now.", "Upside is huge."],
    "DEVIL'S ADVOCATE": ["But what if not?", "Prove it.", "Counterpoint...", "You're both wrong."],
    ORACLE: ["I foresee...", "The data suggests...", "Pattern emerging.", "Consider this..."],
  };

  // Unique desk items per agent (pixel art inline)
  const DeskItem = ({ name }) => {
    if (name === "JARVIS") return <div style={{ position: "relative" }}><B x={0} y={2} w={6} h={3} c="#1E293B" r={1} /><B x={2} y={0} w={2} h={2} c="#374151" r={1} /><B x={2} y={3} w={2} h={1} c="#F59E0B" /></div>;
    if (name === "ATLAS") return <div style={{ position: "relative" }}><B x={1} y={1} w={4} h={4} c="#1E6B5A" r={2} /><B x={2} y={0} w={2} h={1} c="#3B82F6" /><B x={0} y={2} w={1} h={2} c="#3B82F6" /><B x={5} y={2} w={1} h={2} c="#3B82F6" /><B x={2} y={5} w={2} h={1} c="#8B6914" /></div>;
    if (name === "FORGE") return <div style={{ position: "relative" }}><B x={1} y={1} w={3} h={4} c="#E4E4E7" r={1} /><B x={4} y={2} w={1} h={2} c="#A1A1AA" /><B x={2} y={2} w={2} h={1} c="#6F4E37" /></div>;
    if (name === "SCRIBE") return <div style={{ position: "relative" }}><B x={0} y={4} w={5} h={2} c="#F5E6C8" r={1} /><B x={0} y={2} w={5} h={2} c="#D4A94B" r={1} /><B x={0} y={0} w={5} h={2} c="#EC4899" r={1} /></div>;
    if (name === "PIXEL") return <div style={{ position: "relative" }}><B x={0} y={2} w={6} h={3} c="#4A3018" /><B x={1} y={0} w={1} h={3} c="#EF4444" /><B x={3} y={0} w={1} h={2} c="#3B82F6" /><B x={5} y={1} w={1} h={2} c="#F59E0B" /></div>;
    if (name === "SHIELD") return <div style={{ position: "relative" }}><B x={1} y={0} w={4} h={5} c="#4A4A5A" r={1} /><B x={2} y={1} w={2} h={3} c="#EF4444" r={1} /><B x={2} y={2} w={2} h={1} c="#F87171" /></div>;
    if (name === "SENTINEL") return <div style={{ position: "relative" }}><B x={0} y={0} w={5} h={4} c="#1E293B" r={1} /><B x={1} y={1} w={3} h={1} c={frame % 2 === 0 ? "#10B981" : "#064E3B"} /><B x={1} y={2} w={2} h={1} c={frame % 2 === 0 ? "#3B82F6" : "#1E3A5F"} /></div>;
    if (name === "TRADER") return <div style={{ position: "relative" }}><B x={0} y={0} w={7} h={5} c="#0A1628" r={1} /><B x={1} y={1} w={5} h={1} c="#10B981" style={{ opacity: 0.7 }} /><B x={1} y={2} w={3} h={1} c="#EF4444" style={{ opacity: 0.6 }} /><B x={4} y={3} w={2} h={1} c="#10B981" style={{ opacity: 0.5 }} /></div>;
    if (name === "ECHO") return <div style={{ position: "relative" }}><B x={1} y={0} w={5} h={3} c="#374151" r={2} /><B x={0} y={2} w={1} h={3} c="#374151" r={1} /><B x={6} y={2} w={1} h={3} c="#374151" r={1} /><B x={2} y={1} w={3} h={2} c="#06B6D4" style={{ opacity: 0.5 }} /></div>;
    if (name === "CLOSER") return <div style={{ position: "relative" }}><B x={0} y={2} w={5} h={4} c="#E4E4E7" r={1} /><B x={5} y={3} w={1} h={2} c="#A1A1AA" /><B x={1} y={3} w={3} h={1} c="#71717A" style={{ opacity: 0.5 }} /><B x={1} y={4} w={2} h={1} c="#71717A" style={{ opacity: 0.3 }} /></div>;
    return null;
  };

  // Desk slot — shows agent + activity if at desk, or dim empty desk
  const AgentDesk = ({ agent }) => {
    const behavior = getAgentBehavior(agent.name);
    const isAtDesk = behavior === "desk";
    const activity = agent.activities[behavior] || "Idle...";
    const isHovered = hoveredDesk === agent.name;
    return (
      <div
        onMouseEnter={() => setHoveredDesk(agent.name)}
        onMouseLeave={() => setHoveredDesk(null)}
        style={{
          background: isAtDesk ? `${agent.color}08` : "var(--mc-bg4)",
          border: `1px solid ${isAtDesk ? agent.color + "33" : "var(--mc-border2)"}`,
          borderRadius: "8px",
          padding: "8px",
          position: "relative",
          transition: "all 0.3s",
          boxShadow: isAtDesk ? `0 0 14px ${agent.color}18` : "none",
          minWidth: 0,
        }}
      >
        {/* Status dot */}
        <div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%", background: isAtDesk ? "#10B981" : "#2D2D3A", boxShadow: isAtDesk ? "0 0 5px #10B98166" : "none" }} />
        {/* Agent label */}
        <div style={{ fontSize: "7px", fontWeight: 800, color: agent.color, letterSpacing: "0.8px", marginBottom: 4, opacity: isAtDesk ? 1 : 0.4 }}>{agent.name}</div>
        {/* Desk + sprite */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, opacity: isAtDesk ? 1 : 0.25 }}>
          {isAtDesk && <AgentSprite agentName={agent.name} isWorking={true} animFrame={frame + agents.indexOf(agent)} />}
          <PixelDesk monitorOn={isAtDesk} agentColor={agent.color} />
          {isAtDesk && <DeskItem name={agent.name} />}
        </div>
        {/* Activity tooltip on hover */}
        {isHovered && (
          <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#0A0A0F", border: `1px solid ${agent.color}44`, borderRadius: 6, padding: "4px 8px", fontSize: 8, color: agent.color, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>
            {isAtDesk ? `✦ ${activity}` : `↪ ${behavior === "coffee" ? "☕ at kitchen" : behavior === "conference" ? "🏛 in war room" : behavior === "watercooler" ? "💧 water cooler" : behavior === "lounge" ? "🛋 in lounge" : behavior === "pingpong" ? "🏓 ping pong" : "away"}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ═══════════════════════════════════════════
          UNIFIED FLOOR PLAN — Single canvas
      ═══════════════════════════════════════════ */}
      <div style={{
        background: "var(--mc-card)",
        border: "1px solid var(--mc-border2)",
        borderRadius: "14px",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Checkered floor */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "repeating-conic-gradient(#0E0E1A22 0% 25%, transparent 0% 50%)", backgroundSize: "14px 14px", opacity: 0.35 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* HQ Header */}
          <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--mc-text4)", marginBottom: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px" }}>🕹</span>
            SIEW&apos;S CAPITAL HQ
            <span style={{ fontSize: "7px", color: "var(--mc-text5)", letterSpacing: "1px" }}>·</span>
            <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 600 }}>{agents.filter(a => getAgentBehavior(a.name) === "desk").length} AT DESK</span>
            <span style={{ fontSize: "7px", color: "var(--mc-text5)" }}>·</span>
            <span style={{ fontSize: "8px", color: "#F59E0B", fontWeight: 600 }}>{agents.filter(a => getAgentBehavior(a.name) !== "desk" && !transitioning[a.name]).length} ROAMING</span>
            {walkingAgents.length > 0 && <>
              <span style={{ fontSize: "7px", color: "var(--mc-text5)" }}>·</span>
              <span style={{ fontSize: "8px", color: "#3B82F6", fontWeight: 600 }}>{walkingAgents.length} WALKING</span>
            </>}
          </div>
          {/* Legend — explains what the dots mean */}
          <div style={{ display: "flex", gap: 14, marginBottom: 12, padding: "6px 10px", background: "var(--mc-card2)", borderRadius: 6, fontSize: "7px", color: "var(--mc-text5)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, letterSpacing: "1px", color: "var(--mc-text4)" }}>GUIDE:</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 4px #10B98166" }} /> At desk — working</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} /> In room — on break</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} /> Walking — in transit</span>
            <span style={{ color: "var(--mc-text6)" }}>Agents move between rooms on a cycle. Hover desks for details.</span>
          </div>

          {/* ── ROW 1: Chairman's Office + War Room ── */}
          <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
            {/* Chairman's Office */}
            <div style={{
              flex: "1 1 0",
              background: "linear-gradient(135deg, #1A1508, #12100A)",
              border: "1px solid #F59E0B33",
              borderRadius: "10px 0 0 0",
              padding: "16px",
              position: "relative",
              minHeight: 260,
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#F59E0B55", letterSpacing: "1.5px", marginBottom: 10 }}>👑 CHAIRMAN&apos;S OFFICE</div>

              {/* BACK WALL — large bookshelf, executive desk, diploma wall */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #F59E0B0A" }}>
                {/* Large bookshelf — taller and wider */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={22} h={26} c="#4A3018" r={1} />
                  {/* Shelf dividers */}
                  <B x={0} y={6} w={22} h={1} c="#3D2514" />
                  <B x={0} y={12} w={22} h={1} c="#3D2514" />
                  <B x={0} y={18} w={22} h={1} c="#3D2514" />
                  {/* Books — row 1 */}
                  <B x={1} y={1} w={3} h={5} c="#3B82F6" /><B x={4} y={1} w={3} h={5} c="#EC4899" /><B x={7} y={1} w={4} h={5} c="#F59E0B" /><B x={12} y={2} w={3} h={4} c="#10B981" /><B x={16} y={1} w={3} h={5} c="#64748B" /><B x={19} y={2} w={2} h={4} c="#06B6D4" />
                  {/* Books — row 2 */}
                  <B x={1} y={7} w={4} h={5} c="#A855F7" /><B x={5} y={7} w={3} h={5} c="#8B6914" /><B x={9} y={8} w={3} h={4} c="#EF4444" /><B x={13} y={7} w={3} h={5} c="#06B6D4" /><B x={17} y={8} w={2} h={4} c="#F97316" /><B x={19} y={7} w={2} h={5} c="#3B82F6" />
                  {/* Books — row 3 */}
                  <B x={1} y={13} w={3} h={5} c="#64748B" /><B x={4} y={13} w={4} h={5} c="#F97316" /><B x={9} y={14} w={3} h={4} c="#FDE68A" style={{ opacity: 0.6 }} /><B x={13} y={13} w={3} h={5} c="#EC4899" /><B x={17} y={14} w={2} h={4} c="#A855F7" />
                  <B x={19} y={14} w={2} h={3} c="#374151" r={1} />{/* ornament */}
                  {/* Books — row 4 + decor */}
                  <B x={1} y={19} w={3} h={4} c="#10B981" /><B x={5} y={19} w={4} h={4} c="#1E3A5F" /><B x={10} y={20} w={3} h={3} c="#D4A94B" /><B x={14} y={19} w={3} h={4} c="#EF4444" />
                  <B x={18} y={20} w={3} h={3} c="#374151" r={1} />{/* small trophy */}
                  {/* Base */}
                  <B x={0} y={24} w={22} h={2} c="#3D2514" />
                </div>

                {/* Executive desk — centered */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <PixelDesk monitorOn={true} agentColor="#F59E0B" />
                  <div style={{ fontSize: "5px", color: "#F59E0B22", letterSpacing: "1px" }}>EXECUTIVE DESK</div>
                </div>

                {/* Right wall — diploma, clock, plant */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  {/* Diploma frame */}
                  <div style={{ position: "relative" }}>
                    <B x={0} y={0} w={12} h={9} c="#292524" r={1} />
                    <B x={1} y={1} w={10} h={7} c="#1A150B" />
                    <B x={2} y={2} w={8} h={1} c="#F59E0B" style={{ opacity: 0.3 }} />
                    <B x={3} y={4} w={6} h={1} c="#F59E0B" style={{ opacity: 0.2 }} />
                    <B x={4} y={6} w={4} h={1} c="#F59E0B" style={{ opacity: 0.15 }} />
                  </div>
                  {/* Wall clock */}
                  <div style={{ position: "relative" }}>
                    <B x={0} y={0} w={8} h={8} c="#292524" r={4} />
                    <B x={1} y={1} w={6} h={6} c="#1F2937" r={3} />
                    <B x={4} y={1} w={1} h={3} c="#F59E0B" />{/* minute hand */}
                    <B x={4} y={4} w={3} h={1} c="#E4E4E7" />{/* hour hand */}
                  </div>
                  <div style={{ position: "relative", width: 12 * PX, height: 16 * PX }}><PixelPlant x={0} y={0} size="medium" /></div>
                </div>
              </div>

              {/* MIDDLE — premium carpet with guest seating area */}
              <div style={{ background: "linear-gradient(90deg, #4A301808, #4A301815, #4A301808)", borderRadius: 6, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, minHeight: 38, gap: 16 }}>
                {/* Globe on stand */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={4} w={8} h={2} c="#5C3D1E" r={1} />
                  <B x={1} y={0} w={6} h={6} c="#1E40AF" r={3} />
                  <B x={2} y={1} w={2} h={1} c="#E4E4E7" style={{ opacity: 0.3 }} />
                  <B x={1} y={2} w={2} h={2} c="#10B981" style={{ opacity: 0.4 }} />
                  <B x={4} y={3} w={2} h={1} c="#10B981" style={{ opacity: 0.4 }} />
                </div>
                {/* Guest chair */}
                <PixelChair color="#6B4A2866" />
                {/* Oriental carpet pattern */}
                <div style={{ flex: 1, margin: "0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: 1, background: "#F59E0B", opacity: 0.1 }} />
                  <div style={{ fontSize: "5px", color: "#F59E0B1A", letterSpacing: "4px" }}>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</div>
                  <div style={{ width: "70%", height: 1, background: "#F59E0B", opacity: 0.06 }} />
                </div>
                {/* Guest chair */}
                <PixelChair color="#6B4A2866" />
                {/* City skyline painting */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={12} h={8} c="#292524" r={1} />
                  <B x={1} y={1} w={10} h={6} c="#0F172A" />
                  <B x={2} y={5} w={2} h={2} c="#1E3A5F" /><B x={5} y={3} w={1} h={4} c="#2563EB" style={{ opacity: 0.6 }} />
                  <B x={7} y={2} w={2} h={5} c="#1E3A5F" /><B x={3} y={6} w={6} h={1} c="#F59E0B" style={{ opacity: 0.2 }} />
                </div>
              </div>

              {/* BOTTOM — lounge zone with couch, coffee table, lamp, and display */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                {/* Filing cabinet */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={6} h={10} c="#374151" r={1} />
                  <B x={1} y={1} w={4} h={3} c="#1F2937" />
                  <B x={3} y={2} w={1} h={1} c="#F59E0B" />
                  <B x={1} y={5} w={4} h={3} c="#1F2937" />
                  <B x={3} y={6} w={1} h={1} c="#F59E0B" />
                </div>
                {/* Couch */}
                <PixelCouch />
                {/* Coffee table */}
                <PixelCoffeeTable />
                {/* Floor lamp */}
                <div style={{ position: "relative" }}>
                  <B x={2} y={0} w={2} h={3} c="#FDE68A" style={{ opacity: 0.7 }} />
                  <B x={1} y={0} w={4} h={1} c="#FBBF24" style={{ opacity: 0.4 }} />
                  <B x={2} y={3} w={2} h={8} c="#71717A" />
                  <B x={1} y={11} w={4} h={1} c="#71717A" />
                </div>
                <div style={{ flex: 1 }} />
                {/* Trophy */}
                <div style={{ position: "relative" }}>
                  <B x={1} y={0} w={4} h={2} c="#F59E0B" /><B x={0} y={0} w={1} h={3} c="#D4A94B" />
                  <B x={5} y={0} w={1} h={3} c="#D4A94B" /><B x={2} y={2} w={2} h={4} c="#F59E0B" />
                  <B x={1} y={6} w={4} h={1} c="#D4A94B" />
                </div>
                {/* Large plant */}
                <div style={{ position: "relative", width: 14 * PX, height: 20 * PX }}><PixelPlant x={0} y={0} size="large" /></div>
              </div>
              <div style={{ fontSize: "8px", color: "#F59E0B33", marginTop: 6 }}>Brayden Siew · Chairman</div>
              {/* Door gap on right */}
              <div style={{ position: "absolute", right: -1, top: "40%", width: 2, height: "25%", background: "var(--mc-bg4)" }} />
            </div>

            {/* War Room */}
            <div style={{
              flex: "1 1 0",
              background: "var(--mc-bg4)",
              border: "1px solid var(--mc-border)",
              borderLeft: "none",
              borderRadius: "0 10px 0 0",
              padding: "12px",
              position: "relative",
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: 8 }}>🏛 WAR ROOM</div>
              {/* Round table layout */}
              <div style={{ position: "relative", height: 220 }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}><PixelWhiteboard /></div>
                <div style={{ position: "absolute", top: 0, left: 0 }}><div style={{ position: "relative", width: 12 * PX, height: 18 * PX }}><PixelPlant x={0} y={0} size="medium" /></div></div>
                <div style={{ position: "absolute", top: 0, right: 0 }}><div style={{ position: "relative", width: 10 * PX, height: 16 * PX }}><PixelPlant x={0} y={0} size="small" /></div></div>
                {(() => {
                  const tableW = 130; const tableH = 100;
                  const seatPositions = [];
                  for (let si = 0; si < 10; si++) {
                    const angle = (si / 10) * Math.PI * 2 - Math.PI / 2;
                    seatPositions.push({ dx: Math.cos(angle) * (tableW / 2 + 14), dy: Math.sin(angle) * (tableH / 2 + 22) });
                  }
                  const confAgents = agentsAt("conference");
                  return (
                    <div style={{ position: "absolute", top: 130, left: "50%", transform: "translate(-50%, -50%)" }}>
                      <div style={{ width: tableW, height: tableH, borderRadius: "50%", background: "radial-gradient(ellipse, #7A5230 0%, #5C3D1E 70%, #4A3018 100%)", border: `${PX * 2}px solid #4A3018`, position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                        <div style={{ position: "absolute", top: "15%", left: "20%", width: "60%", height: "30%", borderRadius: "50%", background: "rgba(122,82,48,0.5)" }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}><B x={0} y={0} w={4} h={5} c="#E4E4E7" r={1} /></div>
                        <div style={{ position: "absolute", top: "20%", left: "15%" }}><B x={0} y={0} w={2} h={2} c="#E4E4E7" r={1} /><B x={0} y={0} w={2} h={1} c="#6F4E37" /></div>
                        <div style={{ position: "absolute", top: "60%", right: "18%" }}><B x={0} y={0} w={2} h={2} c="#E4E4E7" r={1} /><B x={0} y={0} w={2} h={1} c="#6F4E37" /></div>
                      </div>
                      {seatPositions.map((seat, i) => (
                        <div key={`cs-${i}`} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${seat.dx}px), calc(-50% + ${seat.dy}px))` }}>
                          <PixelChair color={confAgents[i] ? confAgents[i].color + "44" : "#2A2040"} />
                        </div>
                      ))}
                      {confAgents.map((a, i) => {
                        if (i >= seatPositions.length) return null;
                        const seat = seatPositions[i];
                        return (
                          <div key={a.name} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${seat.dx}px), calc(-50% + ${seat.dy - 28}px))`, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, zIndex: 2 }}>
                            <ChatBubble text={(chatPhrases[a.name] || ["..."])[(tick + agents.indexOf(a)) % (chatPhrases[a.name]?.length || 1)]} color={a.color} />
                            <AgentSprite agentName={a.name} isWorking={false} animFrame={frame + agents.indexOf(a)} />
                            <div style={{ fontSize: "6px", color: a.color, fontWeight: 700 }}>{a.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <div style={{ fontSize: "7px", color: "var(--mc-text6)", marginTop: 4 }}>
                {agentsAt("conference").length > 0 ? `${agentsAt("conference").map(a => a.name).join(" & ")} in meeting` : "Empty — next standup soon"}
              </div>
              {/* Door gap on left */}
              <div style={{ position: "absolute", left: -1, top: "40%", width: 2, height: "25%", background: "var(--mc-bg4)" }} />
            </div>
          </div>

          {/* MAIN CORRIDOR — atmospheric hallway */}
          <div style={{ background: "linear-gradient(90deg, var(--mc-bg4), #0E0E1A, var(--mc-bg4))", borderLeft: "1px solid var(--mc-border)", borderRight: "1px solid var(--mc-border)", padding: "0 12px", minHeight: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 22 }}>
              {/* Exit sign left */}
              <div style={{ fontSize: "5px", color: "#10B981", fontWeight: 700, opacity: 0.4, letterSpacing: "1px" }}>🚪 EXIT</div>
              {/* Carpet runner */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 1, background: "#F59E0B", opacity: 0.06 }} />
                <div style={{ fontSize: "7px", color: "var(--mc-text6)", letterSpacing: "2px" }}>· · · MAIN CORRIDOR · · ·</div>
                <div style={{ flex: 1, height: 1, background: "#F59E0B", opacity: 0.06 }} />
              </div>
              {/* Fire extinguisher */}
              <div style={{ position: "relative" }}>
                <B x={0} y={0} w={2} h={4} c="#EF4444" style={{ opacity: 0.4 }} r={1} />
                <B x={0} y={4} w={2} h={1} c="#71717A" style={{ opacity: 0.3 }} />
              </div>
            </div>
            {/* Walking agents in corridor */}
            {walkingAgents.length > 0 && (
              <div style={{ display: "flex", gap: 12, padding: "6px 0 8px", justifyContent: "center", flexWrap: "wrap" }}>
                {walkingAgents.map(a => {
                  const dest = transitioning[a.name]?.to || "desk";
                  return (
                    <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", background: a.color + "12", border: `1px solid ${a.color}25`, borderRadius: 6, transition: "all 0.3s" }}>
                      <AgentSprite agentName={a.name} isWorking={false} animFrame={frame + agents.indexOf(a)} />
                      <div>
                        <div style={{ fontSize: "7px", fontWeight: 700, color: a.color }}>{a.name}</div>
                        <div style={{ fontSize: "6px", color: a.color, opacity: 0.7 }}>🚶 Walking to {destLabel(dest)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ROW 1.5: Council Advisory + Oracle Rooms ── */}
          <div style={{ display: "flex", gap: 0 }}>
            {/* Council Advisory Room — strategy table with 3 seats */}
            <div style={{
              flex: "2 1 0",
              background: "linear-gradient(135deg, #0F0A1A, #0A0812)",
              border: "1px solid #A855F733",
              borderTop: "none",
              padding: "12px",
              position: "relative",
              minHeight: 120,
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#A78BFA55", letterSpacing: "1.5px", marginBottom: 8 }}>🏛 COUNCIL ADVISORY</div>
              {/* Strategy table + chairs */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                {/* Whiteboard */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={14} h={10} c="#1F2937" r={1} />
                  <B x={1} y={1} w={12} h={8} c="#F9FAFB" />
                  <B x={2} y={2} w={4} h={1} c="#EF4444" style={{ opacity: 0.5 }} />
                  <B x={2} y={4} w={5} h={1} c="#10B981" style={{ opacity: 0.5 }} />
                  <B x={2} y={6} w={3} h={1} c="#F59E0B" style={{ opacity: 0.5 }} />
                  <B x={8} y={3} w={4} h={4} c="#A855F722" />
                </div>
                {/* Strategy Table */}
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={16} h={8} c="#3D2852" r={2} />
                  <B x={2} y={2} w={12} h={4} c="#4A3060" r={1} />
                  <B x={7} y={3} w={2} h={2} c="#A855F7" style={{ opacity: 0.3 }} />
                </div>
              </div>
              {/* Council members at seats */}
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                {agentsAt("council").map(a => (
                  <div key={a.name} style={{ textAlign: "center" }}>
                    <AgentSprite agentName={a.name} isWorking={false} animFrame={frame} />
                    <div style={{ fontSize: "6px", fontWeight: 700, color: a.color, letterSpacing: "0.5px", marginTop: 2 }}>{a.name}</div>
                  </div>
                ))}
              </div>
              {/* Door gap */}
              <div style={{ position: "absolute", right: -1, top: "35%", width: 2, height: "30%", background: "var(--mc-bg4)" }} />
            </div>

            {/* Oracle Room — mystical private space */}
            <div style={{
              flex: "1 1 0",
              background: "linear-gradient(135deg, #14091F, #0D0618)",
              border: "1px solid #A855F733",
              borderLeft: "none",
              borderTop: "none",
              padding: "12px",
              position: "relative",
              minHeight: 120,
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#A855F755", letterSpacing: "1.5px", marginBottom: 8 }}>🔮 ORACLE CHAMBER</div>
              {/* Crystal ball on pedestal */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative" }}>
                  {/* Pedestal */}
                  <B x={2} y={8} w={8} h={4} c="#2D1B4E" r={1} />
                  <B x={3} y={6} w={6} h={3} c="#3D2563" r={1} />
                  {/* Crystal ball glow */}
                  <B x={3} y={0} w={6} h={6} c="#A855F7" r={3} style={{ opacity: 0.2 + 0.15 * Math.sin(frame * 0.3) }} />
                  <B x={4} y={1} w={4} h={4} c="#C084FC" r={2} style={{ opacity: 0.3 + 0.1 * Math.sin(frame * 0.5) }} />
                  <B x={5} y={2} w={2} h={2} c="#E9D5FF" r={1} style={{ opacity: 0.5 }} />
                </div>
                {/* Oracle character */}
                {agentsAt("oracle").map(a => (
                  <div key={a.name} style={{ textAlign: "center" }}>
                    <AgentSprite agentName={a.name} isWorking={false} animFrame={frame} />
                    <div style={{ fontSize: "6px", fontWeight: 700, color: "#A855F7", letterSpacing: "0.5px", marginTop: 2 }}>{a.name}</div>
                    <div style={{ fontSize: "5px", color: "#A855F766", marginTop: 1 }}>{a.activities?.oracle || "Meditating..."}</div>
                  </div>
                ))}
                {/* Mystical bookshelf */}
                <div style={{ position: "relative", alignSelf: "flex-start" }}>
                  <B x={0} y={0} w={6} h={8} c="#2D1B4E" r={1} />
                  <B x={1} y={1} w={2} h={2} c="#A855F7" style={{ opacity: 0.3 }} />
                  <B x={3} y={1} w={2} h={2} c="#7C3AED" style={{ opacity: 0.3 }} />
                  <B x={1} y={4} w={2} h={2} c="#C084FC" style={{ opacity: 0.3 }} />
                  <B x={3} y={4} w={2} h={2} c="#8B5CF6" style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Open Plan Workspace — all 10 desks ── */}
          <div style={{
            background: "var(--mc-bg4)",
            border: "1px solid var(--mc-border)",
            borderTop: "none",
            padding: "12px",
            position: "relative",
          }}>
            <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: 10 }}>💻 OPEN PLAN WORKSPACE</div>

            {/* Row A — top 6 desks */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 6 }}>
              {agents.slice(0, 6).map(agent => <AgentDesk key={agent.name} agent={agent} />)}
            </div>

            {/* Thin cubicle divider */}
            <div style={{ height: 1, background: "var(--mc-border2)", margin: "4px 0", opacity: 0.5 }} />

            {/* Row B — bottom 4 desks + open collaboration area */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
              {agents.slice(6, 10).map(agent => <AgentDesk key={agent.name} agent={agent} />)}
              {/* Open collab area for remaining 2 slots */}
              <div style={{ gridColumn: "span 2", background: "var(--mc-card)", border: "1px dashed var(--mc-border)", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4, opacity: 0.5 }}>
                <div style={{ fontSize: "7px", color: "var(--mc-text5)", letterSpacing: "1px" }}>COLLAB SPACE</div>
                <PixelCoffeeTable />
                <div style={{ display: "flex", gap: 4 }}><PixelChair color="#2A2040" /><PixelChair color="#2A2040" /></div>
              </div>
            </div>

            {/* Plants along the back wall */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "1px solid var(--mc-border2)", opacity: 0.3 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ position: "relative", width: 10 * PX, height: 14 * PX }}>
                  <PixelPlant x={0} y={0} size={i % 3 === 0 ? "medium" : "small"} />
                </div>
              ))}
            </div>
          </div>

          {/* ── CORRIDOR 2 — Break corridor with amenities ── */}
          <div style={{ display: "flex", alignItems: "center", background: "linear-gradient(90deg, var(--mc-bg4), #0E0E1A, var(--mc-bg4))", borderLeft: "1px solid var(--mc-border)", borderRight: "1px solid var(--mc-border)", height: 22, padding: "0 12px", position: "relative" }}>
            {/* Water cooler */}
            <div style={{ position: "relative" }}>
              <B x={0} y={0} w={3} h={4} c="#06B6D4" style={{ opacity: 0.4 }} r={1} />
              <B x={1} y={4} w={1} h={1} c="#71717A" style={{ opacity: 0.3 }} />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 1, background: "#A855F7", opacity: 0.04 }} />
              <div style={{ fontSize: "7px", color: "var(--mc-text6)", letterSpacing: "2px" }}>· · · BREAK CORRIDOR · · ·</div>
              <div style={{ flex: 1, height: 1, background: "#A855F7", opacity: 0.04 }} />
            </div>
            {/* Candy/snack jar */}
            <div style={{ position: "relative" }}>
              <B x={0} y={1} w={3} h={3} c="#374151" style={{ opacity: 0.4 }} r={1} />
              <B x={0} y={0} w={3} h={1} c="#E4E4E7" style={{ opacity: 0.2 }} />
              <B x={1} y={2} w={1} h={1} c="#EC4899" style={{ opacity: 0.5 }} />
            </div>
          </div>

          {/* ── ROW 3: Lounge + Kitchen ── */}
          <div style={{ display: "flex", gap: 0 }}>

            {/* LOUNGE — one open flowing space */}
            <div style={{
              flex: 1,
              background: "var(--mc-bg4)",
              border: "1px solid var(--mc-border)",
              borderTop: "none",
              borderRadius: "0 0 0 10px",
              padding: "12px",
              position: "relative",
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: 10 }}>🛋 LOUNGE &amp; BREAK AREA</div>

              {/* Three clear zones using grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, minHeight: 100 }}>

                {/* ZONE 1: TV Lounge — couch facing a pixel TV */}
                <div style={{ background: "#0D0D1A44", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: "7px", color: "var(--mc-text6)", letterSpacing: "1px", marginBottom: 4 }}>📺 TV LOUNGE</div>
                  {/* Pixel TV */}
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <B x={0} y={0} w={16} h={10} c="#1F2937" r={1} />
                    <B x={1} y={1} w={14} h={7} c={frame % 6 < 3 ? "#1E3A5F" : "#0E2A4F"} />
                    <B x={3} y={3} w={4} h={3} c="#3B82F6" style={{ opacity: 0.6 }} />
                    <B x={8} y={2} w={5} h={4} c="#10B981" style={{ opacity: 0.4 }} />
                    <B x={7} y={9} w={2} h={2} c="#374151" />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    <PixelCouch />
                    <PixelCoffeeTable />
                  </div>
                </div>

                {/* ZONE 2: Chill Corner — bean bags, bookshelf, vending machine */}
                <div style={{ background: "#0D0D1A44", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: "7px", color: "var(--mc-text6)", letterSpacing: "1px", marginBottom: 4 }}>📚 CHILL CORNER</div>
                  {/* Bookshelf */}
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <B x={0} y={0} w={14} h={7} c="#5C3D1E" r={1} />
                    <B x={1} y={1} w={3} h={2} c="#3B82F6" /><B x={5} y={1} w={4} h={2} c="#EC4899" /><B x={10} y={1} w={3} h={2} c="#F59E0B" />
                    <B x={1} y={4} w={4} h={2} c="#A855F7" /><B x={6} y={4} w={4} h={2} c="#10B981" /><B x={11} y={4} w={2} h={2} c="#8B6914" />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    <PixelBeanBag color="#EF444433" />
                    <PixelBeanBag color="#A855F733" />
                    {/* Vending machine */}
                    <div style={{ position: "relative", marginLeft: 8 }}>
                      <B x={0} y={0} w={6} h={10} c="#374151" r={1} />
                      <B x={1} y={1} w={4} h={4} c="#1E293B" />
                      <B x={2} y={2} w={1} h={1} c="#EF4444" /><B x={3} y={2} w={1} h={1} c="#3B82F6" />
                      <B x={2} y={3} w={1} h={1} c="#F59E0B" /><B x={3} y={3} w={1} h={1} c="#10B981" />
                      <B x={1} y={6} w={4} h={3} c="#111827" />
                      <B x={2} y={7} w={2} h={1} c="#6B7280" />
                    </div>
                  </div>
                </div>

                {/* ZONE 3: Game Corner — ping pong + water cooler */}
                <div style={{ background: "#0D0D1A44", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: "7px", color: "var(--mc-text6)", letterSpacing: "1px", marginBottom: 4 }}>🏓 GAME CORNER</div>
                  <PixelPingPong />
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 6 }}>
                    <PixelWaterCooler />
                    <div style={{ position: "relative", width: 10 * PX, height: 14 * PX }}><PixelPlant x={0} y={0} size="small" /></div>
                    {/* Scoreboard */}
                    <div style={{ position: "relative" }}>
                      <B x={0} y={0} w={8} h={5} c="#1F2937" r={1} />
                      <B x={1} y={1} w={3} h={3} c="#EF4444" style={{ opacity: 0.7 }} />
                      <B x={4} y={1} w={3} h={3} c="#3B82F6" style={{ opacity: 0.7 }} />
                      <B x={2} y={2} w={1} h={1} c="#FDE68A" />
                      <B x={5} y={2} w={1} h={1} c="#FDE68A" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Agents in lounge */}
              {agentsAt("lounge").length > 0 && (
                <div style={{ display: "flex", gap: 8, padding: "6px 8px", background: "var(--mc-card)", borderRadius: 8, border: "1px solid var(--mc-border2)", flexWrap: "wrap" }}>
                  {agentsAt("lounge").map(a => (
                    <div key={a.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <ChatBubble text={a.activities.lounge} color={a.color} />
                      <AgentSprite agentName={a.name} isWorking={false} animFrame={frame + agents.indexOf(a)} />
                      <div style={{ fontSize: "6px", color: a.color, fontWeight: 700 }}>{a.name}</div>
                    </div>
                  ))}
                  {agentsAt("watercooler").map(a => (
                    <div key={a.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <ChatBubble text={chatPhrases[a.name]?.[tick % (chatPhrases[a.name]?.length || 1)] || "..."} color={a.color} />
                      <AgentSprite agentName={a.name} isWorking={false} animFrame={frame + agents.indexOf(a)} />
                      <div style={{ fontSize: "6px", color: a.color, fontWeight: 700 }}>{a.name}</div>
                    </div>
                  ))}
                  {agentsAt("pingpong").map(a => (
                    <div key={a.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <AgentSprite agentName={a.name} isWorking={false} animFrame={frame} />
                      <div style={{ fontSize: "6px", color: a.color, fontWeight: 700 }}>{a.name} 🏓</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KITCHEN — cleaner layout */}
            <div style={{
              flex: "0 0 280px",
              background: "var(--mc-bg4)",
              border: "1px solid var(--mc-border)",
              borderTop: "none",
              borderLeft: "none",
              borderRadius: "0 0 10px 0",
              padding: "12px",
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: 10 }}>☕ KITCHEN &amp; PANTRY</div>
              {/* Appliances row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                <PixelFridge />
                <PixelCoffeeMachine />
                <PixelCabinets />
                <div style={{ position: "relative", width: 10 * PX, height: 14 * PX }}><PixelPlant x={0} y={0} size="small" /></div>
              </div>
              {/* Eating bar */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <div style={{ position: "relative" }}>
                  <B x={0} y={0} w={18} h={4} c="#5C3D1E" r={1} />
                  <B x={1} y={1} w={16} h={2} c="#7A5230" />
                  <B x={3} y={1} w={2} h={1} c="#E4E4E7" /><B x={8} y={1} w={2} h={1} c="#E4E4E7" /><B x={13} y={1} w={2} h={1} c="#E4E4E7" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ position: "relative" }}><B x={0} y={0} w={3} h={1} c="#4A4A5A" r={1} /><B x={1} y={1} w={1} h={3} c="#6B7280" /></div>)}
              </div>

              {/* Agents getting coffee */}
              {agentsAt("coffee").length > 0 && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, padding: "5px 8px", background: "var(--mc-card)", borderRadius: 8, border: "1px solid var(--mc-border2)", flexWrap: "wrap" }}>
                  {agentsAt("coffee").map(a => (
                    <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <AgentSprite agentName={a.name} isWorking={false} animFrame={frame + agents.indexOf(a)} />
                      <div>
                        <div style={{ fontSize: "7px", fontWeight: 700, color: a.color }}>{a.name}</div>
                        <div style={{ fontSize: "6px", color: "var(--mc-text4)" }}>☕ {a.activities.coffee}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ AGENT STATUS PANEL ═══ */}
      <div style={{ marginTop: 8, background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--mc-border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px" }}>⚔ AGENT STATUS PANEL</span>
          <span style={{ fontSize: "7px", color: "var(--mc-text5)" }}>{agents.filter(a => getAgentBehavior(a.name) === "desk").length} at desk · {agents.filter(a => getAgentBehavior(a.name) !== "desk").length} roaming</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 10px" }}>
          {agents.map(a => {
            const beh = getAgentBehavior(a.name);
            const isWorking = beh === "desk";
            const locEmoji = beh === "desk" ? "💻" : beh === "coffee" ? "☕" : beh === "conference" ? "🏛" : beh === "watercooler" ? "💧" : beh === "lounge" ? "🛋" : beh === "pingpong" ? "🏓" : "🚶";
            const activity = a.activities[beh] || "Idle...";
            return (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "var(--mc-card2)", border: `1px solid ${isWorking ? a.color + "33" : "var(--mc-border2)"}`, borderRadius: 6, minWidth: 130, flex: "1 1 130px", boxShadow: isWorking ? `0 0 8px ${a.color}15` : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isWorking ? "#10B981" : "#F59E0B", boxShadow: isWorking ? "0 0 6px #10B98166" : "none", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 8, color: a.color, fontWeight: 700 }}>{a.name}</span>
                    <span style={{ fontSize: 7 }}>{locEmoji}</span>
                  </div>
                  <div style={{ fontSize: 7, color: "var(--mc-text5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════════
   PROJECTS — Goals & Sprint Tracker
   ═══════════════════════════════════════════════════════════════════════════════
   🤖 OPENCLAW PROJECT SCHEMA:
   {
     id: number,           // Unique ID
     title: string,        // Project name
     type: string,         // "milestone" (big-picture) | "sprint" (tactical, time-bound)
     status: string,       // "active" | "completed" | "paused" | "planned"
     progress: number,     // 0-100. OpenClaw should dynamically update this based on sub-tasks.
     owner: string,        // Primary agent id responsible
     team: string[],       // Array of agent ids involved
     description: string,  // What this project is about
     startDate: string,    // ISO date "YYYY-MM-DD"
     targetDate: string,   // ISO date "YYYY-MM-DD" — deadline or target
     milestones: array,    // Sub-items: [{ text: string, done: boolean }]
     notes: string,        // Freeform context, blockers, updates
     risk: string,         // "low" | "medium" | "high" — current risk assessment
   }
   
   📌 PROGRESS UPDATES: OpenClaw should recalculate `progress` based on:
   - Completed milestones ratio
   - Subjective assessment of blockers/velocity
   - Progress can fluctuate DOWN if blockers emerge or scope changes
   
   📌 TO ADD PROJECT: Push new object to projects array
   📌 TO UPDATE PROGRESS: Modify `progress` number (0-100) and optionally `notes`
   ═══════════════════════════════════════════════════════════════════════════════ */
function ProjectsView() {
  const [projects, setProjects] = useState([
    // ── MILESTONES (big-picture goals) ──
    {
      id: 1, title: "Launch Siew's Capital MVP", type: "milestone", status: "active", progress: 42,
      owner: "jarvis", team: ["jarvis", "forge", "atlas", "scribe", "pixel"],
      description: "Get the core company operational — agents online, content publishing, basic analytics, and brand presence established.",
      startDate: "2026-02-25", targetDate: "2026-04-01",
      milestones: [
        { text: "All 7 active agents operational", done: true },
        { text: "OpenClaw gateway configured", done: true },
        { text: "Brand identity finalized", done: false },
        { text: "First 10 Twitter threads published", done: false },
        { text: "Discord community launched", done: false },
        { text: "Daily briefing automation live", done: false },
      ],
      notes: "On track. Gateway done, agents online. Brand and content pipeline need acceleration.",
      risk: "medium",
    },
    {
      id: 2, title: "Build Community to 1,000 Followers", type: "milestone", status: "active", progress: 8,
      owner: "scribe", team: ["scribe", "pixel", "echo"],
      description: "Grow Twitter/X following to 1K through consistent, high-quality content and engagement.",
      startDate: "2026-03-01", targetDate: "2026-06-01",
      milestones: [
        { text: "Content strategy finalized", done: true },
        { text: "First viral thread (100+ likes)", done: false },
        { text: "250 followers milestone", done: false },
        { text: "500 followers milestone", done: false },
        { text: "1,000 followers milestone", done: false },
      ],
      notes: "Just starting. Need to publish consistently and find a voice that resonates.",
      risk: "medium",
    },
    {
      id: 3, title: "Go Live with Trading Bot v1", type: "milestone", status: "planned", progress: 5,
      owner: "forge", team: ["forge", "trader", "shield", "atlas"],
      description: "Build, test, and deploy a spot-only trading bot with full risk management integration.",
      startDate: "2026-04-01", targetDate: "2026-07-01",
      milestones: [
        { text: "Bot architecture designed", done: true },
        { text: "Paper trading mode working", done: false },
        { text: "Risk integration with SHIELD", done: false },
        { text: "1 month paper trading without breakers", done: false },
        { text: "Live deployment with real capital", done: false },
      ],
      notes: "Phase 2 dependency — TRADER needs to come online first. FORGE has initial architecture.",
      risk: "high",
    },
    // ── SPRINTS (tactical, time-bound) ──
    {
      id: 4, title: "Sprint 1: Infrastructure & Foundation", type: "sprint", status: "active", progress: 75,
      owner: "forge", team: ["forge", "sentinel", "shield"],
      description: "Set up all core infrastructure — OpenClaw, Discord, bot tokens, risk configs, monitoring.",
      startDate: "2026-02-25", targetDate: "2026-03-07",
      milestones: [
        { text: "OpenClaw gateway on Mac Mini", done: true },
        { text: "Bot tokens for all agents", done: true },
        { text: "Discord server with channels", done: false },
        { text: "Risk parameter config", done: false },
        { text: "SENTINEL monitoring live", done: true },
      ],
      notes: "Almost done. Discord and risk config are the last two items.",
      risk: "low",
    },
    {
      id: 5, title: "Sprint 2: Content Engine", type: "sprint", status: "active", progress: 30,
      owner: "scribe", team: ["scribe", "pixel", "atlas"],
      description: "Establish the content production pipeline — templates, first posts, newsletter framework.",
      startDate: "2026-03-01", targetDate: "2026-03-14",
      milestones: [
        { text: "Launch announcement thread", done: false },
        { text: "Blog post template", done: false },
        { text: "Newsletter template", done: false },
        { text: "3 Twitter threads published", done: false },
        { text: "Brand graphics package", done: true },
      ],
      notes: "PIXEL finished graphics. SCRIBE drafting threads. Need Chairman review on launch thread.",
      risk: "low",
    },
    {
      id: 6, title: "Sprint 3: Research & Intelligence", type: "sprint", status: "planned", progress: 0,
      owner: "atlas", team: ["atlas", "shield"],
      description: "Set up automated research workflows — morning scans, whale alerts, macro digests.",
      startDate: "2026-03-15", targetDate: "2026-03-28",
      milestones: [
        { text: "Morning scan automation", done: false },
        { text: "On-chain whale alerting", done: false },
        { text: "Macro digest weekly report", done: false },
        { text: "AI token watchlist dashboard", done: false },
      ],
      notes: "Depends on Sprint 1 infrastructure being complete.",
      risk: "low",
    },
  ]);

  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all"); // all, milestone, sprint, active, completed

  const riskColors = { low: "#10B981", medium: "#F59E0B", high: "#EF4444" };
  const statusColors = { active: "#10B981", completed: "#3B82F6", paused: "#F59E0B", planned: "#71717A" };
  const statusLabels = { active: "ACTIVE", completed: "DONE", paused: "PAUSED", planned: "PLANNED" };

  const filtered = projects.filter(p => filter === "all" || p.type === filter || p.status === filter);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All", color: "var(--mc-text3)" },
          { id: "milestone", label: "🏔 Milestones", color: "#F59E0B" },
          { id: "sprint", label: "⚡ Sprints", color: "#3B82F6" },
          { id: "active", label: "Active", color: "#10B981" },
          { id: "planned", label: "Planned", color: "#71717A" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "5px 12px", background: filter === f.id ? (f.color.startsWith("var") ? "var(--mc-card2)" : f.color + "18") : "transparent", border: `1px solid ${filter === f.id ? (f.color.startsWith("var") ? "var(--mc-border3)" : f.color + "44") : "var(--mc-border2)"}`, borderRadius: "6px", color: filter === f.id ? f.color : "var(--mc-text5)", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{f.label}</button>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(p => {
          const owner = getAgent(p.owner);
          const isExp = expandedId === p.id;
          const completedMilestones = p.milestones.filter(m => m.done).length;
          return (
            <div key={p.id} onClick={() => setExpandedId(isExp ? null : p.id)} style={{ background: "var(--mc-card)", border: `1px solid ${isExp ? owner.color + "44" : "var(--mc-border2)"}`, borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "border-color 0.15s" }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "7px", fontWeight: 700, color: p.type === "milestone" ? "#F59E0B" : "#3B82F6", background: (p.type === "milestone" ? "#F59E0B" : "#3B82F6") + "15", padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{p.type === "milestone" ? "🏔 MILESTONE" : "⚡ SPRINT"}</span>
                    <span style={{ fontSize: "7px", fontWeight: 700, color: statusColors[p.status], background: statusColors[p.status] + "15", padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase" }}>{statusLabels[p.status]}</span>
                    <span style={{ fontSize: "7px", fontWeight: 700, color: riskColors[p.risk], background: riskColors[p.risk] + "15", padding: "2px 6px", borderRadius: "3px" }}>RISK: {p.risk.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--mc-text)" }}>{p.title}</div>
                </div>
                {/* Progress circle */}
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: `conic-gradient(${owner.color} ${p.progress * 3.6}deg, var(--mc-border2) ${p.progress * 3.6}deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--mc-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: owner.color }}>{p.progress}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: "4px", background: "var(--mc-border2)", borderRadius: "2px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${p.progress}%`, background: `linear-gradient(90deg, ${owner.color}88, ${owner.color})`, borderRadius: "2px", transition: "width 0.5s ease" }} />
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", fontSize: "9px", color: "var(--mc-text4)" }}>
                <span><span style={{ color: owner.color, fontWeight: 700 }}>{owner.name}</span> + {p.team.length - 1} agents</span>
                <span>{completedMilestones}/{p.milestones.length} milestones</span>
                <span>{p.startDate} → {p.targetDate}</span>
              </div>

              {/* Expanded content */}
              {isExp && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--mc-border3)" }}>
                  <p style={{ fontSize: "11px", color: "var(--mc-text2)", margin: "0 0 12px", lineHeight: 1.7, fontStyle: "italic" }}>{p.description}</p>

                  {/* Team avatars */}
                  <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
                    {p.team.map(t => {
                      const a = getAgent(t);
                      return <div key={t} style={{ width: "24px", height: "24px", borderRadius: "6px", background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: a.color }}>{a.initials}</div>;
                    })}
                  </div>

                  {/* Milestones checklist */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1px", marginBottom: "8px" }}>MILESTONES</div>
                    {p.milestones.map((m, i) => (
                      <div key={i} onClick={e => { e.stopPropagation(); setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, milestones: proj.milestones.map((ms, idx) => idx === i ? { ...ms, done: !ms.done } : ms), progress: Math.round(proj.milestones.map((ms, idx) => idx === i ? !ms.done : ms.done).filter(Boolean).length / proj.milestones.length * 100) } : proj)); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", border: `2px solid ${m.done ? "#10B981" : "var(--mc-border3)"}`, background: m.done ? "#10B98122" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#10B981", flexShrink: 0 }}>{m.done ? "✓" : ""}</div>
                        <span style={{ fontSize: "10px", color: m.done ? "var(--mc-text4)" : "var(--mc-text2)", textDecoration: m.done ? "line-through" : "none" }}>{m.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {p.notes && (
                    <div style={{ background: "var(--mc-card2)", borderRadius: "8px", padding: "10px", border: "1px solid var(--mc-border3)" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--mc-text5)", letterSpacing: "1px", marginBottom: "4px" }}>NOTES</div>
                      <div style={{ fontSize: "10px", color: "var(--mc-text2)", lineHeight: 1.6 }}>{p.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DOCS — Document Library
   ═══════════════════════════════════════════════════════════════════════════════
   🤖 OPENCLAW DOCUMENT SCHEMA:
   {
     id: number,           // Unique ID. Use Date.now() for new docs.
     title: string,        // Document title (searchable)
     type: string,         // One of: "strategy" | "newsletter" | "blog" | "research" | "briefing" | "report" | "template" | "proposal"
     author: string,       // Agent id who created it
     date: string,         // ISO date "YYYY-MM-DD" when created
     updated: string,      // ISO date "YYYY-MM-DD" when last modified (optional)
     summary: string,      // Short 1-2 sentence summary/preview
     content: string,      // Full document content (can be long)
     tags: string[],       // Array of lowercase tag strings (searchable)
     status: string,       // "draft" | "final" | "archived"
   }
   
   📌 TO ADD DOCUMENT: Push new object to docs array.
   📌 TO UPDATE: Change content/summary and set `updated` to today's date.
   📌 SEARCH: Searches title, summary, content, and tags fields.
   📌 TYPES: strategy (amber), newsletter (green), blog (pink), research (blue),
             briefing (purple), report (cyan), template (gray), proposal (orange)
   ═══════════════════════════════════════════════════════════════════════════════ */
function DocsView() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const [docs, setDocs] = useState([
    { id: 1, title: "Siew's Capital — Master Strategy Doc", type: "strategy", author: "jarvis", date: "2026-02-25", updated: "2026-03-01", summary: "The founding document. Vision, mission, competitive advantages, revenue model, and 12-month roadmap for Siew's Capital.", content: "Vision: Build the world's first AI-native investment company run by a solo human chairman with 10 AI agents...\n\nMission: Prove that a single person + AI agents can outperform traditional teams in research, content, and eventually trading.\n\nPhase 1 (Feb-Apr): Infrastructure, brand, content engine.\nPhase 2 (May-Jul): Trading bot, community growth.\nPhase 3 (Aug-Dec): Scale, monetize, open-source tools.", tags: ["vision", "strategy", "roadmap"], status: "final" },
    { id: 2, title: "Agent Architecture & Delegation Framework", type: "strategy", author: "jarvis", date: "2026-02-25", updated: "2026-02-28", summary: "How JARVIS delegates work to sub-agents, escalation paths, and the council advisory system.", content: "JARVIS receives all tasks from the Chairman and delegates based on agent specialization...\n\nDelegation rules:\n- Research queries → ATLAS\n- Code/build tasks → FORGE\n- Content creation → SCRIBE + PIXEL\n- Risk assessment → SHIELD\n- System issues → SENTINEL\n\nEscalation: If any agent fails 3 times → escalate to JARVIS → escalate to Chairman.", tags: ["architecture", "delegation", "agents"], status: "final" },
    { id: 3, title: "Risk Management Framework v1", type: "report", author: "shield", date: "2026-02-26", updated: null, summary: "Complete risk parameters, circuit breakers, position limits, and emergency procedures.", content: "Maximum daily loss: 5% of portfolio → automatic halt.\nMaximum single position: 5% of portfolio.\nMaximum leverage: 3x.\n3 consecutive losing trades → 24-hour trading pause.\n\nAgent error handling: 10 min self-debug → escalate to JARVIS → escalate to Chairman.\nKill-switch: SHIELD has authority to halt ALL trading immediately.", tags: ["risk", "trading", "safety"], status: "final" },
    { id: 4, title: "Weekly Market Recap #1 — Draft", type: "newsletter", author: "scribe", date: "2026-03-01", updated: "2026-03-02", summary: "First edition of the weekly newsletter covering BTC, ETH, AI tokens, and macro.", content: "This week in crypto:\n- BTC held $95K support, testing $98K resistance\n- ETH staking yields up 0.3%\n- FET and TAO leading AI token rally\n- Fed signaling patience on rate cuts\n\nSiew's Capital update:\n- 7 agents now operational\n- First research reports completed\n- Content engine launching next week", tags: ["newsletter", "market", "weekly"], status: "draft" },
    { id: 5, title: "AI Token Deep Dive: FET, TAO, RNDR", type: "research", author: "atlas", date: "2026-03-01", updated: null, summary: "Comprehensive analysis of top AI tokens by market cap, on-chain metrics, and growth catalysts.", content: "Fetch.ai (FET): MC $3.2B. Strong agent-to-agent protocol. Partnered with Ocean and SingularityNET.\n\nBittensor (TAO): MC $4.1B. Decentralized AI training. High validator rewards but centralization concerns.\n\nRender (RNDR): MC $2.8B. GPU rendering marketplace. Apple partnership rumors. Strong network growth.", tags: ["ai-tokens", "research", "crypto"], status: "final" },
    { id: 6, title: "JARVIS Daily Briefing — Mar 3, 2026", type: "briefing", author: "jarvis", date: "2026-03-03", updated: null, summary: "Today's briefing: market conditions, agent status, priority tasks, and upcoming deadlines.", content: "Good morning Chairman.\n\nMarket: BTC $96,400 (+1.2%). ETH $3,180 (+0.8%). Fear/Greed: 62 (Greed).\n\nAgent Status: 7/7 active agents online. 0 errors in last 24h.\n\nPriority today:\n1. Review SCRIBE's launch thread (in REVIEW)\n2. Finalize Discord channel structure\n3. ATLAS completing AI token research\n\nUpcoming: Sprint 1 deadline March 7.", tags: ["briefing", "daily", "market"], status: "final" },
    { id: 7, title: "Content Calendar Template", type: "template", author: "scribe", date: "2026-02-28", updated: null, summary: "Weekly content planning template with slots for Twitter, blog, newsletter, and graphics.", content: "Monday: Market recap thread (SCRIBE)\nTuesday: Educational blog post (SCRIBE + ATLAS)\nWednesday: AI industry analysis thread (SCRIBE)\nThursday: Infographic / visual (PIXEL)\nFriday: Newsletter edition (SCRIBE)\nWeekend: Community engagement + idea generation", tags: ["template", "content", "calendar"], status: "final" },
    { id: 8, title: "Partnership Outreach Proposal — Draft", type: "proposal", author: "closer", date: "2026-03-02", updated: null, summary: "Template for reaching out to crypto projects, AI companies, and potential partners.", content: "Subject: Collaboration Opportunity — Siew's Capital x [Partner]\n\nHi [Name],\n\nWe're Siew's Capital, an AI-first investment research company...\n\n[Template continues with value proposition, partnership ideas, and call to action]", tags: ["outreach", "partnerships", "template"], status: "draft" },
  ]);

  const typeConfig = {
    strategy: { color: "#F59E0B", icon: "📋" },
    newsletter: { color: "#10B981", icon: "📰" },
    blog: { color: "#EC4899", icon: "✍️" },
    research: { color: "#3B82F6", icon: "🔍" },
    briefing: { color: "#A855F7", icon: "📢" },
    report: { color: "#06B6D4", icon: "📊" },
    template: { color: "#71717A", icon: "📄" },
    proposal: { color: "#F97316", icon: "📧" },
  };
  const statusConfig = { draft: { color: "#F59E0B", label: "DRAFT" }, final: { color: "#10B981", label: "FINAL" }, archived: { color: "#71717A", label: "ARCHIVED" } };

  const filtered = docs.filter(d => (filterType === "all" || d.type === filterType) && (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.summary.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.includes(search.toLowerCase()))));

  return (
    <div>
      {/* Search + filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--mc-text5)" }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ width: "100%", padding: "10px 14px 10px 32px", background: "var(--mc-card2)", border: "1px solid var(--mc-border3)", borderRadius: "8px", color: "var(--mc-text)", fontSize: "12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Type filter pills */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("all")} style={{ padding: "5px 10px", background: filterType === "all" ? "var(--mc-card2)" : "transparent", border: `1px solid ${filterType === "all" ? "var(--mc-border3)" : "var(--mc-border2)"}`, borderRadius: "5px", color: filterType === "all" ? "var(--mc-text3)" : "var(--mc-text5)", fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ALL</button>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterType(key)} style={{ padding: "5px 10px", background: filterType === key ? cfg.color + "18" : "transparent", border: `1px solid ${filterType === key ? cfg.color + "44" : "var(--mc-border2)"}`, borderRadius: "5px", color: filterType === key ? cfg.color : "var(--mc-text5)", fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cfg.icon} {key}</button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: "9px", color: "var(--mc-text5)", marginBottom: "10px" }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</div>

      {/* Document cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(d => {
          const author = getAgent(d.author);
          const tc = typeConfig[d.type] || { color: "#71717A", icon: "📄" };
          const sc = statusConfig[d.status] || statusConfig.draft;
          const isExp = expandedId === d.id;
          return (
            <div key={d.id} onClick={() => setExpandedId(isExp ? null : d.id)} style={{ background: "var(--mc-card)", borderLeft: `3px solid ${tc.color}`, border: `1px solid ${isExp ? tc.color + "44" : "var(--mc-border2)"}`, borderLeftWidth: "3px", borderLeftColor: tc.color, borderRadius: "10px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "7px", fontWeight: 700, color: tc.color, background: tc.color + "15", padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tc.icon} {d.type}</span>
                    <span style={{ fontSize: "7px", fontWeight: 700, color: sc.color, background: sc.color + "15", padding: "2px 6px", borderRadius: "3px" }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mc-text)", marginBottom: "4px" }}>{d.title}</div>
                  <div style={{ fontSize: "10px", color: "var(--mc-text3)", lineHeight: 1.5 }}>{d.summary}</div>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "8px", color: author.color, fontWeight: 700 }}>{author.name}</span>
                <span style={{ fontSize: "7px", color: "var(--mc-text5)" }}>Created {d.date}</span>
                {d.updated && <span style={{ fontSize: "7px", color: "#10B981", background: "#10B98115", padding: "1px 4px", borderRadius: "3px" }}>Updated {d.updated}</span>}
                <div style={{ display: "flex", gap: "3px", marginLeft: "auto" }}>
                  {d.tags.map(t => <span key={t} style={{ fontSize: "7px", color: "var(--mc-text5)", background: "var(--mc-border)", padding: "1px 5px", borderRadius: "3px" }}>{t}</span>)}
                </div>
              </div>

              {/* Expanded: full content */}
              {isExp && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--mc-border3)" }}>
                  <div style={{ fontSize: "10px", color: "var(--mc-text2)", lineHeight: 1.8, whiteSpace: "pre-line" }}>{d.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Homepage({ onNavigate, dm }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 5000); return () => clearInterval(t); }, []);

  const activeAgents = AGENTS.filter(a => !["trader", "echo", "closer"].includes(a.id));
  const standbyAgents = AGENTS.filter(a => ["trader", "echo", "closer"].includes(a.id));

  const taskStats = { backlog: 2, todo: 4, inProgress: 3, done: 2 };
  const contentStats = { idea: 4, script: 2, design: 1, review: 1, published: 0 };

  const recentActivity = [
    { time: "2 min ago", agent: "atlas", action: "Completed morning market scan", type: "task", color: "#10B981" },
    { time: "5 min ago", agent: "forge", action: "Deployed automation script v1.2", type: "deploy", color: "#3B82F6" },
    { time: "12 min ago", agent: "shield", action: "Risk check passed — all within limits", type: "risk", color: "#10B981" },
    { time: "18 min ago", agent: "scribe", action: "Submitted Twitter thread for review", type: "content", color: "#EC4899" },
    { time: "25 min ago", agent: "sentinel", action: "All agents healthy — 100% uptime", type: "health", color: "#10B981" },
    { time: "1 hr ago", agent: "atlas", action: "Whale alert: 500 BTC moved to Coinbase", type: "alert", color: "#F59E0B" },
    { time: "2 hr ago", agent: "jarvis", action: "Daily briefing compiled and delivered", type: "briefing", color: "#3B82F6" },
  ];

  const notifications = [
    { id: 1, type: "approval", priority: "high", msg: "SCRIBE needs approval on launch thread", agent: "scribe", time: "3 min ago", icon: "✅" },
    { id: 2, type: "alert", priority: "medium", msg: "BTC dropped 2.3% in last hour", agent: "atlas", time: "8 min ago", icon: "⚠️" },
    { id: 3, type: "task", priority: "low", msg: "FORGE completed API integration setup", agent: "forge", time: "15 min ago", icon: "🔧" },
    { id: 4, type: "health", priority: "low", msg: "All systems operational — 0 errors", agent: "sentinel", time: "20 min ago", icon: "💚" },
  ];

  const StatCard = ({ label, value, sub, color, onClick }) => (
    <div onClick={onClick} style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px", cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s", flex: "1 1 140px", minWidth: "140px" }}>
      <div style={{ fontSize: "9px", color: "var(--mc-text4)", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: color || "var(--mc-text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "9px", color: "var(--mc-text5)", marginTop: "6px" }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", color: "var(--mc-text4)" }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, Chairman.</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        <StatCard label="AGENTS ONLINE" value={activeAgents.length} sub={`${standbyAgents.length} standby`} color="#10B981" />
        <StatCard label="TASKS IN PROGRESS" value={taskStats.inProgress} sub={`${taskStats.todo} queued · ${taskStats.done} done`} color="#3B82F6" onClick={() => onNavigate("tasks")} />
        <StatCard label="CONTENT TASKS" value={contentStats.idea + contentStats.script + contentStats.design + contentStats.review} sub={`${contentStats.review} in review`} color="#EC4899" onClick={() => onNavigate("tasks")} />
        <StatCard label="RISK STATUS" value="OK" sub="All within limits" color="#10B981" />
        <StatCard label="SYSTEM HEALTH" value="100%" sub="0 errors today" color="#10B981" />
      </div>

      {/* Two-column: Activity + Notifications */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Recent Activity */}
        <div style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px", minWidth: 0 }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: "12px" }}>RECENT ACTIVITY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentActivity.map((item, i) => {
              const agent = getAgent(item.agent);
              return (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.color, marginTop: "5px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "10px", color: "var(--mc-text2)", lineHeight: 1.5 }}><span style={{ color: agent.color, fontWeight: 700 }}>{agent.name}</span> — {item.action}</div>
                    <div style={{ fontSize: "8px", color: "var(--mc-text5)" }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px", minWidth: 0 }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: "12px" }}>NOTIFICATIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {notifications.map(n => {
              const agent = getAgent(n.agent);
              const pColor = n.priority === "high" ? "#EF4444" : n.priority === "medium" ? "#F59E0B" : "#3F3F46";
              return (
                <div key={n.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px", background: "var(--mc-card2)", borderRadius: "8px", border: `1px solid ${n.priority === "high" ? "#EF444422" : "#1E1E28"}` }}>
                  <span style={{ fontSize: "12px", flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "10px", color: "var(--mc-text)", lineHeight: 1.5 }}>{n.msg}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "8px", color: agent.color, fontWeight: 700 }}>{agent.name}</span>
                      <span style={{ fontSize: "8px", color: "var(--mc-text5)" }}>{n.time}</span>
                      <span style={{ fontSize: "7px", fontWeight: 700, color: pColor, background: pColor + "15", padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase" }}>{n.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Status Strip */}
      <div style={{ marginTop: "16px", background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "14px 16px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: "10px" }}>AGENT STATUS</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {AGENTS.map(a => {
            const isStandby = ["trader", "echo", "closer"].includes(a.id);
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "var(--mc-card2)", border: "1px solid var(--mc-border2)", borderRadius: "6px", opacity: isStandby ? 0.4 : 1 }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isStandby ? "#F59E0B" : "#10B981", boxShadow: !isStandby ? "0 0 4px #10B98166" : "none" }} />
                <div style={{ width: "22px", height: "22px", borderRadius: "5px", background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: a.color }}>{a.initials}</div>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--mc-text)" }}>{a.name}</div>
                  <div style={{ fontSize: "7px", color: "var(--mc-text4)" }}>{a.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Nav */}
      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { label: "View Tasks", icon: "📋", target: "tasks" },
          { label: "View Calendar", icon: "📅", target: "calendar" },
          { label: "Today's Schedule", icon: "📅", target: "calendar" },
          { label: "View Office", icon: "🕹", target: "office" },
        ].map(q => (
          <button key={q.target} onClick={() => onNavigate(q.target)} style={{ padding: "8px 14px", background: "var(--mc-card2)", border: "1px solid var(--mc-border2)", borderRadius: "8px", color: "var(--mc-text3)", fontSize: "10px", fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{q.icon}</span> {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   ANALYTICS DASHBOARD
   ───────────────────────────────────── */
function AnalyticsView() {
  const agentPerformance = [
    { id: "jarvis", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "atlas", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "forge", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "scribe", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "pixel", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "shield", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
    { id: "sentinel", tasksCompleted: 0, avgTime: "0h", uptime: "100%", rating: 0 },
  ];

  const weeklyData = [
    { day: "Mon", tasks: 0, content: 0 },
    { day: "Tue", tasks: 0, content: 0 },
    { day: "Wed", tasks: 0, content: 0 },
    { day: "Thu", tasks: 0, content: 0 },
    { day: "Fri", tasks: 0, content: 0 },
    { day: "Sat", tasks: 0, content: 0 },
    { day: "Sun", tasks: 0, content: 0 },
  ];
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));

  return (
    <div>
      {/* Top Stats */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        {[
          { label: "TOTAL TASKS COMPLETED", value: "0", color: "#10B981" },
          { label: "AVG COMPLETION TIME", value: "0h", color: "#3B82F6" },
          { label: "SYSTEM UPTIME", value: "100%", color: "#10B981" },
          { label: "CONTENT PUBLISHED", value: "0", color: "#EC4899" },
          { label: "API CALLS TODAY", value: "0", color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ flex: "1 1 140px", background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "14px" }}>
            <div style={{ fontSize: "8px", color: "var(--mc-text4)", letterSpacing: "1px", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly Chart (simple bar chart) */}
      <div style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: "16px" }}>WEEKLY TASK VOLUME</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "100px" }}>
          {weeklyData.map(d => (
            <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ fontSize: "8px", color: "var(--mc-text4)" }}>{d.tasks}</div>
              <div style={{ width: "100%", height: `${(d.tasks / maxTasks) * 80}px`, background: "linear-gradient(180deg, #3B82F6, #3B82F644)", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
              <div style={{ fontSize: "8px", color: "var(--mc-text5)", fontWeight: 600 }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance Table */}
      <div style={{ background: "var(--mc-card)", border: "1px solid var(--mc-border2)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text4)", letterSpacing: "1.5px", marginBottom: "14px" }}>AGENT PERFORMANCE</div>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px", padding: "0 8px" }}>
          {["AGENT", "TASKS", "AVG TIME", "UPTIME", "RATING"].map(h => (
            <div key={h} style={{ fontSize: "8px", color: "var(--mc-text5)", fontWeight: 700, letterSpacing: "1px" }}>{h}</div>
          ))}
        </div>
        {/* Rows */}
        {agentPerformance.map(ap => {
          const agent = getAgent(ap.id);
          return (
            <div key={ap.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "8px", background: "var(--mc-card2)", borderRadius: "6px", marginBottom: "4px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: agent.color }}>{agent.initials}</div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--mc-text)" }}>{agent.name}</span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--mc-text2)" }}>{ap.tasksCompleted}</span>
              <span style={{ fontSize: "10px", color: "var(--mc-text2)" }}>{ap.avgTime}</span>
              <span style={{ fontSize: "10px", color: ap.uptime === "100%" ? "#10B981" : "#F59E0B" }}>{ap.uptime}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 700 }}>{ap.rating}</span>
                <span style={{ fontSize: "8px", color: "#F59E0B" }}>★</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function MissionControl() {
  const [activeView, setActiveViewState] = useState("home");
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved view from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      const savedView = await getSetting('active_view');
      if (savedView) setActiveViewState(savedView);
      setIsLoading(false);
    };
    loadSettings();
  }, []);
  
  // Save view when it changes
  const setActiveView = (view) => {
    setActiveViewState(view);
    saveSetting('active_view', view);
  };

  const dm = darkMode;

  const views = [
    { id: "home", label: "Home", icon: "🏠", component: () => <Homepage onNavigate={setActiveView} dm={dm} /> },
    { id: "tasks", label: "Tasks", icon: "📋", component: TasksBoard },
    { id: "projects", label: "Projects", icon: "🚀", component: ProjectsView },
    { id: "calendar", label: "Calendar", icon: "📅", component: CalendarView },
    { id: "memory", label: "Memory", icon: "🧠", component: MemoryView },
    { id: "docs", label: "Docs", icon: "📄", component: DocsView },
    { id: "team", label: "Team", icon: "👥", component: TeamView },
    { id: "org", label: "Org Chart", icon: "🏛", component: OrgHierarchy },
    { id: "analytics", label: "Analytics", icon: "📊", component: AnalyticsView },
    { id: "office", label: "Office", icon: "🕹", component: OfficeView },
  ];
  const ActiveComponent = views.find(v => v.id === activeView)?.component;

  // CSS custom properties for theming
  const cssVars = dm ? {
    "--mc-bg": "#09090F", "--mc-bg2": "#0C0C12", "--mc-bg3": "#111118", "--mc-bg4": "#0D0D1A",
    "--mc-text": "#E4E4E7", "--mc-text2": "#A1A1AA", "--mc-text3": "#71717A", "--mc-text4": "#52525B", "--mc-text5": "#3F3F46", "--mc-text6": "#27272F",
    "--mc-border": "#1A1A22", "--mc-border2": "#1E1E28", "--mc-border3": "#27272F",
    "--mc-input": "#111118", "--mc-card": "#0C0C12", "--mc-card2": "#111118",
    "--mc-header": "linear-gradient(180deg, #0F0F14 0%, #09090F 100%)",
  } : {
    "--mc-bg": "#F5F5F5", "--mc-bg2": "#FFFFFF", "--mc-bg3": "#F0F0F4", "--mc-bg4": "#E8E8F0",
    "--mc-text": "#1A1A2E", "--mc-text2": "#3A3A4E", "--mc-text3": "#5A5A6E", "--mc-text4": "#71717A", "--mc-text5": "#8A8A9A", "--mc-text6": "#C0C0CC",
    "--mc-border": "#D4D4DE", "--mc-border2": "#C8C8D4", "--mc-border3": "#BCBCC8",
    "--mc-input": "#FFFFFF", "--mc-card": "#FFFFFF", "--mc-card2": "#F5F5FA",
    "--mc-header": "linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)",
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: dm ? "#09090F" : "#F5F5F5", color: dm ? "#E4E4E7" : "#1A1A2E", fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Loading Mission Control...</div>
          <div style={{ fontSize: "10px", color: "#71717A" }}>Reading from IndexedDB</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: dm ? "#09090F" : "#F5F5F5", color: dm ? "#E4E4E7" : "#1A1A2E", fontFamily: "'IBM Plex Mono', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace", transition: "background 0.3s, color 0.3s", ...cssVars }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${dm ? "#1A1A22" : "#D4D4DE"}`, background: dm ? "linear-gradient(180deg, #0F0F14, #09090F)" : "linear-gradient(180deg, #FFF, #F5F5F5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B98166" }} />
              <span style={{ fontSize: "16px", fontWeight: 800, background: "linear-gradient(135deg, #F59E0B, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Siew's Capital</span>
            </div>
            <div style={{ fontSize: "9px", color: dm ? "#3F3F46" : "#8A8A9A", marginTop: "3px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Mission Control · Chairman: Brayden Siew</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ padding: "4px 10px", background: dm ? "#1A1A22" : "#E4E4E7", border: `1px solid ${dm ? "#27272F" : "#D4D4DE"}`, borderRadius: "6px", color: dm ? "#E4E4E7" : "#1A1A2E", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
              {dm ? "☀️" : "🌙"}
            </button>
            <ClockDisplay dm={dm} />
          </div>
        </div>
      </div>
      {/* Nav */}
      <div style={{ display: "flex", borderBottom: `1px solid ${dm ? "#1A1A22" : "#D4D4DE"}`, padding: "0 12px", overflowX: "auto", background: dm ? "transparent" : "#FAFAFA" }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{ padding: "12px 14px", background: "none", border: "none", borderBottom: activeView === v.id ? "2px solid #F59E0B" : "2px solid transparent", color: activeView === v.id ? "#F59E0B" : dm ? "#3F3F46" : "#8A8A9A", fontSize: "11px", fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", fontWeight: activeView === v.id ? 700 : 400 }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: dm ? "#E4E4E7" : "#1A1A2E", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          {views.find(v => v.id === activeView)?.icon} {views.find(v => v.id === activeView)?.label}
        </h2>
        <ErrorBoundary key={activeView}>
          {ActiveComponent && <ActiveComponent />}
        </ErrorBoundary>
      </div>
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${dm ? "#1A1A22" : "#D4D4DE"}`, textAlign: "center" }}>
        <span style={{ fontSize: "8px", color: dm ? "#1E1E28" : "#D4D4D8" }}>Siew's Capital · Mission Control v2.0 · Powered by OpenClaw</span>
      </div>
    </div>
  );
}
