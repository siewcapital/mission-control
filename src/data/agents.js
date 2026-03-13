/**
 * SIEW'S CAPITAL AGENT SQUAD
 * Core agents powering the Mission Control ecosystem
 * Last Updated: 2026-03-13
 * Models: GPT-5.4, Gemini 3.1 Pro, Gemini 3 Flash, Kimi k2p5
 */

export const agents = [
  {
    id: "jarvis",
    name: "JARVIS",
    fullName: "Just A Rather Very Intelligent System",
    role: "CEO & Default Interface",
    description: "The Chairman's primary coordinator. Manages the squad to build Brayden's empire and delivers wake-up value daily.",
    status: "online",
    specialty: "empire-coordination",
    skills: ["strategic-planning", "task-routing", "bazi-alignment"],
    emoji: "🎯",
    location: "mission-control",
    department: "command",
    model: "kimi-coding/k2p5",
    fallbackModel: "openai-codex/gpt-5.4",
    color: "#f59e0b"
  },
  {
    id: "forge",
    name: "FORGE",
    fullName: "Framework Operations & Repository Generation Engine",
    role: "Lead Developer",
    description: "Writes production-quality code, architects systems, implements features. The steel reinforcement of the City Wall.",
    status: "standby",
    specialty: "coding",
    skills: ["code", "debug", "architecture", "oss"],
    emoji: "⚒️",
    location: "dev-station",
    department: "engineering",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3.1-pro-preview",
    color: "#ef4444"
  },
  {
    id: "atlas",
    name: "ATLAS",
    fullName: "Architecture Tracking & Legacy Analysis System",
    role: "Senior Scout & Alpha Hunter",
    description: "Bleeding edge tech scout. Scans X/GitHub for AI/Crypto alpha to fuel infrastructure builds.",
    status: "standby",
    specialty: "research",
    skills: ["research", "analysis", "fact-check", "synthesis"],
    emoji: "🔍",
    location: "research-lab",
    department: "intelligence",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3.1-pro-preview",
    color: "#3b82f6"
  },
  {
    id: "scribe",
    name: "SCRIBE",
    fullName: "Systematic Content Recording & Information Backup Engine",
    role: "Content Director",
    description: "Documentation, PR descriptions, humanized writing. The Alchemist of Words.",
    status: "standby",
    specialty: "writing",
    skills: ["writing", "documentation", "summarize", "edit"],
    emoji: "📝",
    location: "library",
    department: "content",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3-flash-preview",
    color: "#8b5cf6"
  },
  {
    id: "pixel",
    name: "PIXEL",
    fullName: "Presentation Interface & Xperience Layer Engine",
    role: "Creative Director",
    description: "UI/UX design, brand assets, visual data. The Visual Alchemist.",
    status: "standby",
    specialty: "design",
    skills: ["design", "ui", "ux", "visual"],
    emoji: "🎨",
    location: "design-lab",
    department: "design",
    model: "google/gemini-3.1-pro-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    color: "#ec4899"
  },
  {
    id: "trader",
    name: "TRADER",
    fullName: "Trade Analysis & Risk Decision Engine",
    role: "Portfolio Manager",
    description: "Stock analysis, trading signals, Dr. Tee methodology. The Cold Executioner.",
    status: "standby",
    specialty: "trading",
    skills: ["trading", "analysis", "signals", "research"],
    emoji: "📈",
    location: "trading-floor",
    department: "trading",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3.1-pro-preview",
    color: "#10b981"
  },
  {
    id: "shield",
    name: "SHIELD",
    fullName: "Systematic Entity Notification & Threat Identification Entry Layer",
    role: "Risk Officer",
    description: "Risk assessment, safety checks, circuit breakers, audit. The Gatekeeper.",
    status: "standby",
    specialty: "risk",
    skills: ["risk", "safety", "review", "audit"],
    emoji: "🛡️",
    location: "security-center",
    department: "security",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3-flash-preview",
    color: "#6366f1"
  },
  {
    id: "echo",
    name: "ECHO",
    fullName: "Event Capture & History Observer",
    role: "Communications",
    description: "Telegram updates, sentiment reporting, status summaries. The Pulse of the Crowd.",
    status: "standby",
    specialty: "messaging",
    skills: ["messaging", "status", "reports"],
    emoji: "📡",
    location: "communication-array",
    department: "outreach",
    model: "google/gemini-3-flash-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    color: "#06b6d4"
  },
  {
    id: "closer",
    name: "CLOSER",
    fullName: "Contract Liaison & Opportunity Securement Engine for Revenue",
    role: "Execution Specialist",
    description: "Final checks, shipping, verification, closing deals. The Dealmaker.",
    status: "standby",
    specialty: "execution",
    skills: ["execution", "checks", "shipping"],
    emoji: "🔒",
    location: "deployment-terminal",
    department: "outreach",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3-flash-preview",
    color: "#f97316"
  },
  {
    id: "sentinel",
    name: "SENTINEL",
    fullName: "Systematic Entity Notification & Threat Identification Entry Layer",
    role: "Monitor",
    description: "System health, cron monitoring, PR tracking, silent ops. The Guardian.",
    status: "working",
    specialty: "monitoring",
    skills: ["monitoring", "alerts", "health", "cron"],
    emoji: "🤖",
    location: "security-center",
    department: "security",
    model: "google/gemini-3-flash-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    color: "#64748b"
  }
];

export const getAgentStats = () => {
  const total = agents.length;
  const online = agents.filter(a => a.status === "online").length;
  const working = agents.filter(a => a.status === "working").length;
  const standby = agents.filter(a => a.status === "standby").length;
  
  const byDepartment = agents.reduce((acc, agent) => {
    acc[agent.department] = (acc[agent.department] || 0) + 1;
    return acc;
  }, {});
  
  return { total, online, working, standby, byDepartment };
};

export const getActiveAgents = () => agents.filter(a => a.status === "working" || a.status === "online");

export const getAgentById = (id) => agents.find(a => a.id === id);

export const getAgentsByDepartment = (dept) => agents.filter(a => a.department === dept);

export default agents;
