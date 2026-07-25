import test from "node:test";
import assert from "node:assert/strict";
import {
  addAnswer,
  addGame,
  addObservation,
  addOpponent,
  createDemoWorkspace,
  createEmptyWorkspace,
  getDashboardMetrics,
  normalizeWorkspace,
} from "../site/src/domain.js";
import { STORAGE_KEY, WORKSPACE_SCHEMA_VERSION } from "../site/src/constants.js";

test("workspace starts with an isolated schema and storage key", () => {
  const workspace = createEmptyWorkspace();
  assert.equal(workspace.schemaVersion, WORKSPACE_SCHEMA_VERSION);
  assert.equal(STORAGE_KEY, "coach-planning-command-center.workspace.v1");
  assert.deepEqual(workspace.opponents, []);
  assert.deepEqual(workspace.answers, []);
});

test("game creation opens a linked weekly workspace", () => {
  const workspace = createEmptyWorkspace();
  const opponent = addOpponent(workspace, { name: "Central Valley" });
  const { game, week } = addGame(workspace, { opponentId: opponent.id, weekNumber: "1", locationType: "Home" });
  assert.equal(week.gameId, game.id);
  assert.equal(workspace.ui.activeWeekId, week.id);
});

test("tendency and planned answer produce dashboard counts", () => {
  const workspace = createEmptyWorkspace();
  const opponent = addOpponent(workspace, { name: "Central Valley" });
  const { week } = addGame(workspace, { opponentId: opponent.id, weekNumber: "1", locationType: "Home" });
  const tendency = addObservation(workspace, { weekId: week.id, observation: "Trips boundary creates vertical No. 3.", confidence: "High", sourceState: "Verified opponent observation" });
  addAnswer(workspace, { weekId: week.id, tendencyId: tendency.id, staffAnswer: "Carry No. 3 with the nickel.", approvalState: "Approved", installStatus: "Complete", practiceStatus: "Ready", gameDayStatus: "On call sheet" });
  assert.deepEqual(getDashboardMetrics(workspace, week.id), {
    observationCount: 1,
    answerCount: 1,
    unansweredCount: 0,
    approved: 1,
    installed: 1,
    practiceReady: 1,
    onCallSheet: 1,
    installationPercent: 100,
    approvalPercent: 100,
  });
});

test("demo workspace satisfies the five-tendency acceptance path", () => {
  const workspace = createDemoWorkspace();
  assert.ok(workspace.observations.length >= 5);
  assert.equal(workspace.answers.length, workspace.observations.length);
  assert.ok(workspace.staff.length >= 2);
});

test("import normalization rejects incompatible versions", () => {
  assert.throws(() => normalizeWorkspace({ schemaVersion: 99 }), /Unsupported workspace version/);
});
