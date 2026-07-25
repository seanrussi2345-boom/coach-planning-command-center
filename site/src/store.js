import { STORAGE_KEY, LEGACY_STORAGE_KEYS } from './constants.js';
import { createEmptyWorkspace, normalizeWorkspace } from './domain.js';

export function loadWorkspace(storage = globalThis.localStorage) {
  if (!storage) return createEmptyWorkspace();
  const keys = [STORAGE_KEY, ...(LEGACY_STORAGE_KEYS || [])];
  for (const key of keys) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {
      const workspace = normalizeWorkspace(JSON.parse(raw));
      if (key !== STORAGE_KEY) {
        storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
        storage.removeItem(key);
      }
      return workspace;
    } catch (error) {
      console.warn(`Workspace restore failed for ${key}.`, error);
    }
  }
  return createEmptyWorkspace();
}

export function saveWorkspace(workspace, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function clearWorkspace(storage = globalThis.localStorage) {
  storage?.removeItem(STORAGE_KEY);
  for (const key of LEGACY_STORAGE_KEYS || []) storage?.removeItem(key);
}

export function downloadWorkspace(workspace) {
  const teamSlug = (workspace.team.name || 'team').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${teamSlug || 'team'}-three-phase-hq-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function readWorkspaceFile(file) {
  if (!file) throw new Error('Choose a JSON backup file first.');
  const text = await file.text();
  return normalizeWorkspace(JSON.parse(text));
}
