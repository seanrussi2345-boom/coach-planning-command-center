import {
  APP_NAME, APP_TAGLINE, STAFF_ROLES, UNITS, PLAYER_STATUSES, GRADES,
  DISTRICT_6_DEMO_PROGRAMS, SOURCE_STATES, CONFIDENCE_LEVELS,
  OBSERVATION_CATEGORIES, APPROVAL_STATES, INSTALL_STATES,
  PRACTICE_STATES, GAME_DAY_STATES, WEEK_STATUSES,
} from "./constants.js";
import {
  addAnswer, addGame, addObservation, addOpponent, addPlayer, addPosition,
  addSystemItem, appendRevision, createDistrictDemoWorkspace, createEmptyWorkspace,
  createId, formatGameLabel, getDashboardMetrics, getWeekContext, importRosterRows,
  nowIso, parseRosterText, removePlayer, setWeekStatus,
} from "./domain.js";
import { clearWorkspace, downloadWorkspace, loadWorkspace, readWorkspaceFile, saveWorkspace } from "./store.js";

const root = document.querySelector("#app");
let workspace = loadWorkspace();
let route = location.hash || "#/dashboard";
let toast = "";
let rosterPreview = [];

const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const options = (items, selected = "") => items.map((item) => `<option ${item === selected ? "selected" : ""}>${esc(item)}</option>`).join("");
const data = (form) => Object.fromEntries(new FormData(form).entries());
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const field = (label, name, value = "", required = false, type = "text", placeholder = "") => `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? "required" : ""}></label>`;
const textarea = (label, name, value = "", required = false, placeholder = "") => `<label class="wide">${esc(label)}<textarea name="${name}" rows="4" placeholder="${esc(placeholder)}" ${required ? "required" : ""}>${esc(value)}</textarea></label>`;
const select = (label, name, items, selected = "") => `<label>${esc(label)}<select name="${name}">${options(items, selected)}</select></label>`;
const rawSelect = (label, name, html, required = false) => `<label>${esc(label)}<select name="${name}" ${required ? "required" : ""}>${html}</select></label>`;

function persist(message = "Saved") {
  workspace.metadata.updatedAt = nowIso(); saveWorkspace(workspace); toast = message; render();
  setTimeout(() => { toast = ""; document.querySelector(".toast")?.remove(); }, 1800);
}
function navigate(next) { location.hash = next; }
window.addEventListener("hashchange", () => { route = location.hash || "#/dashboard"; render(); });

function positionOptions(selected = "") {
  return `<option value="">Select position</option>${UNITS.slice(1).map((unit) => `<optgroup label="${unit}">${workspace.positionCatalog.filter((item) => item.unit === unit && item.active).map((item) => `<option value="${esc(item.code)}" ${item.code === selected ? "selected" : ""}>${esc(item.code)} · ${esc(item.name)}</option>`).join("")}</optgroup>`).join("")}`;
}
function staffOptions() { return `<option value="">Unassigned</option>${workspace.staff.map((coach) => `<option value="${coach.id}">${esc(coach.name)} · ${esc(coach.role)}</option>`).join("")}`; }
function opponentOptions() { return `<option value="">Select opponent</option>${workspace.opponents.map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join("")}`; }
function weekOptions() { return workspace.weeks.map((week) => { const { game, opponent } = getWeekContext(workspace, week.id); return `<option value="${week.id}" ${week.id === workspace.ui.activeWeekId ? "selected" : ""}>${esc(week.label)} · ${esc(opponent?.name || "Opponent")}${game?.gameDate ? ` · ${esc(game.gameDate)}` : ""}</option>`; }).join(""); }
function nav(href, label) { return `<a class="${route.startsWith(href) ? "active" : ""}" href="${href}">${label}</a>`; }
function pageTitle() {
  if (route.startsWith("#/team")) return "Team & Staff";
  if (route.startsWith("#/roster")) return "Unified Roster";
  if (route.startsWith("#/football-setup")) return "Team Football Setup";
  if (route.startsWith("#/schedule")) return "Opponents & Games";
  if (route.startsWith("#/scout")) return "Opponent Scout";
  if (route.startsWith("#/game-plan")) return "Game Plan Board";
  if (route.startsWith("#/settings")) return "Backup & Settings";
  return "Weekly Dashboard";
}

