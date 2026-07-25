import {
  WORKSPACE_SCHEMA_VERSION,
  SOURCE_STATES,
  CONFIDENCE_LEVELS,
  APPROVAL_STATES,
  INSTALL_STATES,
  PRACTICE_STATES,
  GAME_DAY_STATES,
  WEEK_STATUSES,
} from "./constants.js";

export function createId(prefix = "id") {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${suffix}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createEmptyWorkspace() {
  const now = nowIso();
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    metadata: {
      workspaceId: createId("workspace"),
      createdAt: now,
      updatedAt: now,
      lastEditor: "Local staff workspace",
    },
    organization: { id: createId("org"), name: "", level: "High School", city: "", state: "" },
    team: { id: createId("team"), name: "", mascot: "", sideOfBall: "Program", primaryColor: "#d5ad43" },
    season: { id: createId("season"), label: String(new Date().getFullYear()), startDate: "", endDate: "" },
    staff: [],
    opponents: [],
    games: [],
    weeks: [],
    observations: [],
    answers: [],
    revisions: [],
    ui: { activeWeekId: "" },
  };
}

export function cloneWorkspace(workspace) {
  return JSON.parse(JSON.stringify(workspace));
}

export function normalizeWorkspace(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("The selected file does not contain a valid workspace object.");
  }
  if (Number(input.schemaVersion) !== WORKSPACE_SCHEMA_VERSION) {
    throw new Error(`Unsupported workspace version. Expected version ${WORKSPACE_SCHEMA_VERSION}.`);
  }

  const base = createEmptyWorkspace();
  const normalized = {
    ...base,
    ...input,
    metadata: { ...base.metadata, ...(input.metadata ?? {}), updatedAt: nowIso() },
    organization: { ...base.organization, ...(input.organization ?? {}) },
    team: { ...base.team, ...(input.team ?? {}) },
    season: { ...base.season, ...(input.season ?? {}) },
    ui: { ...base.ui, ...(input.ui ?? {}) },
  };

  for (const key of ["staff", "opponents", "games", "weeks", "observations", "answers", "revisions"]) {
    normalized[key] = Array.isArray(input[key]) ? input[key] : [];
  }

  const ids = new Set(normalized.weeks.map((week) => week.id));
  if (normalized.ui.activeWeekId && !ids.has(normalized.ui.activeWeekId)) {
    normalized.ui.activeWeekId = normalized.weeks[0]?.id ?? "";
  }
  return normalized;
}

export function appendRevision(workspace, action, detail, actor = "Local staff workspace") {
  workspace.revisions.unshift({
    id: createId("revision"),
    action,
    detail,
    actor,
    createdAt: nowIso(),
  });
  workspace.revisions = workspace.revisions.slice(0, 100);
  workspace.metadata.updatedAt = nowIso();
  workspace.metadata.lastEditor = actor;
  return workspace;
}

