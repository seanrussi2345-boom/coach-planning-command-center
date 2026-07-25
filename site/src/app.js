import {
  APP_NAME,
  STAFF_ROLES,
  UNITS,
  SOURCE_STATES,
  CONFIDENCE_LEVELS,
  OBSERVATION_CATEGORIES,
  APPROVAL_STATES,
  INSTALL_STATES,
  PRACTICE_STATES,
  GAME_DAY_STATES,
  WEEK_STATUSES,
} from "./constants.js";
import {
  addAnswer,
  addGame,
  addObservation,
  addOpponent,
  appendRevision,
  createDemoWorkspace,
  createEmptyWorkspace,
  createId,
  formatGameLabel,
  getDashboardMetrics,
  getWeekContext,
  nowIso,
  setWeekStatus,
} from "./domain.js";
import { clearWorkspace, downloadWorkspace, loadWorkspace, readWorkspaceFile, saveWorkspace } from "./store.js";

const root = document.querySelector("#app");
let workspace = loadWorkspace();
let route = location.hash || "#/dashboard";
let toast = "";

const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const options = (items, selected = "") => items.map((item) => `<option ${item === selected ? "selected" : ""}>${esc(item)}</option>`).join("");
const staffOptions = (selected = "") => `<option value="">Unassigned</option>${workspace.staff.map((coach) => `<option value="${coach.id}" ${coach.id === selected ? "selected" : ""}>${esc(coach.name)} · ${esc(coach.role)}</option>`).join("")}`;
const opponentOptions = (selected = "") => `<option value="">Select opponent</option>${workspace.opponents.map((item) => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${esc(item.name)}</option>`).join("")}`;
const weekOptions = () => workspace.weeks.map((week) => {
  const { game, opponent } = getWeekContext(workspace, week.id);
  return `<option value="${week.id}" ${week.id === workspace.ui.activeWeekId ? "selected" : ""}>${esc(week.label)} · ${esc(opponent?.name || "Opponent")}${game?.gameDate ? ` · ${esc(game.gameDate)}` : ""}</option>`;
}).join("");

function persist(message = "Saved") {
  workspace.metadata.updatedAt = nowIso();
  saveWorkspace(workspace);
  toast = message;
  render();
  setTimeout(() => { toast = ""; document.querySelector(".toast")?.remove(); }, 1800);
}

function navigate(next) {
  location.hash = next;
}

window.addEventListener("hashchange", () => { route = location.hash || "#/dashboard"; render(); });

function shell(content) {
  const teamName = workspace.team.name || "New Program";
  const active = (name) => route.startsWith(name) ? "active" : "";
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><img src="assets/coach-planning-mark.svg" alt=""><div><strong>${APP_NAME}</strong><span>Football staff workspace</span></div></div>
        <nav>
          <a class="${active("#/dashboard")}" href="#/dashboard">Weekly Dashboard</a>
          <a class="${active("#/team")}" href="#/team">Team & Staff</a>
          <a class="${active("#/schedule")}" href="#/schedule">Opponents & Games</a>
          <a class="${active("#/scout")}" href="#/scout">Opponent Scout</a>
          <a class="${active("#/game-plan")}" href="#/game-plan">Game Plan Board</a>
          <a class="${active("#/settings")}" href="#/settings">Backup & Settings</a>
        </nav>
        <div class="sidebar-foot"><span>${esc(teamName)}</span><small>${esc(workspace.season.label || "Season not set")}</small></div>
      </aside>
      <main>
        <header class="topbar">
          <div><p class="eyebrow">Standalone coaching platform</p><h1>${esc(pageTitle())}</h1></div>
          <div class="week-picker"><label>Active week<select id="active-week"><option value="">No week selected</option>${weekOptions()}</select></label></div>
        </header>
        ${toast ? `<div class="toast">${esc(toast)}</div>` : ""}
        <section class="page">${content}</section>
      </main>
    </div>`;
}

function pageTitle() {
  if (route.startsWith("#/team")) return "Team, Season & Staff";
  if (route.startsWith("#/schedule")) return "Opponent & Game Setup";
  if (route.startsWith("#/scout")) return "Opponent Scout";
  if (route.startsWith("#/game-plan")) return "Game Plan Board";
  if (route.startsWith("#/settings")) return "Backup & Workspace Settings";
  return "Weekly Dashboard";
}