function shell(content) {
  return `<div class="app-shell">
    <header class="app-header">
      <div class="header-main">
        <a class="brand" href="#/dashboard"><img src="assets/three-phase-hq-logo-transparent.svg" alt="Three Phase HQ"></a>
        <div class="program-context"><strong>${esc(workspace.team.name || "New Program")}</strong><span>${esc(workspace.organization.district || "Football staff workspace")}</span></div>
        <div class="header-actions"><button id="save-now" class="button compact">Save</button><button id="export-header" class="button compact">Export</button><label class="season-control">Season<input id="season-header" value="${esc(workspace.season.label)}"></label></div>
      </div>
      <nav class="primary-nav">${nav("#/dashboard", "Dashboard")}${nav("#/team", "Team")}${nav("#/roster", "Roster")}${nav("#/football-setup", "Football Setup")}${nav("#/schedule", "Schedule")}${nav("#/scout", "Scout")}${nav("#/game-plan", "Game Plan")}${nav("#/settings", "Backup")}</nav>
    </header>
    <main><div class="page-heading"><div><p class="eyebrow">${APP_TAGLINE}</p><h1>${pageTitle()}</h1></div><label class="week-picker">Active week<select id="active-week"><option value="">No week selected</option>${weekOptions()}</select></label></div>${toast ? `<div class="toast">${esc(toast)}</div>` : ""}<section class="page">${content}</section></main>
  </div>`;
}

function dashboard() {
  const { week, game, opponent } = getWeekContext(workspace);
  if (!week) return `<div class="hero-card"><div><p class="eyebrow">Program foundation</p><h2>${esc(workspace.team.name || APP_NAME)}</h2><p>${workspace.players.length} roster players · ${workspace.positionCatalog.length} position labels · offense, defense, and special teams configured</p></div><a class="button primary" href="#/football-setup">Open football setup</a></div><div class="empty"><h2>No weekly plan selected</h2><p>Add an opponent and game after completing the team football foundation.</p><a class="button" href="#/schedule">Set up schedule</a></div>`;
  const metrics = getDashboardMetrics(workspace, week.id);
  const observations = workspace.observations.filter((item) => item.weekId === week.id).slice(-5).reverse();
  const answers = workspace.answers.filter((item) => item.weekId === week.id).slice(-5).reverse();
  return `<div class="hero-card"><div><p class="eyebrow">${esc(week.label)} · ${esc(week.status)}</p><h2>${esc(workspace.team.name || "Your Team")} ${game?.locationType === "Away" ? "at" : "vs"} ${esc(opponent?.name || "Opponent")}</h2><p>${esc(game?.gameDate || "Date TBD")} · ${esc(game?.location || game?.locationType || "Location TBD")}</p></div><label class="status-control">Week status<select id="week-status">${options(WEEK_STATUSES, week.status)}</select></label></div>
  <div class="metrics">${metric("Roster", workspace.players.length)}${metric("Scout findings", metrics.observationCount)}${metric("Answers", metrics.answerCount)}${metric("Unanswered", metrics.unansweredCount)}${metric("Approved", `${metrics.approvalPercent}%`)}${metric("Installed", `${metrics.installationPercent}%`)}</div>
  <div class="two-col"><article class="panel"><div class="panel-head"><div><p class="eyebrow">Latest scouting</p><h3>Opponent tendencies</h3></div><a href="#/scout">Open</a></div>${observations.map(observationCard).join("") || `<p class="muted">No findings yet.</p>`}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">Staff workflow</p><h3>Planned answers</h3></div><a href="#/game-plan">Open</a></div>${answers.map((item) => `<div class="activity"><strong>${esc(item.primaryCall || item.staffAnswer)}</strong><span>${esc(item.unit)} · ${esc(item.installStatus)}</span><small>${esc(item.approvalState)}</small></div>`).join("") || `<p class="muted">No answers yet.</p>`}</article></div>`;
}
function metric(label, value) { return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }

function teamPage() {
  return `<div class="two-col"><form id="team-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Program identity</p><h3>Team and season</h3></div></div><div class="form-grid">${field("Organization / school", "organizationName", workspace.organization.name)}${field("Team name", "teamName", workspace.team.name, true)}${field("Abbreviation", "abbreviation", workspace.team.abbreviation)}${field("Season", "seasonLabel", workspace.season.label, true)}${field("City", "city", workspace.organization.city)}${field("State", "state", workspace.organization.state)}${field("District / conference", "district", workspace.organization.district)}${select("Program level", "level", ["Youth", "High School", "College", "Private Organization"], workspace.organization.level)}${field("Season start", "startDate", workspace.season.startDate, false, "date")}${field("Season end", "endDate", workspace.season.endDate, false, "date")}</div><button class="button primary">Save team setup</button></form>
  <form id="staff-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Staff ownership</p><h3>Add coach or analyst</h3></div></div><div class="form-grid">${field("Name", "name", "", true)}${select("Role", "role", STAFF_ROLES, "Position Coach")}${select("Unit", "unit", UNITS, "Offense")}${field("Email", "email", "", false, "email")}</div><button class="button primary">Add staff member</button></form></div>
  <article class="panel"><div class="panel-head"><div><p class="eyebrow">Current staff</p><h3>Ownership roster</h3></div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Unit</th><th>Email</th></tr></thead><tbody>${workspace.staff.map((item) => `<tr><td>${esc(item.name)}</td><td>${esc(item.role)}</td><td>${esc(item.unit)}</td><td>${esc(item.email || "—")}</td></tr>`).join("") || `<tr><td colspan="4">No staff members added.</td></tr>`}</tbody></table></div></article>`;
}

function rosterPage() {
  return `<div class="two-col"><form id="player-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Unified team roster</p><h3>Add player</h3></div></div><div class="form-grid">${field("Jersey number", "jerseyNumber")}${field("First name", "firstName", "", true)}${field("Last name", "lastName", "", true)}${select("Grade / year", "grade", ["", ...GRADES], "")}${rawSelect("Primary position", "primaryPosition", positionOptions())}${field("Secondary positions", "secondaryPositions", "", false, "text", "CB, KR")}${field("Height", "height", "", false, "text", "6-1")}${field("Weight", "weight", "", false, "number")}${select("Availability", "status", PLAYER_STATUSES, "Available")}</div>${textarea("Notes", "notes")}<button class="button primary">Add player</button></form>
  <article class="panel"><div class="panel-head"><div><p class="eyebrow">Bulk entry</p><h3>Paste CSV or spreadsheet rows</h3></div></div><p class="muted">Recommended columns: Number, Name, Position, Grade, Height, Weight. Every row is reviewed before import.</p><textarea id="roster-paste" rows="10" placeholder="Number,Name,Position,Grade,Height,Weight&#10;1,Jordan Ellis,QB,12,6-1,185"></textarea><div class="button-row"><button id="preview-roster" class="button primary">Preview roster</button><button id="clear-preview" class="button">Clear preview</button></div></article></div>${rosterPreview.length ? previewPanel() : ""}
  <article class="panel"><div class="panel-head"><div><p class="eyebrow">${workspace.players.length} players</p><h3>Team roster</h3></div><span class="muted">One player can serve all three phases.</span></div><div class="table-wrap"><table><thead><tr><th>No.</th><th>Player</th><th>Grade</th><th>Primary</th><th>Secondary</th><th>Ht</th><th>Wt</th><th>Status</th><th></th></tr></thead><tbody>${workspace.players.map((player) => `<tr><td><strong>${esc(player.jerseyNumber || "—")}</strong></td><td>${esc(`${player.firstName} ${player.lastName}`)}</td><td>${esc(player.grade || "—")}</td><td><span class="position-pill">${esc(player.primaryPosition || "—")}</span></td><td>${esc(player.secondaryPositions?.join(", ") || "—")}</td><td>${esc(player.height || "—")}</td><td>${esc(player.weight || "—")}</td><td><span class="status ${slug(player.status)}">${esc(player.status)}</span></td><td><button class="icon-button remove-player" data-player="${player.id}">×</button></td></tr>`).join("") || `<tr><td colspan="9">No players added.</td></tr>`}</tbody></table></div></article>`;
}
function previewPanel() { return `<article class="panel preview-panel"><div class="panel-head"><div><p class="eyebrow">Review before saving</p><h3>${rosterPreview.length} parsed players</h3></div><button id="import-preview" class="button primary">Import reviewed rows</button></div><div class="table-wrap"><table><thead><tr><th>No.</th><th>Player</th><th>Position</th><th>Grade</th><th>Height</th><th>Weight</th></tr></thead><tbody>${rosterPreview.map((player) => `<tr><td>${esc(player.jerseyNumber || "—")}</td><td>${esc(`${player.firstName} ${player.lastName}`)}</td><td>${esc(player.primaryPosition || "—")}</td><td>${esc(player.grade || "—")}</td><td>${esc(player.height || "—")}</td><td>${esc(player.weight || "—")}</td></tr>`).join("")}</tbody></table></div><p class="callout">Nothing is added until the reviewed rows are approved. Document upload will use this same review-first workflow later.</p></article>`; }