export function addOpponent(workspace, fields) {
  const opponent = {
    id: createId("opponent"),
    name: fields.name.trim(),
    mascot: fields.mascot?.trim() ?? "",
    abbreviation: fields.abbreviation?.trim().toUpperCase() ?? "",
    conference: fields.conference?.trim() ?? "",
    notes: fields.notes?.trim() ?? "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.opponents.push(opponent);
  appendRevision(workspace, "Opponent added", opponent.name);
  return opponent;
}

export function addGame(workspace, fields) {
  const game = {
    id: createId("game"),
    opponentId: fields.opponentId,
    weekNumber: fields.weekNumber?.trim() ?? "",
    gameDate: fields.gameDate ?? "",
    kickoffTime: fields.kickoffTime ?? "",
    locationType: fields.locationType ?? "Home",
    location: fields.location?.trim() ?? "",
    status: "Scheduled",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.games.push(game);
  const opponent = workspace.opponents.find((item) => item.id === game.opponentId);
  const week = {
    id: createId("week"),
    gameId: game.id,
    label: game.weekNumber ? `Week ${game.weekNumber}` : `Game vs ${opponent?.name ?? "Opponent"}`,
    status: "Setup",
    notes: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.weeks.push(week);
  workspace.ui.activeWeekId = week.id;
  appendRevision(workspace, "Game and weekly plan added", `${week.label}: ${opponent?.name ?? "Opponent"}`);
  return { game, week };
}

export function addObservation(workspace, fields) {
  const observation = {
    id: createId("observation"),
    weekId: fields.weekId,
    unit: fields.unit ?? "Defense",
    category: fields.category ?? "Situational tendency",
    observation: fields.observation.trim(),
    sourceState: SOURCE_STATES.includes(fields.sourceState) ? fields.sourceState : SOURCE_STATES[1],
    confidence: CONFIDENCE_LEVELS.includes(fields.confidence) ? fields.confidence : "Medium",
    sourceLabel: fields.sourceLabel?.trim() ?? "",
    downDistance: fields.downDistance?.trim() ?? "",
    fieldZone: fields.fieldZone?.trim() ?? "",
    hash: fields.hash?.trim() ?? "",
    personnel: fields.personnel?.trim() ?? "",
    formation: fields.formation?.trim() ?? "",
    motion: fields.motion?.trim() ?? "",
    tempo: fields.tempo?.trim() ?? "",
    tags: splitTags(fields.tags),
    coachOwnerId: fields.coachOwnerId ?? "",
    status: fields.status ?? "Active",
    createdBy: fields.createdBy ?? "Local staff workspace",
    lastEditor: fields.createdBy ?? "Local staff workspace",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.observations.push(observation);
  appendRevision(workspace, "Scouting observation added", observation.observation);
  return observation;
}

export function updateObservation(workspace, id, fields) {
  const observation = workspace.observations.find((item) => item.id === id);
  if (!observation) throw new Error("Observation not found.");
  Object.assign(observation, {
    ...fields,
    observation: fields.observation.trim(),
    sourceLabel: fields.sourceLabel?.trim() ?? "",
    downDistance: fields.downDistance?.trim() ?? "",
    fieldZone: fields.fieldZone?.trim() ?? "",
    hash: fields.hash?.trim() ?? "",
    personnel: fields.personnel?.trim() ?? "",
    formation: fields.formation?.trim() ?? "",
    motion: fields.motion?.trim() ?? "",
    tempo: fields.tempo?.trim() ?? "",
    tags: splitTags(fields.tags),
    updatedAt: nowIso(),
    lastEditor: fields.lastEditor ?? "Local staff workspace",
  });
  appendRevision(workspace, "Scouting observation updated", observation.observation);
  return observation;
}

export function addAnswer(workspace, fields) {
  const answer = {
    id: createId("answer"),
    weekId: fields.weekId,
    tendencyId: fields.tendencyId,
    unit: fields.unit ?? "Defense",
    staffAnswer: fields.staffAnswer.trim(),
    primaryCall: fields.primaryCall?.trim() ?? "",
    changeup: fields.changeup?.trim() ?? "",
    alertCheck: fields.alertCheck?.trim() ?? "",
    coachingPoint: fields.coachingPoint?.trim() ?? "",
    coachOwnerId: fields.coachOwnerId ?? "",
    approvalState: APPROVAL_STATES.includes(fields.approvalState) ? fields.approvalState : "Draft",
    installStatus: INSTALL_STATES.includes(fields.installStatus) ? fields.installStatus : "Not scheduled",
    practiceStatus: PRACTICE_STATES.includes(fields.practiceStatus) ? fields.practiceStatus : "Not scripted",
    gameDayStatus: GAME_DAY_STATES.includes(fields.gameDayStatus) ? fields.gameDayStatus : "Off sheet",
    installDate: fields.installDate ?? "",
    positionGroups: splitTags(fields.positionGroups),
    createdBy: fields.createdBy ?? "Local staff workspace",
    lastEditor: fields.createdBy ?? "Local staff workspace",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.answers.push(answer);
  appendRevision(workspace, "Game-plan answer added", answer.staffAnswer);
  return answer;
}

export function updateAnswer(workspace, id, fields) {
  const answer = workspace.answers.find((item) => item.id === id);
  if (!answer) throw new Error("Game-plan answer not found.");
  Object.assign(answer, {
    ...fields,
    staffAnswer: fields.staffAnswer.trim(),
    primaryCall: fields.primaryCall?.trim() ?? "",
    changeup: fields.changeup?.trim() ?? "",
    alertCheck: fields.alertCheck?.trim() ?? "",
    coachingPoint: fields.coachingPoint?.trim() ?? "",
    positionGroups: splitTags(fields.positionGroups),
    updatedAt: nowIso(),
    lastEditor: fields.lastEditor ?? "Local staff workspace",
  });
  appendRevision(workspace, "Game-plan answer updated", answer.staffAnswer);
  return answer;
}

export function getWeekContext(workspace, weekId = workspace.ui.activeWeekId) {
  const week = workspace.weeks.find((item) => item.id === weekId) ?? null;
  const game = week ? workspace.games.find((item) => item.id === week.gameId) ?? null : null;
  const opponent = game ? workspace.opponents.find((item) => item.id === game.opponentId) ?? null : null;
  return { week, game, opponent };
}

export function getDashboardMetrics(workspace, weekId = workspace.ui.activeWeekId) {
  const observations = workspace.observations.filter((item) => item.weekId === weekId);
  const answers = workspace.answers.filter((item) => item.weekId === weekId);
  const answeredIds = new Set(answers.map((item) => item.tendencyId));
  const approved = answers.filter((item) => item.approvalState === "Approved").length;
  const installed = answers.filter((item) => item.installStatus === "Complete").length;
  const practiceReady = answers.filter((item) => item.practiceStatus === "Ready").length;
  const onCallSheet = answers.filter((item) => item.gameDayStatus === "On call sheet").length;
  return {
    observationCount: observations.length,
    answerCount: answers.length,
    unansweredCount: observations.filter((item) => !answeredIds.has(item.id)).length,
    approved,
    installed,
    practiceReady,
    onCallSheet,
    installationPercent: answers.length ? Math.round((installed / answers.length) * 100) : 0,
    approvalPercent: answers.length ? Math.round((approved / answers.length) * 100) : 0,
  };
}

export function setWeekStatus(workspace, weekId, status) {
  const week = workspace.weeks.find((item) => item.id === weekId);
  if (!week) throw new Error("Weekly plan not found.");
  week.status = WEEK_STATUSES.includes(status) ? status : "Setup";
  week.updatedAt = nowIso();
  appendRevision(workspace, "Week status updated", `${week.label}: ${week.status}`);
}

export function splitTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatGameLabel(workspace, game) {
  const opponent = workspace.opponents.find((item) => item.id === game.opponentId);
  const prefix = game.locationType === "Away" ? "at" : game.locationType === "Neutral" ? "vs" : "vs";
  return `${game.weekNumber ? `Week ${game.weekNumber} · ` : ""}${prefix} ${opponent?.name ?? "Opponent"}`;
}

export function createDemoWorkspace() {
  const workspace = createEmptyWorkspace();
  workspace.organization = { ...workspace.organization, name: "North Ridge Football", level: "High School", city: "Orlando", state: "FL" };
  workspace.team = { ...workspace.team, name: "North Ridge", mascot: "Falcons", sideOfBall: "Program", primaryColor: "#d5ad43" };
  workspace.season = { ...workspace.season, label: "2026", startDate: "2026-08-01", endDate: "2026-12-15" };

  const staff = [
    ["Marcus Hill", "Head Coach", "Program"],
    ["Andre Lewis", "Defensive Coordinator", "Defense"],
    ["Chris Bennett", "Offensive Coordinator", "Offense"],
    ["Darius Cole", "Position Coach", "Defense"],
  ].map(([name, role, unit]) => ({ id: createId("staff"), name, role, unit, email: "", createdAt: nowIso(), updatedAt: nowIso() }));
  workspace.staff.push(...staff);

  const opponent = addOpponent(workspace, { name: "Central Valley", mascot: "Tigers", abbreviation: "CV", conference: "District 4" });
  const { week } = addGame(workspace, {
    opponentId: opponent.id,
    weekNumber: "1",
    gameDate: "2026-08-28",
    kickoffTime: "19:00",
    locationType: "Home",
    location: "Falcon Stadium",
  });
  week.status = "Planning";

  const demoObservations = [
    ["Run concept", "11 personnel: inside zone is the base call on early downs, especially to the field.", "1st & 10", "11", "2x2 Open", "High", "Verified opponent observation"],
    ["Pass concept", "Trips boundary produces No. 3 vertical with a shallow cross coming back underneath.", "2nd & medium", "11", "3x1 Trips", "High", "Verified opponent observation"],
    ["Protection", "Six-man half-slide protection turns toward the back; boundary edge can isolate the tackle.", "3rd & 6+", "11", "Doubles", "Medium", "Staff interpretation"],
    ["Motion / shift", "Jet motion is used to identify coverage and create split-flow action on the snap.", "1st / 2nd down", "20", "Pistol", "Medium", "Verified opponent observation"],
    ["Situational tendency", "Inside the +10 they condense splits and favor sprint-out toward the quarterback's throwing hand.", "Red zone", "12", "Condensed", "High", "Verified opponent observation"],
  ];

  for (const [category, observation, downDistance, personnel, formation, confidence, sourceState] of demoObservations) {
    addObservation(workspace, {
      weekId: week.id,
      unit: "Defense",
      category,
      observation,
      downDistance,
      personnel,
      formation,
      confidence,
      sourceState,
      sourceLabel: "Staff film study",
      coachOwnerId: staff[1].id,
      tags: "weekly plan",
    });
  }

  const answerSeeds = [
    ["Fit zone from the over front and close the cutback with the backside end.", "Over / Quarters", "Under front changeup", "Alert orbit return", "Backers press the mesh; safety owns late insert."],
    ["Carry No. 3 with the nickel and wall the shallow with the hook defender.", "Match quarters", "Poach check", "Alert fast motion", "Nickel aligns with inside leverage and stays vertical."],
    ["Create the one-on-one, then bring the boundary creeper with simulated pressure presentation.", "Boundary creeper", "Show zero / drop eight", "Check max protection", "End cannot cross the quarterback's level."],
    ["Bump with the motion, keep the box count, and exchange split flow with the overhang.", "Motion bump check", "Spin safety down", "Alert return motion", "Communicate before the ball reaches the tackle box."],
    ["Set the sprint-out edge with force outside and cut the first inside route with the low-hole player.", "Red-zone sprint check", "Bracket primary target", "Alert throwback", "No inside release without collision."],
  ];

  workspace.observations.forEach((observation, index) => {
    const [staffAnswer, primaryCall, changeup, alertCheck, coachingPoint] = answerSeeds[index];
    addAnswer(workspace, {
      weekId: week.id,
      tendencyId: observation.id,
      unit: "Defense",
      staffAnswer,
      primaryCall,
      changeup,
      alertCheck,
      coachingPoint,
      coachOwnerId: index % 2 ? staff[3].id : staff[1].id,
      approvalState: index < 2 ? "Approved" : "Staff review",
      installStatus: index === 0 ? "Complete" : index < 3 ? "Field install" : "Meeting install",
      practiceStatus: index === 0 ? "Ready" : index < 3 ? "Repped" : "Scripted",
      gameDayStatus: index < 2 ? "On call sheet" : "Candidate",
      positionGroups: "DL, LB, DB",
    });
  });

  workspace.revisions = workspace.revisions.slice(0, 12);
  return workspace;
}
