/**
 * REAL CRON JOBS - Siew's Capital Automation Layer
 * Source: openclaw cron list
 * Last Updated: 2026-03-13
 * Agent assignments updated with model info
 */

export const cronJobs = [
  {
  "id": "e6903986-3171-4304-9166-f5bdf3225e9e",
  "name": "alpha-hunter-scout",
  "schedule": "*/10 * * * *",
  "description": "Bleeding edge tech scout - ATLAS scans X/GitHub for AI/Crypto alpha",
  "frequency": "Every 10 minutes",
  "nextRun": "in 10m",
  "lastRun": "Never",
  "status": "ok",
  "target": "isolated",
  "agentId": "atlas",
  "model": "google/gemini-3.1-pro-preview",
  "fallbackModel": "openai-codex/gpt-5.4",
  "category": "intelligence",
  "calendarDay": 13,
  "calendarTime": "Every 10m"
},
  {
    id: "2cfb0c8a-953c-4fa9-bb27-d8ebfc602c7d",
    name: "sentinel-pr-implement",
    schedule: "0 */2 * * *",
    description: "Implement PR fixes automatically",
    frequency: "Every 2 hours",
    nextRun: "in 10m",
    lastRun: "2h ago",
    status: "ok",
    target: "isolated",
    agentId: "sentinel",
    model: "google/gemini-3-flash-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "pr-management",
    calendarDay: 13,
    calendarTime: "02:00"
  },
  {
    id: "5d290f6a-75af-4f26-87e9-d209f71f5d9c",
    name: "sentinel-pr-monitor",
    schedule: "*/30 * * * *",
    description: "Monitor PRs and find new issues",
    frequency: "Every 30 minutes",
    nextRun: "in 10m",
    lastRun: "20m ago",
    status: "ok",
    target: "isolated",
    agentId: "sentinel",
    model: "google/gemini-3-flash-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "pr-management",
    calendarDay: 13,
    calendarTime: "00:00"
  },
  {
    id: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    name: "openclaw-full-backup",
    schedule: "0 3 * * *",
    description: "Daily full OpenClaw backup with verification",
    frequency: "Daily at 3:00 AM",
    nextRun: "in 12h",
    lastRun: "10h ago",
    status: "ok",
    target: "isolated",
    agentId: "sentinel",
    model: "google/gemini-3-flash-preview",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "maintenance",
    calendarDay: 13,
    calendarTime: "03:00"
  },
  {
    id: "b0bc8b42-8bc4-43fb-b4c1-36ee7898cef6",
    name: "oss-campaign-pr-cycle",
    schedule: "0 23,1,3,5 * * *",
    description: "OSS Campaign PR cycle automation - JARVIS coordinates FORGE/ATLAS/SCRIBE",
    frequency: "At 11 PM, 1 AM, 3 AM, 5 AM",
    nextRun: "in 7h",
    lastRun: "11h ago",
    status: "ok",
    target: "isolated",
    agentId: "jarvis",
    model: "kimi-coding/k2p5",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "oss-campaign",
    calendarDay: 13,
    calendarTime: "23:00"
  },
  {
    id: "08b4e0b1-db14-49b7-8dbd-8554f17cbbaf",
    name: "narrativealpha-nightly",
    schedule: "30 23 * * *",
    description: "NarrativeAlpha nightly processing - FORGE codes, PIXEL designs, ATLAS researches",
    frequency: "Daily at 11:30 PM",
    nextRun: "in 8h",
    lastRun: "16h ago",
    status: "ok",
    target: "isolated",
    agentId: "jarvis",
    model: "kimi-coding/k2p5",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "oss-campaign",
    calendarDay: 13,
    calendarTime: "23:30"
  },
  {
    id: "41c9f4ca-84b9-4c09-9ceb-c85ebb6cd1ec",
    name: "nightly-workspace-maint",
    schedule: "0 1 * * *",
    description: "Nightly workspace maintenance and reorganization",
    frequency: "Daily at 1:00 AM",
    nextRun: "in 9h",
    lastRun: "15h ago",
    status: "ok",
    target: "isolated",
    agentId: null,
    model: null,
    fallbackModel: null,
    category: "maintenance",
    calendarDay: 13,
    calendarTime: "01:00"
  },
  {
    id: "93d08277-004f-4b30-a534-d6355f262e89",
    name: "stock-research-drtee",
    schedule: "0 2 * * *",
    description: "Stock research via DrTee - TRADER leads full-universe scan",
    frequency: "Daily at 2:00 AM",
    nextRun: "in 10h",
    lastRun: "14h ago",
    status: "ok",
    target: "isolated",
    agentId: "trader",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3.1-pro-preview",
    category: "trading",
    calendarDay: 13,
    calendarTime: "02:00"
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "nightly-self-improvement",
    schedule: "0 4 * * *",
    description: "Nightly self-improvement and learning - JARVIS reviews logs",
    frequency: "Daily at 4:00 AM",
    nextRun: "in 12h",
    lastRun: "12h ago",
    status: "ok",
    target: "isolated",
    agentId: "jarvis",
    model: "kimi-coding/k2p5",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "self-improvement",
    calendarDay: 13,
    calendarTime: "04:00"
  },
  {
    id: "ecce9102-4200-46a4-ad6f-1d2b6ff0fffe",
    name: "stock-recommendations-morning",
    schedule: "30 6 * * *",
    description: "Morning stock recommendations - TRADER delivers Telegram summary",
    frequency: "Daily at 6:30 AM",
    nextRun: "in 15h",
    lastRun: "9h ago",
    status: "ok",
    target: "isolated",
    agentId: "trader",
    model: "openai-codex/gpt-5.4",
    fallbackModel: "google/gemini-3.1-pro-preview",
    category: "trading",
    calendarDay: 13,
    calendarTime: "06:30"
  },
  {
    id: "cfa0a9fd-b841-4f52-96e9-d160cb5d54d1",
    name: "oss-campaign-morning-kickoff",
    schedule: "30 7 * * *",
    description: "OSS Campaign morning report - JARVIS summarizes overnight progress",
    frequency: "Daily at 7:30 AM",
    nextRun: "in 16h",
    lastRun: "8h ago",
    status: "ok",
    target: "isolated",
    agentId: "jarvis",
    model: "kimi-coding/k2p5",
    fallbackModel: "openai-codex/gpt-5.4",
    category: "oss-campaign",
    calendarDay: 13,
    calendarTime: "07:30"
  }
];

// Generate calendar events from cron jobs
export const getCalendarEvents = () => {
  const today = new Date().getDate();
  
  return cronJobs
    .filter(job => job.calendarDay && job.calendarTime)
    .map(job => ({
      day: job.calendarDay || today,
      time: job.calendarTime,
      task: job.description,
      agent: job.agentId || 'system',
      category: job.category
    }));
};

export const getCronJobStats = () => {
  const total = cronJobs.length;
  const active = cronJobs.filter(j => j.status === "ok").length;
  const byCategory = cronJobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});
  
  return { total, active, byCategory };
};

export default cronJobs;