function footballSetupPage() {
  const section = (title, unit, collection, values) => `<article class="system-card"><div><p class="eyebrow">${esc(unit)}</p><h3>${esc(title)}</h3></div><div class="chips">${values.map((value) => `<span>${esc(value)}</span>`).join("")}</div><form class="system-item-form" data-section="${unit === "Offense" ? "offense" : unit === "Defense" ? "defense" : "specialTeams"}" data-collection="${collection}"><input name="value" placeholder="Add staff terminology"><button class="button">Add</button></form></article>`;
  return `<div class="setup-intro"><div><p class="eyebrow">Football-first foundation</p><h2>Define the language used by the entire staff</h2><p>Starter labels are editable. Add internal terms such as STAR, JACK, BANDIT, VIPER, H, F, Y, Rover, or any program-specific package.</p></div></div>
  <div class="systems-grid">${section("Personnel Groups", "Offense", "personnelGroups", workspace.systems.offense.personnelGroups)}${section("Formation Families", "Offense", "formationFamilies", workspace.systems.offense.formationFamilies)}${section("Base Structures", "Defense", "baseStructures", workspace.systems.defense.baseStructures)}${section("Fronts", "Defense", "fronts", workspace.systems.defense.fronts)}${section("Coverage Families", "Defense", "coverageFamilies", workspace.systems.defense.coverageFamilies)}${section("Pressure Families", "Defense", "pressureFamilies", workspace.systems.defense.pressureFamilies)}${section("Complete Units", "Special Teams", "units", workspace.systems.specialTeams.units)}</div>
  <div class="two-col"><form id="position-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Custom terminology</p><h3>Add position label</h3></div></div><div class="form-grid">${field("Code", "code", "", true, "text", "STAR")}${field("Name", "name", "", true, "text", "Star / Hybrid")}${select("Unit", "unit", UNITS.slice(1), "Defense")}${field("Position group", "group", "", true, "text", "Defensive Backs")}</div><button class="button primary">Add position</button></form><article class="panel"><div class="panel-head"><div><p class="eyebrow">Position catalog</p><h3>${workspace.positionCatalog.length} labels</h3></div></div><div class="position-groups">${UNITS.slice(1).map((unit) => `<div><h4>${unit}</h4><div class="chips">${workspace.positionCatalog.filter((item) => item.unit === unit).map((item) => `<span title="${esc(item.name)}">${esc(item.code)}</span>`).join("")}</div></div>`).join("")}</div></article></div>`;
}

