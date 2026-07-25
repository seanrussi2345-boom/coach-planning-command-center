import test from "node:test";
import assert from "node:assert/strict";
import { createDistrictDemoWorkspace, getPackageStats } from "../site/src/domain.js";

const requiredPackages = [
  "11 Personnel", "12 Personnel", "10 Personnel", "21 Personnel",
  "Base 4-2-5", "Base 3-3-5", "Dime", "Goal Line 6-2", "3rd Down Pressure",
  "Kickoff", "Kickoff Return", "Punt", "Punt Return", "Field Goal / PAT", "Field Goal Block",
];

test("full District 6 demonstration loads 55 fictional players", () => {
  const workspace = createDistrictDemoWorkspace("Dr. Phillips High");
  assert.equal(workspace.players.length, 55);
  assert.equal(workspace.metadata.demoProfile.fictional, true);
  assert.equal(workspace.metadata.demoProfile.rosterCount, 55);
  assert.ok(workspace.players.every((player) => player.notes.includes("Fictional demonstration player")));
  assert.deepEqual(new Set(workspace.players.map((player) => player.status)), new Set(["Available", "Limited", "Injured", "Inactive"]));
});

test("full demonstration preloads all three phases and fifteen packages", () => {
  const workspace = createDistrictDemoWorkspace("Dr. Phillips High");
  assert.equal(workspace.personnelPackages.length, 15);
  assert.equal(workspace.metadata.demoProfile.packageCount, 15);
  assert.deepEqual(new Set(workspace.personnelPackages.map((item) => item.unit)), new Set(["Offense", "Defense", "Special Teams"]));
  for (const name of requiredPackages) assert.ok(workspace.personnelPackages.some((item) => item.name === name), name);
});

test("every demonstration package has eleven unique starters", () => {
  const workspace = createDistrictDemoWorkspace("Dr. Phillips High");
  const playerIds = new Set(workspace.players.map((player) => player.id));
  for (const personnelPackage of workspace.personnelPackages) {
    const stats = getPackageStats(workspace, personnelPackage);
    assert.equal(personnelPackage.slots.length, 11, personnelPackage.name);
    assert.equal(stats.assignedStarters, 11, personnelPackage.name);
    assert.equal(stats.completionPercent, 100, personnelPackage.name);
    assert.deepEqual(stats.duplicateStarterIds, [], personnelPackage.name);
    for (const slot of personnelPackage.slots) assert.ok(playerIds.has(slot.starterPlayerId), `${personnelPackage.name}: ${slot.label}`);
  }
});

test("demonstration includes backups and targeted availability warnings", () => {
  const workspace = createDistrictDemoWorkspace("Dr. Phillips High");
  const backupAssignments = workspace.personnelPackages.reduce((count, personnelPackage) => count + personnelPackage.slots.flatMap((slot) => slot.backupPlayerIds).filter(Boolean).length, 0);
  assert.ok(backupAssignments >= 200);
  const warningPackages = workspace.personnelPackages.filter((personnelPackage) => getPackageStats(workspace, personnelPackage).unavailableIds.length).map((item) => item.name).sort();
  assert.deepEqual(warningPackages, ["Base 4-2-5", "Punt"]);
});

test("reloading a selected demo restores the same test structure", () => {
  const first = createDistrictDemoWorkspace("Olympia High");
  const second = createDistrictDemoWorkspace("Olympia High");
  assert.equal(first.team.name, second.team.name);
  assert.equal(first.players.length, second.players.length);
  assert.deepEqual(first.personnelPackages.map((item) => item.name), second.personnelPackages.map((item) => item.name));
  assert.notEqual(first.metadata.workspaceId, second.metadata.workspaceId);
});
