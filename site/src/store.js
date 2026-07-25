import { STORAGE_KEY } from "./constants.js";
import { createEmptyWorkspace, normalizeWorkspace } from "./domain.js";

export function loadWorkspace(storage = globalThis.localStorage) {
  if (!storage) return createEmptyWorkspace();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyWorkspace();
  try {
    return normalizeWorkspace(JSON.parse(raw));
  } catch (error) {
    console.warn("Workspace restore failed; starting a clean workspace.", error);
    return createEmptyWorkspace();
  }
}

export function saveWorkspace(workspace, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function clearWorkspace(storage = globalThis.localStorage) {
  storage?.removeItem(STORAGE_KEY);
}

export function downloadWorkspace(workspace) {
  const teamSlug = (workspace.team.name || "team").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${teamSlug || "team"}-coach-planning-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function readWorkspaceFile(file) {
  if (!file) throw new Error("Choose a JSON backup file first.");
  const text = await file.text();
  return normalizeWorkspace(JSON.parse(text));
}