function schedulePage() {
  return `<div class="two-col"><form id="opponent-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Scout directory</p><h3>Add opponent</h3></div></div><div class="form-grid">${field("Opponent name", "name", "", true)}${field("Abbreviation", "abbreviation")}${field("District / conference", "conference")}</div>${textarea("Initial notes", "notes")}<button class="button primary">Add opponent</button></form><form id="game-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Weekly cycle</p><h3>Add game</h3></div></div><div class="form-grid">${rawSelect("Opponent", "opponentId", opponentOptions(), true)}${field("Week number", "weekNumber", "", true)}${field("Game date", "gameDate", "", false, "date")}${field("Kickoff", "kickoffTime", "", false, "time")}${select("Location type", "locationType", ["Home", "Away", "Neutral"], "Home")}${field("Venue / city", "location")}</div><button class="button primary" ${workspace.opponents.length ? "" : "disabled"}>Create game and week</button></form></div><article class="panel"><div class="cards">${workspace.games.map((game) => { const week = workspace.weeks.find((item) => item.gameId === game.id); return `<button class="game-card" data-week="${week?.id || ""}"><strong>${esc(formatGameLabel(workspace, game))}</strong><span>${esc(game.gameDate || "Date TBD")} · ${esc(game.location || game.locationType)}</span><small>${esc(week?.status || "Setup")}</small></button>`; }).join("") || `<p class="muted">No games added.</p>`}</div></article>`;
}

function scoutPage() {
  const { week, opponent } = getWeekContext(workspace); if (!week) return `<div class="empty"><h2>Select a weekly plan first</h2></div>`;
  const findings = workspace.observations.filter((item) => item.weekId === week.id).reverse();
  return `<form id="observation-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">${esc(opponent?.name || "Opponent")}</p><h3>Add tendency or observation</h3></div></div><div class="form-grid">${select("Unit", "unit", UNITS.slice(1), "Defense")}${select("Category", "category", OBSERVATION_CATEGORIES, "Situational tendency")}${select("Source state", "sourceState", SOURCE_STATES, SOURCE_STATES[0])}${select("Confidence", "confidence", CONFIDENCE_LEVELS, "Medium")}${field("Down & distance", "downDistance")}${field("Field zone", "fieldZone")}${field("Personnel", "personnel")}${field("Formation", "formation")}${rawSelect("Coach owner", "coachOwnerId", staffOptions())}${field("Source label", "sourceLabel")}</div>${textarea("Observation / tendency", "observation", "", true)}<button class="button primary">Add observation</button></form><article class="panel">${findings.map(observationCard).join("") || `<p class="muted">No observations yet.</p>`}</article>`;
}
function observationCard(item) { const owner = workspace.staff.find((coach) => coach.id === item.coachOwnerId); return `<div class="record"><div class="record-top"><div><span class="badge unit-${slug(item.unit)}">${esc(item.unit)}</span><span class="badge ${slug(item.sourceState)}">${esc(item.sourceState)}</span><span class="badge">${esc(item.confidence)}</span></div><strong>${esc(item.category)}</strong></div><p>${esc(item.observation)}</p><div class="record-meta">${[item.downDistance, item.fieldZone, item.personnel, item.formation, owner?.name].filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join("")}</div></div>`; }

