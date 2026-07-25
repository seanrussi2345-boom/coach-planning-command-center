import test from "node:test";
import assert from "node:assert/strict";
import {
  addAnswer, addGame, addObservation, addOpponent, addPlayer, addPosition,
  createDistrictDemoWorkspace, createEmptyWorkspace, getDashboardMetrics,
  importRosterRows, normalizeWorkspace, parseRosterText,
} from "../site/src/domain.js";
import { DISTRICT_6_DEMO_PROGRAMS, STORAGE_KEY, WORKSPACE_SCHEMA_VERSION } from "../site/src/constants.js";

test("workspace starts with isolated Three Phase HQ data", () => {
  const workspace = createEmptyWorkspace();
  assert.equal(workspace.schemaVersion, WORKSPACE_SCHEMA_VERSION);
  assert.equal(STORAGE_KEY, "three-phase-hq.workspace.v2");
  assert.equal(workspace.players.length, 0);
  assert.ok(workspace.positionCatalog.length >= 30);
  assert.equal(Object.hasOwn(workspace.team, "mascot"), false);
});

test("one player can carry multiple phase positions", () => {
  const workspace = createEmptyWorkspace();
  const player = addPlayer(workspace, { jerseyNumber: "2", firstName: "Jordan", lastName: "Ellis", primaryPosition: "WR", secondaryPositions: "CB, KR" });
  assert.equal(player.primaryPosition, "WR");
  assert.deepEqual(player.secondaryPositions, ["CB", "KR"]);
});

test("staffs can add custom football terminology", () => {
  const workspace = createEmptyWorkspace();
  addPosition(workspace, { code: "STAR", name: "Star Hybrid", unit: "Defense", group: "Defensive Backs" });
  assert.ok(workspace.positionCatalog.some((position) => position.code === "STAR"));
});

test("roster paste is previewed and duplicate-safe", () => {
  const workspace = createEmptyWorkspace();
  const rows = parseRosterText("Number,Name,Position,Grade,Height,Weight\n1,Jordan Ellis,QB,12,6-1,185\n2,Malik Reed,WR,11,5-10,170");
  assert.equal(rows.length, 2);
  assert.equal(importRosterRows(workspace, rows), 2);
  assert.equal(importRosterRows(workspace, rows), 0);
});

test("game creation opens a linked weekly workspace", () => {
  const workspace = createEmptyWorkspace();
  const opponent = addOpponent(workspace, { name: "Central Valley" });
  const { game, week } = addGame(workspace, { opponentId: opponent.id, weekNumber: "1", locationType: "Home" });
  assert.equal(week.gameId, game.id);
  assert.equal(workspace.ui.activeWeekId, week.id);
});

test("tendency and answer produce dashboard counts", () => {
  const workspace = createEmptyWorkspace();
  const opponent = addOpponent(workspace, { name: "Central Valley" });
  const { week } = addGame(workspace, { opponentId: opponent.id, weekNumber: "1", locationType: "Home" });
  const tendency = addObservation(workspace, { weekId: week.id, observation: "Trips boundary creates vertical No. 3.", confidence: "High", sourceState: "Verified opponent observation" });
  addAnswer(workspace, { weekId: week.id, tendencyId: tendency.id, staffAnswer: "Carry No. 3 with the nickel.", approvalState: "Approved", installStatus: "Complete", practiceStatus: "Ready", gameDayStatus: "On call sheet" });
  assert.equal(getDashboardMetrics(workspace, week.id).approvalPercent, 100);
});

test("District 6 demo uses four verified program examples and fictional football data", () => {
  assert.deepEqual(DISTRICT_6_DEMO_PROGRAMS.map((team) => team.name), ["Dr. Phillips High", "Ocoee High", "Olympia High", "West Orange High"]);
  const workspace = createDistrictDemoWorkspace("Olympia High");
  assert.equal(workspace.team.name, "Olympia High");
  assert.ok(workspace.players.length >= 18);
  assert.equal(workspace.opponents.length, 3);
  assert.ok(workspace.observations.some((item) => item.unit === "Special Teams"));
});

test("version-one backups migrate without mascot data", () => {
  const normalized = normalizeWorkspace({ schemaVersion: 1, team: { name: "Legacy Team", mascot: "Unused" } });
  assert.equal(normalized.schemaVersion, WORKSPACE_SCHEMA_VERSION);
  assert.equal(Object.hasOwn(normalized.team, "mascot"), false);
});

test("unsupported future versions are rejected", () => {
  assert.throws(() => normalizeWorkspace({ schemaVersion: 99 }), /Unsupported workspace version/);
});
