/**
 * SIEW'S CAPITAL - MISSION CONTROL DATA LAYER
 * Real data integration for the Mission Control dashboard
 * 
 * This module exports real data from:
 * - Cron jobs (openclaw cron list)
 * - GitHub repositories (gh repo list)
 * - Agent squad definitions
 */

export { default as cronJobs, getCronJobStats } from './cronJobs';
export { default as projects, getProjectStats } from './projects';
export { 
  default as agents, 
  getAgentStats, 
  getActiveAgents, 
  getAgentById, 
  getAgentsByDepartment 
} from './agents';

// Convenience exports for quick access
export { default as data } from './cronJobs';
export { default as repos } from './projects';
export { default as squad } from './agents';