function activeContext() {
  return getWeekContext(workspace, workspace.ui.activeWeekId);
}

function emptyWeek() {
  return `<div class="empty"><h2>No weekly plan selected</h2><p>Add an opponent and game to create a linked weekly workspace.</p><a class="button primary" href="#/schedule">Set up opponent and game</a></div>`;
}

function dashboard() {
  const { week, game, opponent } = activeContext();
  if (!week) return emptyWeek();
  const metrics = getDashboardMetrics(workspace, week.id);
  const observations = workspace.observations.filter((item) => item.weekId === week.id).slice(-5).reverse();
  const answers = workspace.answers.filter((item) => item.weekId === week.id);
  return `
    <div class="hero-card">
      <div><p class="eyebrow">${esc(week.label)} · ${esc(week.status)}</p><h2>${esc(workspace.team.name || "Your Team")} ${game?.locationType === "Away" ? "at" : "vs"} ${esc(opponent?.name || "Opponent")}</h2><p>${game?.gameDate ? esc(game.gameDate) : "Date TBD"}${game?.kickoffTime ? ` · ${esc(game.kickoffTime)}` : ""}${game?.location ? ` · ${esc(game.location)}` : ""}</p></div>
      <label class="status-control">Week status<select id="week-status">${options(WEEK_STATUSES, week.status)}</select></label>
    </div>
    <div class="metrics">
      ${metric("Scout findings", metrics.observationCount)}
      ${metric("Planned answers", metrics.answerCount)}
      ${metric("Unanswered", metrics.unansweredCount)}
      ${metric("Approved", `${metrics.approvalPercent}%`)}
      ${metric("Installed", `${metrics.installationPercent}%`)}
      ${metric("On call sheet", metrics.onCallSheet)}
    </div>
    <div class="two-col">
      <article class="panel"><div class="panel-head"><div><p class="eyebrow">Latest scouting</p><h3>Opponent tendencies</h3></div><a href="#/scout">Open scout</a></div>${observations.length ? observations.map(observationCard).join("") : `<p class="muted">No observations yet.</p>`}</article>
      <article class="panel"><div class="panel-head"><div><p class="eyebrow">Staff workflow</p><h3>Answer status</h3></div><a href="#/game-plan">Open board</a></div>${answers.length ? answers.slice(-5).reverse().map(answerSummary).join("") : `<p class="muted">No answers yet.</p>`}</article>
    </div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">Change tracking</p><h3>Recent staff activity</h3></div></div>${workspace.revisions.slice(0, 8).map((item) => `<div class="activity"><strong>${esc(item.action)}</strong><span>${esc(item.detail)}</span><small>${new Date(item.createdAt).toLocaleString()}</small></div>`).join("") || `<p class="muted">No changes recorded.</p>`}</article>`;
}

function metric(label, value) { return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }

function teamPage() {
  return `
    <div class="two-col">
      <form id="team-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Program identity</p><h3>Team and season</h3></div></div>
        <div class="form-grid">
          ${field("Organization", "organizationName", workspace.organization.name)}
          ${field("Team name", "teamName", workspace.team.name, true)}
          ${field("Mascot", "mascot", workspace.team.mascot)}
          ${field("Season", "seasonLabel", workspace.season.label, true)}
          ${field("City", "city", workspace.organization.city)}
          ${field("State", "state", workspace.organization.state)}
          ${selectField("Program level", "level", ["Youth", "High School", "College", "Private Organization"], workspace.organization.level)}
          ${selectField("Primary workspace", "sideOfBall", UNITS, workspace.team.sideOfBall)}
          ${field("Season start", "startDate", workspace.season.startDate, false, "date")}
          ${field("Season end", "endDate", workspace.season.endDate, false, "date")}
        </div><button class="button primary">Save team setup</button>
      </form>
      <form id="staff-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Staff ownership</p><h3>Add coach or analyst</h3></div></div>
        <div class="form-grid">${field("Name", "name", "", true)}${selectField("Role", "role", STAFF_ROLES, "Position Coach")}${selectField("Unit", "unit", UNITS, "Defense")}${field("Email", "email", "", false, "email")}</div>
        <button class="button primary">Add staff member</button>
      </form>
    </div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">Current staff</p><h3>Ownership roster</h3></div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Unit</th><th>Email</th></tr></thead><tbody>${workspace.staff.map((item) => `<tr><td>${esc(item.name)}</td><td>${esc(item.role)}</td><td>${esc(item.unit)}</td><td>${esc(item.email || "—")}</td></tr>`).join("") || `<tr><td colspan="4">No staff members added.</td></tr>`}</tbody></table></div></article>`;
}

