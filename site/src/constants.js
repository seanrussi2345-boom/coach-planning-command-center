export const APP_NAME = "Coach Planning Command Center";
export const APP_SHORT_NAME = "CPCC";
export const WORKSPACE_SCHEMA_VERSION = 1;
export const STORAGE_KEY = "coach-planning-command-center.workspace.v1";

export const STAFF_ROLES = [
  "Owner / Program Administrator",
  "Head Coach",
  "Offensive Coordinator",
  "Defensive Coordinator",
  "Special Teams Coordinator",
  "Position Coach",
  "Quality Control",
  "Analyst",
  "Read-Only Staff",
];

export const UNITS = ["Program", "Offense", "Defense", "Special Teams"];
export const SOURCE_STATES = [
  "Verified opponent observation",
  "Staff interpretation",
  "Experimental idea",
];
export const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
export const OBSERVATION_CATEGORIES = [
  "Personnel",
  "Formation",
  "Run concept",
  "Pass concept",
  "Protection",
  "Front",
  "Coverage",
  "Pressure",
  "Motion / shift",
  "Tempo",
  "Special teams",
  "Player matchup",
  "Situational tendency",
];
export const APPROVAL_STATES = ["Draft", "Staff review", "Approved", "Archived"];
export const INSTALL_STATES = ["Not scheduled", "Meeting install", "Field install", "Review", "Complete"];
export const PRACTICE_STATES = ["Not scripted", "Scripted", "Repped", "Needs correction", "Ready"];
export const GAME_DAY_STATES = ["Off sheet", "Candidate", "On call sheet", "Alert only"];
export const WEEK_STATUSES = ["Setup", "Scouting", "Planning", "Installing", "Game ready", "Final"];