function gamePlanPage() {
  const { week, opponent } = getWeekContext(workspace); if (!week) return `<div class="empty"><h2>Select a weekly plan first</h2></div>`;
  const findings = workspace.observations.filter((item) => item.weekId === week.id); const answers = workspace.answers.filter((item) => item.weekId === week.id);
  return `<form id="answer-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">${esc(opponent?.name || "Opponent")}</p><h3>Build a planned answer</h3></div></div><div class="form-grid">${rawSelect("Opponent tendency", "tendencyId", `<option value="">Select tendency</option>${findings.map((item) => `<option value="${item.id}">${esc(item.unit)} · ${esc(item.observation.slice(0, 75))}</option>`).join("")}`, true)}${select("Unit", "unit", UNITS.slice(1), "Defense")}${rawSelect("Coach owner", "coachOwnerId", staffOptions())}${select("Approval", "approvalState", APPROVAL_STATES, "Draft")}${select("Install status", "installStatus", INSTALL_STATES, "Not scheduled")}${select("Practice status", "practiceStatus", PRACTICE_STATES, "Not scripted")}${select("Game-day status", "gameDayStatus", GAME_DAY_STATES, "Off sheet")}${field("Position groups", "positionGroups")}${field("Primary call", "primaryCall")}${field("Changeup", "changeup")}${field("Alert / check", "alertCheck")}</div>${textarea("Staff answer", "staffAnswer", "", true)}${textarea("Coaching point", "coachingPoint")}<button class="button primary" ${findings.length ? "" : "disabled"}>Add planned answer</button></form><article class="panel">${answers.map(answerCard).join("") || `<p class="muted">Record observations first, then build answers.</p>`}</article>`;
}
function answerCard(answer) { const tendency = workspace.observations.find((item) => item.id === answer.tendencyId); const owner = workspace.staff.find((item) => item.id === answer.coachOwnerId); return `<div class="record"><div class="record-top"><div><span class="badge unit-${slug(answer.unit)}">${esc(answer.unit)}</span><span class="badge">${esc(answer.approvalState)}</span><span class="badge">${esc(answer.installStatus)}</span></div><strong>${esc(owner?.name || "Unassigned")}</strong></div><p class="tendency"><b>Opponent:</b> ${esc(tendency?.observation || "Linked tendency unavailable")}</p><h4>${esc(answer.staffAnswer)}</h4><div class="answer-grid"><span><b>Primary:</b> ${esc(answer.primaryCall || "—")}</span><span><b>Changeup:</b> ${esc(answer.changeup || "—")}</span><span><b>Alert:</b> ${esc(answer.alertCheck || "—")}</span><span><b>Game day:</b> ${esc(answer.gameDayStatus)}</span></div></div>`; }

function settingsPage() {
  const demoOptions = DISTRICT_6_DEMO_PROGRAMS.map((program) => `<option value="${esc(program.name)}">${esc(program.name)}</option>`).join("");
  return `<div class="two-col"><article class="panel"><div class="panel-head"><div><p class="eyebrow">Local backup</p><h3>Export and import</h3></div></div><p>Export before changing devices or clearing browser data.</p><div class="button-row"><button id="export" class="button primary">Export workspace</button><label class="button">Import JSON<input id="import" type="file" accept="application/json" hidden></label></div></article><form id="demo-form" class="panel"><div class="panel-head"><div><p class="eyebrow">Orange County demonstration</p><h3>Load District 6 example</h3></div></div><p class="muted">School names and district grouping are real. Players, coaches, dates, scouting, and plans are fictional.</p><label>Demo program<select name="programName">${demoOptions}</select></label><div class="button-row"><button class="button primary">Load selected demo</button><button id="reset" type="button" class="button danger">Reset workspace</button></div></form></div>`;
}

