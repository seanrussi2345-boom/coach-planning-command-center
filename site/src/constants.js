export const APP_NAME = "Three Phase HQ";
export const APP_SHORT_NAME = "3PHQ";
export const APP_TAGLINE = "One Staff. Three Phases. One Plan.";
export const WORKSPACE_SCHEMA_VERSION = 2;
export const STORAGE_KEY = "three-phase-hq.workspace.v2";
export const LEGACY_STORAGE_KEY = "coach-planning-command-center.workspace.v1";

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
export const PLAYER_STATUSES = ["Available", "Limited", "Injured", "Inactive"];
export const GRADES = ["8", "9", "10", "11", "12", "FR", "SO", "JR", "SR"];

export const DEFAULT_POSITIONS = [
  ["QB", "Quarterback", "Offense", "Quarterbacks"],
  ["RB", "Running Back", "Offense", "Backs"],
  ["FB", "Fullback", "Offense", "Backs"],
  ["H", "H-Back", "Offense", "Backs / Tight Ends"],
  ["WR", "Wide Receiver", "Offense", "Receivers"],
  ["SL", "Slot Receiver", "Offense", "Receivers"],
  ["TE", "Tight End", "Offense", "Tight Ends"],
  ["OT", "Offensive Tackle", "Offense", "Offensive Line"],
  ["OG", "Offensive Guard", "Offense", "Offensive Line"],
  ["C", "Center", "Offense", "Offensive Line"],
  ["DE", "Defensive End", "Defense", "Defensive Line"],
  ["DT", "Defensive Tackle", "Defense", "Defensive Line"],
  ["NT", "Nose Tackle", "Defense", "Defensive Line"],
  ["EDGE", "Edge", "Defense", "Edges"],
  ["MIKE", "Mike Linebacker", "Defense", "Linebackers"],
  ["WILL", "Will Linebacker", "Defense", "Linebackers"],
  ["SAM", "Sam Linebacker", "Defense", "Linebackers"],
  ["ILB", "Inside Linebacker", "Defense", "Linebackers"],
  ["OLB", "Outside Linebacker", "Defense", "Linebackers"],
  ["CB", "Cornerback", "Defense", "Defensive Backs"],
  ["NICKEL", "Nickel", "Defense", "Defensive Backs"],
  ["FS", "Free Safety", "Defense", "Defensive Backs"],
  ["SS", "Strong Safety", "Defense", "Defensive Backs"],
  ["S", "Safety", "Defense", "Defensive Backs"],
  ["ROVER", "Rover / Hybrid", "Defense", "Defensive Backs"],
  ["K", "Kicker", "Special Teams", "Specialists"],
  ["P", "Punter", "Special Teams", "Specialists"],
  ["LS", "Long Snapper", "Special Teams", "Specialists"],
  ["HLD", "Holder", "Special Teams", "Specialists"],
  ["KOS", "Kickoff Specialist", "Special Teams", "Specialists"],
  ["KR", "Kick Returner", "Special Teams", "Returners"],
  ["PR", "Punt Returner", "Special Teams", "Returners"],
  ["GUN", "Gunner", "Special Teams", "Coverage"],
  ["VICE", "Vice", "Special Teams", "Return"],
  ["PP", "Personal Protector", "Special Teams", "Punt"],
].map(([code, name, unit, group]) => ({ code, name, unit, group }));

export const DEFAULT_SYSTEMS = {
  offense: {
    personnelGroups: ["10", "11", "12", "13", "20", "21", "22", "Empty", "Goal Line"],
    formationFamilies: ["Under Center", "Pistol", "Shotgun", "Empty", "Trips", "Doubles", "Bunch", "Quads", "Unbalanced"],
  },
  defense: {
    baseStructures: ["4-3", "3-4", "4-2-5", "3-3-5", "4-4", "Nickel", "Dime", "Goal Line"],
    fronts: ["Over", "Under", "Even", "Odd", "Bear", "Mint", "Tite", "Goal Line"],
    coverageFamilies: ["Cover 0", "Cover 1", "Cover 2", "Cover 3", "Quarters", "Palms", "Cover 6", "Match"],
    pressureFamilies: ["Four-man rush", "Five-man pressure", "Six-man pressure", "Simulated pressure", "Creeper", "Zero pressure"],
  },
  specialTeams: {
    units: ["Kickoff", "Kickoff Return", "Punt", "Punt Return", "Field Goal / PAT", "Field Goal Block", "Hands Team", "Onside Kick", "Onside Recovery", "Punt Safe", "Victory", "Emergency Units"],
  },
};

export const DISTRICT_6_DEMO_PROGRAMS = [
  { name: "Dr. Phillips High", abbreviation: "DP", district: "FHSAA Class 6A · Region 2 · District 6", city: "Orlando", state: "FL" },
  { name: "Ocoee High", abbreviation: "OCO", district: "FHSAA Class 6A · Region 2 · District 6", city: "Ocoee", state: "FL" },
  { name: "Olympia High", abbreviation: "OLY", district: "FHSAA Class 6A · Region 2 · District 6", city: "Orlando", state: "FL" },
  { name: "West Orange High", abbreviation: "WO", district: "FHSAA Class 6A · Region 2 · District 6", city: "Winter Garden", state: "FL" },
];

export const SOURCE_STATES = ["Verified opponent observation", "Staff interpretation", "Experimental idea"];
export const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
export const OBSERVATION_CATEGORIES = [
  "Personnel", "Formation", "Run concept", "Pass concept", "Protection", "Front", "Coverage", "Pressure", "Motion / shift", "Tempo", "Special teams", "Player matchup", "Situational tendency",
];
export const APPROVAL_STATES = ["Draft", "Staff review", "Approved", "Archived"];
export const INSTALL_STATES = ["Not scheduled", "Meeting install", "Field install", "Review", "Complete"];
export const PRACTICE_STATES = ["Not scripted", "Scripted", "Repped", "Needs correction", "Ready"];
export const GAME_DAY_STATES = ["Off sheet", "Candidate", "On call sheet", "Alert only"];
export const WEEK_STATUSES = ["Setup", "Scouting", "Planning", "Installing", "Game ready", "Final"];
