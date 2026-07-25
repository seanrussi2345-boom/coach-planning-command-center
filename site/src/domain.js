import {
  WORKSPACE_SCHEMA_VERSION,
  DEFAULT_POSITIONS,
  DEFAULT_SYSTEMS,
  DISTRICT_6_DEMO_PROGRAMS,
  SOURCE_STATES,
  CONFIDENCE_LEVELS,
  APPROVAL_STATES,
  INSTALL_STATES,
  PRACTICE_STATES,
  GAME_DAY_STATES,
  WEEK_STATUSES,
  PLAYER_STATUSES,
} from "./constants.js";

export function createId(prefix = "id") {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${suffix}`;
}

export function nowIso() { return new Date().toISOString(); }
export function cloneWorkspace(workspace) { return JSON.parse(JSON.stringify(workspace)); }

const copySystems = () => JSON.parse(JSON.stringify(DEFAULT_SYSTEMS));
const defaultPositionCatalog = () => DEFAULT_POSITIONS.map((item) => ({ id: createId("position"), ...item, active: true, custom: false }));

export function createEmptyWorkspace() {
  const now = nowIso();
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    metadata: { workspaceId: createId("workspace"), createdAt: now, updatedAt: now, lastEditor: "Local staff workspace" },
    organization: { id: createId("org"), name: "", level: "High School", city: "", state: "FL", district: "" },
    team: { id: createId("team"), name: "", abbreviation: "", sideOfBall: "Program", primaryColor: "#d5ad43", secondaryColor: "#ffffff" },
    season: { id: createId("season"), label: String(new Date().getFullYear()), startDate: "", endDate: "" },
    staff: [], positionCatalog: defaultPositionCatalog(), systems: copySystems(), players: [], personnelPackages: [], depthCharts: [], opponents: [], games: [], weeks: [], observations: [], answers: [], revisions: [],
    ui: { activeWeekId: "", activeSetupTab: "roster" },
  };
}

export function normalizeWorkspace(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The selected file does not contain a valid workspace object.");
  if (![1, WORKSPACE_SCHEMA_VERSION].includes(Number(input.schemaVersion))) throw new Error(`Unsupported workspace version. Expected version ${WORKSPACE_SCHEMA_VERSION}.`);
  const base = createEmptyWorkspace();
  const normalized = {
    ...base, ...input, schemaVersion: WORKSPACE_SCHEMA_VERSION,
    metadata: { ...base.metadata, ...(input.metadata ?? {}), updatedAt: nowIso() }, organization: { ...base.organization, ...(input.organization ?? {}) }, team: { ...base.team, ...(input.team ?? {}) }, season: { ...base.season, ...(input.season ?? {}) },
    systems: { offense: { ...base.systems.offense, ...(input.systems?.offense ?? {}) }, defense: { ...base.systems.defense, ...(input.systems?.defense ?? {}) }, specialTeams: { ...base.systems.specialTeams, ...(input.systems?.specialTeams ?? {}) } }, ui: { ...base.ui, ...(input.ui ?? {}) },
  };
  for (const key of ["staff", "players", "personnelPackages", "depthCharts", "opponents", "games", "weeks", "observations", "answers", "revisions"]) normalized[key] = Array.isArray(input[key]) ? input[key] : [];
  normalized.positionCatalog = Array.isArray(input.positionCatalog) && input.positionCatalog.length ? input.positionCatalog : base.positionCatalog;
  delete normalized.team.mascot;
  normalized.opponents = normalized.opponents.map(({ mascot, ...opponent }) => opponent);
  const weekIds = new Set(normalized.weeks.map((week) => week.id));
  if (normalized.ui.activeWeekId && !weekIds.has(normalized.ui.activeWeekId)) normalized.ui.activeWeekId = normalized.weeks[0]?.id ?? "";
  return normalized;
}

export function appendRevision(workspace, action, detail, actor = "Local staff workspace") {
  workspace.revisions.unshift({ id: createId("revision"), action, detail, actor, createdAt: nowIso() }); workspace.revisions = workspace.revisions.slice(0, 150); workspace.metadata.updatedAt = nowIso(); workspace.metadata.lastEditor = actor; return workspace;
}

export function addPlayer(workspace, fields) {
  const player = { id: createId("player"), jerseyNumber: String(fields.jerseyNumber ?? "").trim(), firstName: String(fields.firstName ?? "").trim(), lastName: String(fields.lastName ?? "").trim(), grade: String(fields.grade ?? "").trim(), height: String(fields.height ?? "").trim(), weight: String(fields.weight ?? "").trim(), primaryPosition: String(fields.primaryPosition ?? "").trim().toUpperCase(), secondaryPositions: splitTags(fields.secondaryPositions).map((value) => value.toUpperCase()), status: PLAYER_STATUSES.includes(fields.status) ? fields.status : "Available", notes: String(fields.notes ?? "").trim(), assignments: { offense: [], defense: [], specialTeams: [] }, createdAt: nowIso(), updatedAt: nowIso() };
  if (!player.firstName && !player.lastName) throw new Error("Player name is required."); workspace.players.push(player); appendRevision(workspace, "Player added", `${player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}${player.firstName} ${player.lastName}`.trim()); return player;
}

export function removePlayer(workspace, playerId) { const player = workspace.players.find((item) => item.id === playerId); workspace.players = workspace.players.filter((item) => item.id !== playerId); workspace.depthCharts = workspace.depthCharts.filter((item) => item.playerId !== playerId); if (player) appendRevision(workspace, "Player removed", `${player.firstName} ${player.lastName}`.trim()); }

export function addPosition(workspace, fields) { const code = String(fields.code ?? "").trim().toUpperCase(); if (!code) throw new Error("Position code is required."); if (workspace.positionCatalog.some((item) => item.code.toUpperCase() === code)) throw new Error(`${code} already exists.`); const position = { id: createId("position"), code, name: String(fields.name ?? code).trim(), unit: fields.unit ?? "Offense", group: String(fields.group ?? "Custom").trim(), active: true, custom: true }; workspace.positionCatalog.push(position); appendRevision(workspace, "Custom position added", `${position.code} · ${position.unit}`); return position; }

export function addSystemItem(workspace, section, collection, value) { const text = String(value ?? "").trim(); if (!text) throw new Error("Enter a football term first."); const list = workspace.systems?.[section]?.[collection]; if (!Array.isArray(list)) throw new Error("System collection not found."); if (!list.some((item) => item.toLowerCase() === text.toLowerCase())) list.push(text); appendRevision(workspace, "Football terminology added", `${text} · ${section}`); }

export function parseRosterText(text) {
  const rows = String(text ?? "").split(/\r?\n/).map((row) => row.trim()).filter(Boolean); if (!rows.length) return [];
  const delimiter = rows.some((row) => row.includes("\t")) ? "\t" : rows.some((row) => row.includes(",")) ? "," : null;
  const split = (row) => delimiter ? row.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")) : row.split(/\s{2,}/).map((cell) => cell.trim());
  const raw = rows.map(split); const normalized = raw.map((cells) => cells.map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const headerIndex = normalized[0].findIndex((cell) => ["name", "player", "fullname", "first", "firstname"].includes(cell)); let start = 0; let map = { number: 0, name: 1, position: 2, grade: 3, height: 4, weight: 5 };
  if (headerIndex >= 0) { const headers = normalized[0]; const find = (...keys) => headers.findIndex((cell) => keys.includes(cell)); map = { number: find("no", "num", "number", "jersey", "jerseynumber"), name: find("name", "player", "fullname"), first: find("first", "firstname"), last: find("last", "lastname"), position: find("pos", "position", "positions"), grade: find("yr", "year", "grade", "class"), height: find("ht", "height"), weight: find("wt", "weight") }; start = 1; }
  const value = (cells, index) => index >= 0 ? String(cells[index] ?? "").trim() : "";
  return raw.slice(start).map((cells) => { const fullName = value(cells, map.name); const parts = fullName ? fullName.replace(/,/g, " ").split(/\s+/).filter(Boolean) : []; const firstName = value(cells, map.first) || parts.shift() || ""; const lastName = value(cells, map.last) || parts.join(" "); return { jerseyNumber: value(cells, map.number), firstName, lastName, primaryPosition: value(cells, map.position).toUpperCase(), grade: value(cells, map.grade), height: value(cells, map.height), weight: value(cells, map.weight), status: "Available", secondaryPositions: "", notes: "Imported roster preview" }; }).filter((item) => item.firstName || item.lastName);
}

export function importRosterRows(workspace, rows) { const existing = new Set(workspace.players.map((player) => `${player.jerseyNumber}|${player.firstName.toLowerCase()}|${player.lastName.toLowerCase()}`)); let added = 0; for (const row of rows) { const key = `${row.jerseyNumber}|${row.firstName.toLowerCase()}|${row.lastName.toLowerCase()}`; if (existing.has(key)) continue; addPlayer(workspace, row); existing.add(key); added += 1; } appendRevision(workspace, "Roster import completed", `${added} players added`); return added; }

export function addOpponent(workspace, fields) { const opponent = { id: createId("opponent"), name: fields.name.trim(), abbreviation: fields.abbreviation?.trim().toUpperCase() ?? "", conference: fields.conference?.trim() ?? "", notes: fields.notes?.trim() ?? "", createdAt: nowIso(), updatedAt: nowIso() }; workspace.opponents.push(opponent); appendRevision(workspace, "Opponent added", opponent.name); return opponent; }
export function addGame(workspace, fields) { const game = { id: createId("game"), opponentId: fields.opponentId, weekNumber: fields.weekNumber?.trim() ?? "", gameDate: fields.gameDate ?? "", kickoffTime: fields.kickoffTime ?? "", locationType: fields.locationType ?? "Home", location: fields.location?.trim() ?? "", status: "Scheduled", createdAt: nowIso(), updatedAt: nowIso() }; workspace.games.push(game); const opponent = workspace.opponents.find((item) => item.id === game.opponentId); const week = { id: createId("week"), gameId: game.id, label: game.weekNumber ? `Week ${game.weekNumber}` : `Game vs ${opponent?.name ?? "Opponent"}`, status: "Setup", notes: "", createdAt: nowIso(), updatedAt: nowIso() }; workspace.weeks.push(week); workspace.ui.activeWeekId = week.id; appendRevision(workspace, "Game and weekly plan added", `${week.label}: ${opponent?.name ?? "Opponent"}`); return { game, week }; }
export function addObservation(workspace, fields) { const observation = { id: createId("observation"), weekId: fields.weekId, unit: fields.unit ?? "Defense", category: fields.category ?? "Situational tendency", observation: fields.observation.trim(), sourceState: SOURCE_STATES.includes(fields.sourceState) ? fields.sourceState : SOURCE_STATES[1], confidence: CONFIDENCE_LEVELS.includes(fields.confidence) ? fields.confidence : "Medium", sourceLabel: fields.sourceLabel?.trim() ?? "", downDistance: fields.downDistance?.trim() ?? "", fieldZone: fields.fieldZone?.trim() ?? "", hash: fields.hash?.trim() ?? "", personnel: fields.personnel?.trim() ?? "", formation: fields.formation?.trim() ?? "", motion: fields.motion?.trim() ?? "", tempo: fields.tempo?.trim() ?? "", tags: splitTags(fields.tags), coachOwnerId: fields.coachOwnerId ?? "", status: "Active", createdBy: "Local staff workspace", lastEditor: "Local staff workspace", createdAt: nowIso(), updatedAt: nowIso() }; workspace.observations.push(observation); appendRevision(workspace, "Scouting observation added", observation.observation); return observation; }
export function addAnswer(workspace, fields) { const answer = { id: createId("answer"), weekId: fields.weekId, tendencyId: fields.tendencyId, unit: fields.unit ?? "Defense", staffAnswer: fields.staffAnswer.trim(), primaryCall: fields.primaryCall?.trim() ?? "", changeup: fields.changeup?.trim() ?? "", alertCheck: fields.alertCheck?.trim() ?? "", coachingPoint: fields.coachingPoint?.trim() ?? "", coachOwnerId: fields.coachOwnerId ?? "", approvalState: APPROVAL_STATES.includes(fields.approvalState) ? fields.approvalState : "Draft", installStatus: INSTALL_STATES.includes(fields.installStatus) ? fields.installStatus : "Not scheduled", practiceStatus: PRACTICE_STATES.includes(fields.practiceStatus) ? fields.practiceStatus : "Not scripted", gameDayStatus: GAME_DAY_STATES.includes(fields.gameDayStatus) ? fields.gameDayStatus : "Off sheet", installDate: fields.installDate ?? "", positionGroups: splitTags(fields.positionGroups), createdBy: "Local staff workspace", lastEditor: "Local staff workspace", createdAt: nowIso(), updatedAt: nowIso() }; workspace.answers.push(answer); appendRevision(workspace, "Game-plan answer added", answer.staffAnswer); return answer; }
export function getWeekContext(workspace, weekId = workspace.ui.activeWeekId) { const week = workspace.weeks.find((item) => item.id === weekId) ?? null; const game = week ? workspace.games.find((item) => item.id === week.gameId) ?? null : null; const opponent = game ? workspace.opponents.find((item) => item.id === game.opponentId) ?? null : null; return { week, game, opponent }; }
export function getDashboardMetrics(workspace, weekId = workspace.ui.activeWeekId) { const observations = workspace.observations.filter((item) => item.weekId === weekId); const answers = workspace.answers.filter((item) => item.weekId === weekId); const answeredIds = new Set(answers.map((item) => item.tendencyId)); const approved = answers.filter((item) => item.approvalState === "Approved").length; const installed = answers.filter((item) => item.installStatus === "Complete").length; const practiceReady = answers.filter((item) => item.practiceStatus === "Ready").length; const onCallSheet = answers.filter((item) => item.gameDayStatus === "On call sheet").length; return { observationCount: observations.length, answerCount: answers.length, unansweredCount: observations.filter((item) => !answeredIds.has(item.id)).length, approved, installed, practiceReady, onCallSheet, installationPercent: answers.length ? Math.round((installed / answers.length) * 100) : 0, approvalPercent: answers.length ? Math.round((approved / answers.length) * 100) : 0 }; }
export function setWeekStatus(workspace, weekId, status) { const week = workspace.weeks.find((item) => item.id === weekId); if (!week) throw new Error("Weekly plan not found."); week.status = WEEK_STATUSES.includes(status) ? status : "Setup"; week.updatedAt = nowIso(); appendRevision(workspace, "Week status updated", `${week.label}: ${week.status}`); }
export function splitTags(value) { return Array.isArray(value) ? value.filter(Boolean) : String(value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean); }
export function formatGameLabel(workspace, game) { const opponent = workspace.opponents.find((item) => item.id === game.opponentId); return `${game.weekNumber ? `Week ${game.weekNumber} · ` : ""}${game.locationType === "Away" ? "at" : "vs"} ${opponent?.name ?? "Opponent"}`; }

const FICTIONAL_ROSTER = [["1","Jordan","Ellis","12","QB","6-1","185"],["2","Malik","Reed","11","WR","5-10","170"],["3","Cam","Foster","12","CB","5-11","175"],["4","Devin","Brooks","11","RB","5-9","180"],["5","Trey","Wilson","12","MIKE","6-0","205"],["6","Andre","Young","10","SL","5-8","155"],["7","Jalen","Price","11","S","6-0","180"],["8","Noah","Carter","12","WR","6-2","190"],["9","Isaiah","Grant","11","EDGE","6-3","220"],["10","Marcus","Stone","10","QB","5-11","170"],["11","Dylan","Ross","12","CB","5-10","168"],["12","Eli","Morris","11","TE","6-3","215"],["21","Kai","Turner","10","RB","5-8","165"],["24","Micah","Cole","12","WILL","6-0","195"],["32","Luke","Harris","11","LS","6-1","205"],["55","Aaron","Bell","12","C","6-2","265"],["72","Chris","Davis","11","OT","6-4","280"],["90","Jay","Martin","12","DT","6-2","250"]];

export function createDistrictDemoWorkspace(programName = DISTRICT_6_DEMO_PROGRAMS[0].name) {
  const workspace = createEmptyWorkspace(); const selected = DISTRICT_6_DEMO_PROGRAMS.find((item) => item.name === programName) ?? DISTRICT_6_DEMO_PROGRAMS[0];
  workspace.organization = { ...workspace.organization, name: selected.name, level: "High School", city: selected.city, state: selected.state, district: selected.district }; workspace.team = { ...workspace.team, name: selected.name, abbreviation: selected.abbreviation, sideOfBall: "Program" }; workspace.season = { ...workspace.season, label: "2026", startDate: "2026-08-01", endDate: "2026-12-15" };
  const staffSeeds = [["Alex Carter","Head Coach","Program"],["Chris Bennett","Offensive Coordinator","Offense"],["Andre Lewis","Defensive Coordinator","Defense"],["Marcus Hill","Special Teams Coordinator","Special Teams"]]; workspace.staff = staffSeeds.map(([name, role, unit]) => ({ id: createId("staff"), name, role, unit, email: "", createdAt: nowIso(), updatedAt: nowIso() }));
  FICTIONAL_ROSTER.forEach(([jerseyNumber, firstName, lastName, grade, primaryPosition, height, weight]) => addPlayer(workspace, { jerseyNumber, firstName, lastName, grade, primaryPosition, height, weight, status: "Available", notes: "Fictional demonstration player" }));
  for (const program of DISTRICT_6_DEMO_PROGRAMS.filter((item) => item.name !== selected.name)) addOpponent(workspace, { name: program.name, abbreviation: program.abbreviation, conference: program.district, notes: "Orange County District 6 demonstration opponent" });
  const { week } = addGame(workspace, { opponentId: workspace.opponents[0].id, weekNumber: "1", gameDate: "2026-08-28", kickoffTime: "19:00", locationType: "Home", location: "Home Stadium" }); week.status = "Planning";
  const observations = [["Defense","Run concept","11 personnel: inside zone is the early-down base call from open formations."],["Defense","Pass concept","Trips sets create a vertical release by No. 3 with an underneath crosser."],["Offense","Front","The opponent aligns in an even front on standard downs and reduces on short yardage."],["Offense","Pressure","Boundary pressure appears most often on third-and-medium."],["Special Teams","Special teams","Punt coverage uses a directional approach with the returner shaded away from the sideline."]];
  observations.forEach(([unit, category, observation], index) => { const tendency = addObservation(workspace, { weekId: week.id, unit, category, observation, confidence: "Medium", sourceState: index < 2 ? "Verified opponent observation" : "Staff interpretation", sourceLabel: "Fictional demonstration film study", coachOwnerId: workspace.staff[Math.min(index + 1, 3)].id, tags: "demo, fictional" }); addAnswer(workspace, { weekId: week.id, tendencyId: tendency.id, unit, staffAnswer: `Build and install the ${unit.toLowerCase()} answer for this tendency.`, primaryCall: "Base answer", changeup: "Weekly changeup", alertCheck: "Game-day alert", coachingPoint: "Confirm alignment, assignment, and communication.", coachOwnerId: workspace.staff[Math.min(index + 1, 3)].id, approvalState: index === 0 ? "Approved" : "Staff review", installStatus: index === 0 ? "Field install" : "Meeting install", practiceStatus: "Scripted", gameDayStatus: "Candidate", positionGroups: unit === "Special Teams" ? "Specialists, coverage, return" : unit === "Offense" ? "OL, backs, receivers" : "DL, LB, DB" }); });
  workspace.revisions = workspace.revisions.slice(0, 20); return workspace;
}

export const createDemoWorkspace = createDistrictDemoWorkspace;