function schedulePage() {
  return `
    <div class="two-col">
      <form id="opponent-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Scout directory</p><h3>Add opponent</h3></div></div><div class="form-grid">${field("Opponent name", "name", "", true)}${field("Mascot", "mascot")}${field("Abbreviation", "abbreviation")}${field("Conference / district", "conference")}</div>${textarea("Initial notes", "notes")}<button class="button primary">Add opponent</button></form>
      <form id="game-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Weekly cycle</p><h3>Add game</h3></div></div><div class="form-grid">${selectRaw("Opponent", "opponentId", opponentOptions(), true)}${field("Week number", "weekNumber", "", true)}${field("Game date", "gameDate", "", false, "date")}${field("Kickoff", "kickoffTime", "", false, "time")}${selectField("Location type", "locationType", ["Home", "Away", "Neutral"], "Home")}${field("Venue / city", "location")}</div><button class="button primary" ${workspace.opponents.length ? "" : "disabled"}>Create game and week</button></form>
    </div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">Season schedule</p><h3>Games and workspaces</h3></div></div><div class="cards">${workspace.games.map((game) => { const week = workspace.weeks.find((item) => item.gameId === game.id); return `<button class="game-card" data-week="${week?.id || ""}"><strong>${esc(formatGameLabel(workspace, game))}</strong><span>${esc(game.gameDate || "Date TBD")} · ${esc(game.location || game.locationType)}</span><small>${esc(week?.status || "Setup")}</small></button>`; }).join("") || `<p class="muted">No games added.</p>`}</div></article>`;
}

function scoutPage() {
  const { week, opponent } = activeContext();
  if (!week) return emptyWeek();
  const observations = workspace.observations.filter((item) => item.weekId === week.id).reverse();
  return `
    <form id="observation-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">${esc(opponent?.name || "Opponent")}</p><h3>Add tendency or scouting observation</h3></div></div>
      <div class="form-grid">${selectField("Unit", "unit", UNITS, "Defense")}${selectField("Category", "category", OBSERVATION_CATEGORIES, "Situational tendency")}${selectField("Source state", "sourceState", SOURCE_STATES, SOURCE_STATES[0])}${selectField("Confidence", "confidence", CONFIDENCE_LEVELS, "Medium")}${field("Down & distance", "downDistance")}${field("Field zone", "fieldZone")}${field("Hash", "hash")}${field("Personnel", "personnel")}${field("Formation", "formation")}${field("Motion / shift", "motion")}${field("Tempo", "tempo")}${selectRaw("Coach owner", "coachOwnerId", staffOptions())}${field("Source label", "sourceLabel")}${field("Tags, comma-separated", "tags")}</div>${textarea("Observation / tendency", "observation", "", true)}<button class="button primary">Add scouting observation</button>
    </form>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">Weekly scout report</p><h3>${observations.length} findings</h3></div></div>${observations.length ? observations.map(observationCard).join("") : `<p class="muted">Add the first verified observation, interpretation, or experimental idea.</p>`}</article>`;
}

function observationCard(item) {
  const owner = workspace.staff.find((coach) => coach.id === item.coachOwnerId);
  return `<div class="record"><div class="record-top"><div><span class="badge ${slug(item.sourceState)}">${esc(item.sourceState)}</span><span class="badge">${esc(item.confidence)} confidence</span></div><strong>${esc(item.category)}</strong></div><p>${esc(item.observation)}</p><div class="record-meta">${[item.downDistance, item.fieldZone, item.hash, item.personnel && `${item.personnel} personnel`, item.formation, item.motion, item.tempo, owner?.name].filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join("")}</div></div>`;
}