function bind() {
  document.querySelector("#active-week")?.addEventListener("change", (event) => { workspace.ui.activeWeekId = event.target.value; persist("Active week changed"); });
  document.querySelector("#week-status")?.addEventListener("change", (event) => { setWeekStatus(workspace, workspace.ui.activeWeekId, event.target.value); persist("Week status updated"); });
  document.querySelector("#save-now")?.addEventListener("click", () => persist("Workspace saved"));
  document.querySelector("#export-header")?.addEventListener("click", () => downloadWorkspace(workspace));
  document.querySelector("#season-header")?.addEventListener("change", (event) => { workspace.season.label = event.target.value.trim(); persist("Season updated"); });
  document.querySelector("#team-form")?.addEventListener("submit", (event) => { event.preventDefault(); const value = data(event.currentTarget); Object.assign(workspace.organization, { name: value.organizationName, city: value.city, state: value.state, level: value.level, district: value.district }); Object.assign(workspace.team, { name: value.teamName, abbreviation: value.abbreviation, sideOfBall: "Program" }); Object.assign(workspace.season, { label: value.seasonLabel, startDate: value.startDate, endDate: value.endDate }); appendRevision(workspace, "Team setup updated", `${value.teamName} · ${value.seasonLabel}`); persist("Team setup saved"); });
  document.querySelector("#staff-form")?.addEventListener("submit", (event) => { event.preventDefault(); const value = data(event.currentTarget); workspace.staff.push({ id: createId("staff"), ...value, createdAt: nowIso(), updatedAt: nowIso() }); persist("Staff member added"); });
  document.querySelector("#player-form")?.addEventListener("submit", (event) => { event.preventDefault(); try { addPlayer(workspace, data(event.currentTarget)); persist("Player added"); } catch (error) { alert(error.message); } });
  document.querySelectorAll(".remove-player").forEach((button) => button.addEventListener("click", () => { if (confirm("Remove this player?")) { removePlayer(workspace, button.dataset.player); persist("Player removed"); } }));
  document.querySelector("#preview-roster")?.addEventListener("click", () => { rosterPreview = parseRosterText(document.querySelector("#roster-paste")?.value); if (!rosterPreview.length) alert("No roster rows could be parsed."); render(); });
  document.querySelector("#clear-preview")?.addEventListener("click", () => { rosterPreview = []; render(); });
  document.querySelector("#import-preview")?.addEventListener("click", () => { const count = importRosterRows(workspace, rosterPreview); rosterPreview = []; persist(`${count} players imported`); });
  document.querySelector("#position-form")?.addEventListener("submit", (event) => { event.preventDefault(); try { addPosition(workspace, data(event.currentTarget)); persist("Custom position added"); } catch (error) { alert(error.message); } });
  document.querySelectorAll(".system-item-form").forEach((form) => form.addEventListener("submit", (event) => { event.preventDefault(); try { addSystemItem(workspace, form.dataset.section, form.dataset.collection, data(form).value); persist("Football terminology added"); } catch (error) { alert(error.message); } }));
  document.querySelector("#opponent-form")?.addEventListener("submit", (event) => { event.preventDefault(); addOpponent(workspace, data(event.currentTarget)); persist("Opponent added"); });
  document.querySelector("#game-form")?.addEventListener("submit", (event) => { event.preventDefault(); addGame(workspace, data(event.currentTarget)); persist("Game and week created"); navigate("#/dashboard"); });
  document.querySelectorAll(".game-card").forEach((button) => button.addEventListener("click", () => { workspace.ui.activeWeekId = button.dataset.week; persist("Active week changed"); navigate("#/dashboard"); }));
  document.querySelector("#observation-form")?.addEventListener("submit", (event) => { event.preventDefault(); addObservation(workspace, { ...data(event.currentTarget), weekId: workspace.ui.activeWeekId }); persist("Observation added"); });
  document.querySelector("#answer-form")?.addEventListener("submit", (event) => { event.preventDefault(); addAnswer(workspace, { ...data(event.currentTarget), weekId: workspace.ui.activeWeekId }); persist("Planned answer added"); });
  document.querySelector("#export")?.addEventListener("click", () => downloadWorkspace(workspace));
  document.querySelector("#import")?.addEventListener("change", async (event) => { try { workspace = await readWorkspaceFile(event.target.files[0]); persist("Workspace imported"); } catch (error) { alert(error.message); } });
  document.querySelector("#demo-form")?.addEventListener("submit", (event) => { event.preventDefault(); if (!confirm("Replace this browser workspace with the selected fictional demo?")) return; workspace = createDistrictDemoWorkspace(data(event.currentTarget).programName); rosterPreview = []; persist("District 6 demo loaded"); navigate("#/dashboard"); });
  document.querySelector("#reset")?.addEventListener("click", () => { if (!confirm("Reset this workspace?")) return; clearWorkspace(); workspace = createEmptyWorkspace(); rosterPreview = []; persist("Workspace reset"); navigate("#/team"); });
}

function render() {
  let content = dashboard();
  if (route.startsWith("#/team")) content = teamPage();
  else if (route.startsWith("#/roster")) content = rosterPage();
  else if (route.startsWith("#/football-setup")) content = footballSetupPage();
  else if (route.startsWith("#/schedule")) content = schedulePage();
  else if (route.startsWith("#/scout")) content = scoutPage();
  else if (route.startsWith("#/game-plan")) content = gamePlanPage();
  else if (route.startsWith("#/settings")) content = settingsPage();
  root.innerHTML = shell(content); bind();
}
render();
