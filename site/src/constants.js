export const APP_NAME = "Three Phase HQ";
export const APP_SHORT_NAME = "3PHQ";
export const APP_TAGLINE = "One Staff. Three Phases. One Plan.";
export const WORKSPACE_SCHEMA_VERSION = 3;
export const STORAGE_KEY = "three-phase-hq.workspace.v3";
export const LEGACY_STORAGE_KEYS = [
  "three-phase-hq.workspace.v2",
  "coach-planning-command-center.workspace.v1",
];

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
export const PACKAGE_CATEGORIES = [
  "Base Depth Chart",
  "Personnel Package",
  "Formation Package",
  "Situation Package",
  "Special Teams Unit",
  "Emergency Unit",
];

export const DEFAULT_POSITIONS = [
  ["QB", "Quarterback", "Offense", "Quarterbacks"],
  ["RB", "Running Back", "Offense", "Backs"],
  ["FB", "Fullback", "Offense", "Backs"],
  ["H", "H-Back", "Offense", "Backs / Tight Ends"],
  ["F", "F / Flex", "Offense", "Backs / Receivers"],
  ["X", "X Receiver", "Offense", "Receivers"],
  ["Z", "Z Receiver", "Offense", "Receivers"],
  ["WR", "Wide Receiver", "Offense", "Receivers"],
  ["SL", "Slot Receiver", "Offense", "Receivers"],
  ["TE", "Tight End", "Offense", "Tight Ends"],
  ["OT", "Offensive Tackle", "Offense", "Offensive Line"],
  ["OG", "Offensive Guard", "Offense", "Offensive Line"],
  ["C", "Center", "Offense", "Offensive Line"],
  ["DL", "Defensive Lineman", "Defense", "Defensive Line"],
  ["DE", "Defensive End", "Defense", "Defensive Line"],
  ["DT", "Defensive Tackle", "Defense", "Defensive Line"],
  ["NT", "Nose Tackle", "Defense", "Defensive Line"],
  ["EDGE", "Edge", "Defense", "Edges"],
  ["LB", "Linebacker", "Defense", "Linebackers"],
  ["MIKE", "Mike Linebacker", "Defense", "Linebackers"],
  ["WILL", "Will Linebacker", "Defense", "Linebackers"],
  ["SAM", "Sam Linebacker", "Defense", "Linebackers"],
  ["ILB", "Inside Linebacker", "Defense", "Linebackers"],
  ["OLB", "Outside Linebacker", "Defense", "Linebackers"],
  ["DB", "Defensive Back", "Defense", "Defensive Backs"],
  ["CB", "Cornerback", "Defense", "Defensive Backs"],
  ["NICKEL", "Nickel", "Defense", "Defensive Backs"],
  ["DIME", "Dime Defensive Back", "Defense", "Defensive Backs"],
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

const slots = (...items) => items.map(([label, positionCode]) => ({ label, positionCode }));

export const PACKAGE_TEMPLATES = [
  { id: "offense-11", name: "11 Personnel", unit: "Offense", category: "Base Depth Chart", slots: slots(["QB", "QB"], ["RB", "RB"], ["X", "X"], ["Z", "Z"], ["Slot / H", "SL"], ["Y", "TE"], ["LT", "OT"], ["LG", "OG"], ["C", "C"], ["RG", "OG"], ["RT", "OT"]) },
  { id: "offense-12", name: "12 Personnel", unit: "Offense", category: "Personnel Package", slots: slots(["QB", "QB"], ["RB", "RB"], ["X", "X"], ["Z", "Z"], ["Y", "TE"], ["F / TE2", "TE"], ["LT", "OT"], ["LG", "OG"], ["C", "C"], ["RG", "OG"], ["RT", "OT"]) },
  { id: "offense-10", name: "10 Personnel", unit: "Offense", category: "Personnel Package", slots: slots(["QB", "QB"], ["RB", "RB"], ["X", "X"], ["Z", "Z"], ["H", "SL"], ["F", "F"], ["LT", "OT"], ["LG", "OG"], ["C", "C"], ["RG", "OG"], ["RT", "OT"]) },
  { id: "offense-21", name: "21 Personnel", unit: "Offense", category: "Personnel Package", slots: slots(["QB", "QB"], ["RB", "RB"], ["FB", "FB"], ["X", "X"], ["Z", "Z"], ["Y", "TE"], ["LT", "OT"], ["LG", "OG"], ["C", "C"], ["RG", "OG"], ["RT", "OT"]) },
  { id: "defense-425", name: "Base 4-2-5", unit: "Defense", category: "Base Depth Chart", slots: slots(["End", "DE"], ["3-Tech", "DT"], ["Nose", "NT"], ["End / Edge", "EDGE"], ["MIKE", "MIKE"], ["WILL", "WILL"], ["Field Corner", "CB"], ["Boundary Corner", "CB"], ["Nickel", "NICKEL"], ["Free Safety", "FS"], ["Strong Safety", "SS"]) },
  { id: "defense-335", name: "Base 3-3-5", unit: "Defense", category: "Base Depth Chart", slots: slots(["End", "DE"], ["Nose", "NT"], ["End", "DE"], ["SAM", "SAM"], ["MIKE", "MIKE"], ["WILL", "WILL"], ["Field Corner", "CB"], ["Boundary Corner", "CB"], ["Nickel / Rover", "ROVER"], ["Free Safety", "FS"], ["Strong Safety", "SS"]) },
  { id: "defense-43", name: "Base 4-3", unit: "Defense", category: "Base Depth Chart", slots: slots(["End", "DE"], ["3-Tech", "DT"], ["1-Tech", "DT"], ["End", "DE"], ["SAM", "SAM"], ["MIKE", "MIKE"], ["WILL", "WILL"], ["Field Corner", "CB"], ["Boundary Corner", "CB"], ["Free Safety", "FS"], ["Strong Safety", "SS"]) },
  { id: "defense-34", name: "Base 3-4", unit: "Defense", category: "Base Depth Chart", slots: slots(["End", "DE"], ["Nose", "NT"], ["End", "DE"], ["SAM", "OLB"], ["MIKE", "ILB"], ["WILL", "ILB"], ["JACK", "EDGE"], ["Field Corner", "CB"], ["Boundary Corner", "CB"], ["Free Safety", "FS"], ["Strong Safety", "SS"]) },
  { id: "defense-dime", name: "Dime", unit: "Defense", category: "Personnel Package", slots: slots(["Edge", "EDGE"], ["Tackle", "DT"], ["Tackle", "DT"], ["Edge", "EDGE"], ["MIKE", "MIKE"], ["Field Corner", "CB"], ["Boundary Corner", "CB"], ["Nickel", "NICKEL"], ["Dime", "DIME"], ["Free Safety", "FS"], ["Strong Safety", "SS"]) },
  { id: "st-kickoff", name: "Kickoff", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Kickoff Specialist", "KOS"], ["L1", "GUN"], ["L2", "GUN"], ["L3", "GUN"], ["L4", "GUN"], ["L5", "GUN"], ["R5", "GUN"], ["R4", "GUN"], ["R3", "GUN"], ["R2", "GUN"], ["R1", "GUN"]) },
  { id: "st-kick-return", name: "Kickoff Return", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Returner 1", "KR"], ["Returner 2", "KR"], ["Front L1", "GUN"], ["Front L2", "GUN"], ["Front L3", "GUN"], ["Front R3", "GUN"], ["Front R2", "GUN"], ["Front R1", "GUN"], ["Left Upback", "RB"], ["Right Upback", "RB"], ["Middle Upback", "FB"]) },
  { id: "st-punt", name: "Punt", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Long Snapper", "LS"], ["Punter", "P"], ["Personal Protector", "PP"], ["Left Gunner", "GUN"], ["Right Gunner", "GUN"], ["Left Tackle", "OT"], ["Left Guard", "OG"], ["Right Guard", "OG"], ["Right Tackle", "OT"], ["Left Wing", "TE"], ["Right Wing", "TE"]) },
  { id: "st-punt-return", name: "Punt Return", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Returner", "PR"], ["Left Vice", "VICE"], ["Right Vice", "VICE"], ["Left Force", "CB"], ["Right Force", "CB"], ["Box 1", "LB"], ["Box 2", "LB"], ["Box 3", "LB"], ["Box 4", "LB"], ["Hold-Up 1", "DB"], ["Hold-Up 2", "DB"]) },
  { id: "st-field-goal", name: "Field Goal / PAT", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Long Snapper", "LS"], ["Holder", "HLD"], ["Kicker", "K"], ["Left End", "TE"], ["Left Tackle", "OT"], ["Left Guard", "OG"], ["Center Shield", "C"], ["Right Guard", "OG"], ["Right Tackle", "OT"], ["Right End", "TE"], ["Protector", "FB"]) },
  { id: "st-field-goal-block", name: "Field Goal Block", unit: "Special Teams", category: "Special Teams Unit", slots: slots(["Left Edge", "EDGE"], ["Left B-Gap", "DT"], ["Left A-Gap", "DT"], ["Left Jumper", "DL"], ["Middle", "LB"], ["Right Jumper", "DL"], ["Right A-Gap", "DT"], ["Right B-Gap", "DT"], ["Right Edge", "EDGE"], ["Holder Contain", "CB"], ["Safety", "S"]) },
];

export const DISTRICT_6_DEMO_PROGRAMS = [
  { name: "Dr. Phillips High", abbreviation: "DP", district: "FHSAA Class 6A · Region 2 · District 6", city: "Orlando", state: "FL" },
  { name: "Ocoee High", abbreviation: "OCO", district: "FHSAA Class 6A · Region 2 · District 6", city: "Ocoee", state: "FL" },
  { name: "Olympia High", abbreviation: "OLY", district: "FHSAA Class 6A · Region 2 · District 6", city: "Orlando", state: "FL" },
  { name: "West Orange High", abbreviation: "WO", district: "FHSAA Class 6A · Region 2 · District 6", city: "Winter Garden", state: "FL" },
];

export const SOURCE_STATES = ["Verified opponent observation", "Staff interpretation", "Experimental idea"];
export const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
export const OBSERVATION_CATEGORIES = ["Personnel", "Formation", "Run concept", "Pass concept", "Protection", "Front", "Coverage", "Pressure", "Motion / shift", "Tempo", "Special teams", "Player matchup", "Situational tendency"];
export const APPROVAL_STATES = ["Draft", "Staff review", "Approved", "Archived"];
export const INSTALL_STATES = ["Not scheduled", "Meeting install", "Field install", "Review", "Complete"];
export const PRACTICE_STATES = ["Not scripted", "Scripted", "Repped", "Needs correction", "Ready"];
export const GAME_DAY_STATES = ["Off sheet", "Candidate", "On call sheet", "Alert only"];
export const WEEK_STATUSES = ["Setup", "Scouting", "Planning", "Installing", "Game ready", "Final"];