function gamePlanPage() {
  const { week, opponent } = activeContext();
  if (!week) return emptyWeek();
  const observations = workspace.observations.filter((item) => item.weekId === week.id);
  const answers = workspace.answers.filter((item) => item.weekId === week.id);
  return `
    <form id="answer-form" class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">${esc(opponent?.name || "Opponent")}</p><h3>Build a planned answer</h3></div></div>
      <div class="form-grid">${selectRaw("Opponent tendency", "tendencyId", `<option value="">Select tendency</option>${observations.map((item) => `<option value="${item.id}">${esc(item.category)} · ${esc(item.observation.slice(0, 70))}</option>`).join("")}`, true)}${selectField("Unit", "unit", UNITS, "Defense")}${selectRaw("Coach owner", "coachOwnerId", staffOptions())}${selectField("Approval", "approvalState", APPROVAL_STATES, "Draft")}${selectField("Install status", "installStatus", INSTALL_STATES, "Not scheduled")}${selectField("Practice status", "practiceStatus", PRACTICE_STATES, "Not scripted")}${selectField("Game-day status", "gameDayStatus", GAME_DAY_STATES, "Off sheet")}${field("Install date", "installDate", "", false, "date")}${field("Position groups", "positionGroups")}${field("Primary call", "primaryCall")}${field("Changeup", "changeup")}${field("Alert / check", "alertCheck")}</div>${textarea("Staff answer", "staffAnswer", "", true)}${textarea("Coaching point", "coachingPoint")}<button class="button primary" ${observations.length ? "" : "disabled"}>Add planned answer</button>
    </form>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">Answer board</p><h3>${answers.length} planned answers</h3></div></div>${answers.length ? answers.map(answerCard).join("") : `<p class="muted">Record scouting observations first, then build the staff's answers.</p>`}</article>`;
}

function answerSummary(answer) {
  return `<div class="activity"><strong>${esc(answer.primaryCall || answer.staffAnswer)}</strong><span>${esc(answer.installStatus)} · ${esc(answer.approvalState)}</span><small>${esc(answer.gameDayStatus)}</small></div>`;
}

function answerCard(answer) {
  const tendency = workspace.observations.find((item) => item.id === answer.tendencyId);
  const owner = workspace.staff.find((item) => item.id === answer.coachOwnerId);
  return `<div class="record answer"><div class="record-top"><div><span class="badge approved-${slug(answer.approvalState)}">${esc(answer.approvalState)}</span><span class="badge">${esc(answer.installStatus)}</span><span class="badge">${esc(answer.practiceStatus)}</span></div><strong>${esc(owner?.name || "Unassigned")}</strong></div><p class="tendency"><b>Opponent:</b> ${esc(tendency?.observation || "Linked tendency unavailable")}</p><h4>${esc(answer.staffAnswer)}</h4><div class="answer-grid"><span><b>Primary:</b> ${esc(answer.primaryCall || "—")}</span><span><b>Changeup:</b> ${esc(answer.changeup || "—")}</span><span><b>Alert:</b> ${esc(answer.alertCheck || "—")}</span><span><b>Game day:</b> ${esc(answer.gameDayStatus)}</span></div>${answer.coachingPoint ? `<p><b>Coaching point:</b> ${esc(answer.coachingPoint)}</p>` : ""}</div>`;
}

function settingsPage() {
  return `<div class="two-col"><article class="panel"><div class="panel-head"><div><p class="eyebrow">Local backup</p><h3>Export and import</h3></div></div><p>The complete team workspace is stored only in this browser. Export a JSON backup before changing devices or clearing browser data.</p><div class="button-row"><button id="export" class="button primary">Export workspace</button><label class="button">Import JSON<input id="import" type="file" accept="application/json" hidden></label></div></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">Prototype controls</p><h3>Workspace data</h3></div></div><p>Load a complete five-tendency demonstration workspace or reset only this application's isolated storage key.</p><div class="button-row"><button id="demo" class="button">Load demo</button><button id="reset" class="button danger">Reset workspace</button></div></article></div><article class="panel"><div class="panel-head"><div><p class="eyebrow">Project boundary</p><h3>Independent product</h3></div></div><p>This application has its own repository, deployment workflow, brand asset, data schema, and storage namespace. It does not read from or write to any other football application.</p></article>`;
}

function field(label, name, value = "", required = false, type = "text") { return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""}></label>`; }
function textarea(label, name, value = "", required = false) { return `<label class="wide">${esc(label)}<textarea name="${name}" rows="3" ${required ? "required" : ""}>${esc(value)}</textarea></label>`; }
function selectField(label, name, items, selected = "") { return `<label>${esc(label)}<select name="${name}">${options(items, selected)}</select></label>`; }
function selectRaw(label, name, html, required = false) { return `<label>${esc(label)}<select name="${name}" ${required ? "required" : ""}>${html}</select></label>`; }
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

function bind() {
  document.querySelector("#active-week")?.addEventListener("change", (event) => { workspace.ui.activeWeekId = event.target.value; persist("Active week changed"); });
  document.querySelector("#week-status")?.addEventListener("change", (event) => { setWeekStatus(workspace, workspace.ui.activeWeekId, event.target.value); persist("Week status updated"); });
  document.querySelector("#team-form")?.addEventListener("submit", (event) => { event.preventDefault(); const data = formData(event.currentTarget); Object.assign(workspace.organization, { name: data.organizationName, city: data.city, state: data.state, level: data.level }); Object.assign(workspace.team, { name: data.teamName, mascot: data.mascot, sideOfBall: data.sideOfBall }); Object.assign(workspace.season, { label: data.seasonLabel, startDate: data.startDate, endDate: data.endDate }); appendRevision(workspace, "Team setup updated", `${data.teamName} · ${data.seasonLabel}`); persist("Team setup saved"); });
  document.querySelector("#staff-form")?.addEventListener("submit", (event) => { event.preventDefault(); const data = formData(event.currentTarget); workspace.staff.push({ id: createId("staff"), ...data, createdAt: nowIso(), updatedAt: nowIso() }); appendRevision(workspace, "Staff member added", data.name); persist("Staff member added"); });
  document.querySelector("#opponent-form")?.addEventListener("submit", (event) => { event.preventDefault(); addOpponent(workspace, formData(event.currentTarget)); persist("Opponent added"); });
  document.querySelector("#game-form")?.addEventListener("submit", (event) => { event.preventDefault(); addGame(workspace, formData(event.currentTarget)); persist("Game and week created"); navigate("#/dashboard"); });
  document.querySelectorAll(".game-card").forEach((button) => button.addEventListener("click", () => { workspace.ui.activeWeekId = button.dataset.week; persist("Active week changed"); navigate("#/dashboard"); }));
  document.querySelector("#observation-form")?.addEventListener("submit", (event) => { event.preventDefault(); addObservation(workspace, { ...formData(event.currentTarget), weekId: workspace.ui.activeWeekId }); persist("Scouting observation added"); });
  document.querySelector("#answer-form")?.addEventListener("submit", (event) => { event.preventDefault(); addAnswer(workspace, { ...formData(event.currentTarget), weekId: workspace.ui.activeWeekId }); persist("Planned answer added"); });
  document.querySelector("#export")?.addEventListener("click", () => downloadWorkspace(workspace));
  document.querySelector("#import")?.addEventListener("change", async (event) => { try { workspace = await readWorkspaceFile(event.target.files[0]); persist("Workspace imported"); } catch (error) { alert(error.message); } });
  document.querySelector("#demo")?.addEventListener("click", () => { workspace = createDemoWorkspace(); persist("Demo workspace loaded"); navigate("#/dashboard"); });
  document.querySelector("#reset")?.addEventListener("click", () => { if (!confirm("Reset this coaching workspace? Export first if you need a backup.")) return; clearWorkspace(); workspace = createEmptyWorkspace(); persist("Workspace reset"); navigate("#/team"); });
}

function render() {
  let content;
  if (route.startsWith("#/team")) content = teamPage();
  else if (route.startsWith("#/schedule")) content = schedulePage();
  else if (route.startsWith("#/scout")) content = scoutPage();
  else if (route.startsWith("#/game-plan")) content = gamePlanPage();
  else if (route.startsWith("#/settings")) content = settingsPage();
  else content = dashboard();
  root.innerHTML = shell(content);
  bind();
}

render();
