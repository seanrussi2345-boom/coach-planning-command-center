import {
  STORAGE_KEY,
  PACKAGE_TEMPLATES,
  PACKAGE_CATEGORIES,
} from './constants.js';

const routeName = '#/depth-charts';
const unitOrder = ['Offense', 'Defense', 'Special Teams'];
let activeUnit = 'All';
let activePackageId = '';

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const id = (prefix = 'id') => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const nowIso = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));

function loadWorkspace() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    console.warn('Depth chart workspace restore failed.', error);
  }
  return null;
}

function saveWorkspace(workspace, message = '') {
  workspace.personnelPackages ??= [];
  workspace.revisions ??= [];
  workspace.metadata ??= {};
  workspace.metadata.updatedAt = nowIso();
  if (message) {
    workspace.revisions.unshift({ id: id('revision'), action: 'Depth chart updated', detail: message, actor: 'Local staff workspace', createdAt: nowIso() });
    workspace.revisions = workspace.revisions.slice(0, 200);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

function normalizeSlot(slot = {}, index = 0) {
  const backups = Array.isArray(slot.backupPlayerIds) ? slot.backupPlayerIds.slice(0, 2) : [];
  while (backups.length < 2) backups.push('');
  return {
    id: slot.id || id('slot'),
    label: slot.label || `Slot ${index + 1}`,
    positionCode: String(slot.positionCode || '').toUpperCase(),
    starterPlayerId: slot.starterPlayerId || '',
    backupPlayerIds: backups,
    notes: slot.notes || '',
  };
}

function normalizePackage(item = {}) {
  return {
    id: item.id || id('package'),
    name: item.name || 'Untitled Package',
    unit: unitOrder.includes(item.unit) ? item.unit : 'Offense',
    category: PACKAGE_CATEGORIES.includes(item.category) ? item.category : 'Personnel Package',
    templateId: item.templateId || '',
    description: item.description || '',
    slots: Array.isArray(item.slots) ? item.slots.map(normalizeSlot) : [],
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso(),
  };
}

function ensurePackages(workspace) {
  workspace.personnelPackages = Array.isArray(workspace.personnelPackages)
    ? workspace.personnelPackages.map(normalizePackage)
    : [];
  return workspace;
}

function injectNavigation() {
  const nav = document.querySelector('.primary-nav');
  if (!nav || nav.querySelector('[href="#/depth-charts"]')) return;
  const link = document.createElement('a');
  link.href = routeName;
  link.textContent = 'Depth Charts';
  const setupLink = nav.querySelector('[href="#/football-setup"]');
  if (setupLink?.nextSibling) nav.insertBefore(link, setupLink.nextSibling);
  else nav.append(link);
}

function markActiveNavigation() {
  document.querySelectorAll('.primary-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === routeName));
}

function playerName(player) {
  return `${player.jerseyNumber ? `#${player.jerseyNumber} ` : ''}${player.firstName || ''} ${player.lastName || ''}`.trim();
}

function playerFits(player, positionCode) {
  const positions = [player.primaryPosition, ...(player.secondaryPositions || [])].map((value) => String(value || '').toUpperCase());
  return !positionCode || positions.includes(positionCode.toUpperCase());
}

function playerOptions(workspace, selectedId, positionCode, excluded = []) {
  const players = [...(workspace.players || [])].sort((a, b) => {
    const fitDifference = Number(playerFits(b, positionCode)) - Number(playerFits(a, positionCode));
    if (fitDifference) return fitDifference;
    return playerName(a).localeCompare(playerName(b));
  });
  return `<option value="">Unassigned</option>${players.map((player) => {
    const unavailable = player.status && player.status !== 'Available';
    const mismatch = positionCode && !playerFits(player, positionCode);
    const duplicate = excluded.includes(player.id) && player.id !== selectedId;
    const suffix = [player.primaryPosition, unavailable ? player.status : '', mismatch ? 'position mismatch' : '', duplicate ? 'already assigned' : ''].filter(Boolean).join(' · ');
    return `<option value="${esc(player.id)}" ${player.id === selectedId ? 'selected' : ''}>${esc(playerName(player))}${suffix ? ` — ${esc(suffix)}` : ''}</option>`;
  }).join('')}`;
}

function assignedIds(personnelPackage) {
  return personnelPackage.slots.flatMap((slot) => [slot.starterPlayerId, ...(slot.backupPlayerIds || [])]).filter(Boolean);
}

function packageWarnings(workspace, personnelPackage) {
  const warnings = [];
  const seen = new Map();
  for (const slot of personnelPackage.slots) {
    const assignments = [slot.starterPlayerId, ...(slot.backupPlayerIds || [])].filter(Boolean);
    for (const playerId of assignments) {
      const player = workspace.players.find((item) => item.id === playerId);
      if (!player) warnings.push(`${slot.label}: assigned player no longer exists.`);
      else {
        if (player.status && player.status !== 'Available') warnings.push(`${slot.label}: ${playerName(player)} is ${player.status.toLowerCase()}.`);
        if (slot.positionCode && !playerFits(player, slot.positionCode)) warnings.push(`${slot.label}: ${playerName(player)} does not list ${slot.positionCode}.`);
      }
      seen.set(playerId, (seen.get(playerId) || 0) + 1);
    }
  }
  for (const [playerId, count] of seen) {
    if (count > 1) {
      const player = workspace.players.find((item) => item.id === playerId);
      warnings.push(`${player ? playerName(player) : 'A player'} appears ${count} times in this package.`);
    }
  }
  return [...new Set(warnings)];
}

function packageCompletion(personnelPackage) {
  if (!personnelPackage.slots.length) return 0;
  const assigned = personnelPackage.slots.filter((slot) => slot.starterPlayerId).length;
  return Math.round((assigned / personnelPackage.slots.length) * 100);
}

function packageCard(personnelPackage) {
  const completion = packageCompletion(personnelPackage);
  return `<button class="depth-package-card ${personnelPackage.id === activePackageId ? 'active' : ''}" data-package="${esc(personnelPackage.id)}">
    <span class="depth-unit ${personnelPackage.unit.toLowerCase().replaceAll(' ', '-')}">${esc(personnelPackage.unit)}</span>
    <strong>${esc(personnelPackage.name)}</strong>
    <small>${esc(personnelPackage.category)} · ${completion}% starters assigned</small>
    <span class="depth-progress"><i style="width:${completion}%"></i></span>
  </button>`;
}

function slotRow(workspace, personnelPackage, slot, index) {
  const allAssigned = assignedIds(personnelPackage);
  const starter = workspace.players.find((player) => player.id === slot.starterPlayerId);
  const statusClass = starter?.status?.toLowerCase() || '';
  return `<div class="depth-slot" data-slot="${esc(slot.id)}">
    <div class="depth-slot-head">
      <span class="depth-slot-number">${index + 1}</span>
      <label>Role<input class="slot-label" value="${esc(slot.label)}" aria-label="Role label"></label>
      <label>Position<input class="slot-position" value="${esc(slot.positionCode)}" aria-label="Position code" maxlength="12"></label>
      <button class="icon-button remove-slot" title="Remove slot" aria-label="Remove ${esc(slot.label)}">×</button>
    </div>
    <div class="depth-assignments">
      <label class="assignment-card starter ${statusClass}"><span>Starter</span><select class="slot-player" data-depth="starter">${playerOptions(workspace, slot.starterPlayerId, slot.positionCode, allAssigned)}</select></label>
      <label class="assignment-card"><span>Backup 1</span><select class="slot-player" data-depth="0">${playerOptions(workspace, slot.backupPlayerIds[0], slot.positionCode, allAssigned)}</select></label>
      <label class="assignment-card"><span>Backup 2</span><select class="slot-player" data-depth="1">${playerOptions(workspace, slot.backupPlayerIds[1], slot.positionCode, allAssigned)}</select></label>
    </div>
    <label class="depth-slot-notes">Assignment notes<input class="slot-notes" value="${esc(slot.notes)}" placeholder="Matchup, substitution, emergency responsibility"></label>
  </div>`;
}

function packageEditor(workspace, personnelPackage) {
  const warnings = packageWarnings(workspace, personnelPackage);
  return `<article class="panel depth-editor" data-active-package="${esc(personnelPackage.id)}">
    <div class="panel-head depth-editor-head">
      <div><p class="eyebrow">${esc(personnelPackage.unit)} · ${esc(personnelPackage.category)}</p><h2>${esc(personnelPackage.name)}</h2><p class="muted">Assign starters and two backup levels. Player availability and position conflicts are flagged automatically.</p></div>
      <div class="button-row"><button id="duplicate-package" class="button">Duplicate</button><button id="delete-package" class="button danger">Delete</button></div>
    </div>
    <div class="depth-package-settings">
      <label>Package name<input id="package-name" value="${esc(personnelPackage.name)}"></label>
      <label>Unit<select id="package-unit">${unitOrder.map((unit) => `<option ${unit === personnelPackage.unit ? 'selected' : ''}>${unit}</option>`).join('')}</select></label>
      <label>Category<select id="package-category">${PACKAGE_CATEGORIES.map((category) => `<option ${category === personnelPackage.category ? 'selected' : ''}>${category}</option>`).join('')}</select></label>
      <label class="wide">Description<input id="package-description" value="${esc(personnelPackage.description)}" placeholder="When this package is used"></label>
    </div>
    ${warnings.length ? `<div class="depth-warnings"><strong>${warnings.length} assignment check${warnings.length === 1 ? '' : 's'}</strong>${warnings.map((warning) => `<span>${esc(warning)}</span>`).join('')}</div>` : `<div class="depth-ready">No assignment conflicts detected.</div>`}
    <div class="depth-slot-list">${personnelPackage.slots.map((slot, index) => slotRow(workspace, personnelPackage, slot, index)).join('')}</div>
    <div class="depth-editor-actions"><button id="add-slot" class="button">Add custom slot</button><button id="save-package" class="button primary">Save depth chart</button></div>
  </article>`;
}

function createPanel(workspace) {
  const templates = PACKAGE_TEMPLATES.filter((template) => activeUnit === 'All' || template.unit === activeUnit);
  return `<article class="panel depth-create">
    <div class="panel-head"><div><p class="eyebrow">Add a football package</p><h3>Start from a template or build custom</h3></div></div>
    <form id="create-package-form" class="depth-create-grid">
      <label>Template<select name="templateId"><option value="">Custom 11-slot package</option>${templates.map((template) => `<option value="${esc(template.id)}">${esc(template.unit)} · ${esc(template.name)}</option>`).join('')}</select></label>
      <label>Custom name<input name="name" placeholder="Goal Line, Turbo, Red Zone Dime"></label>
      <label>Unit<select name="unit">${unitOrder.map((unit) => `<option ${unit === (activeUnit === 'All' ? 'Offense' : activeUnit) ? 'selected' : ''}>${unit}</option>`).join('')}</select></label>
      <label>Category<select name="category">${PACKAGE_CATEGORIES.map((category) => `<option>${category}</option>`).join('')}</select></label>
      <label class="wide">Custom slot labels, comma-separated<input name="slotLabels" placeholder="QB, RB, X, Z, H, Y, LT, LG, C, RG, RT"></label>
      <button class="button primary">Create package</button>
    </form>
  </article>`;
}

function emptyState(workspace) {
  return `<div class="empty depth-empty"><h2>No depth charts or packages yet</h2><p>Load the starter set to create an offensive 11-personnel chart, a 4-2-5 defensive chart, and core special-teams units, or create one package manually.</p><div class="button-row centered"><button id="load-starter-packages" class="button primary" ${workspace.players?.length ? '' : 'disabled'}>Load starter package set</button></div>${workspace.players?.length ? '' : '<p class="muted">Add or import the roster first.</p>'}</div>`;
}

function renderDepthCharts() {
  if (location.hash !== routeName) return;
  injectNavigation();
  markActiveNavigation();
  const workspace = loadWorkspace();
  const page = document.querySelector('.page');
  const heading = document.querySelector('.page-heading h1');
  if (!page || !workspace) return;
  ensurePackages(workspace);
  if (heading) heading.textContent = 'Depth Charts & Personnel Packages';
  const packages = workspace.personnelPackages.filter((item) => activeUnit === 'All' || item.unit === activeUnit);
  if (!activePackageId || !workspace.personnelPackages.some((item) => item.id === activePackageId)) activePackageId = packages[0]?.id || workspace.personnelPackages[0]?.id || '';
  const activePackage = workspace.personnelPackages.find((item) => item.id === activePackageId);
  page.innerHTML = `<section class="depth-overview">
    <div><p class="eyebrow">One roster · all three phases</p><h2>Build starters, backups, packages, and emergency answers</h2><p>Designed for desktop and iPad: tap a player selector, choose the assignment, and save. Drag-and-drop is not required.</p></div>
    <div class="depth-summary"><span><strong>${workspace.players?.length || 0}</strong> Players</span><span><strong>${workspace.personnelPackages.length}</strong> Packages</span><span><strong>${workspace.personnelPackages.reduce((sum, item) => sum + item.slots.filter((slot) => slot.starterPlayerId).length, 0)}</strong> Starter assignments</span></div>
  </section>
  <div class="depth-unit-tabs">${['All', ...unitOrder].map((unit) => `<button class="${unit === activeUnit ? 'active' : ''}" data-unit="${esc(unit)}">${esc(unit)}</button>`).join('')}</div>
  <div class="depth-layout">
    <aside class="depth-sidebar">${packages.map(packageCard).join('') || '<p class="muted">No packages in this unit.</p>'}<button id="open-create-package" class="button depth-add-package">+ Add package</button></aside>
    <div class="depth-workspace">${workspace.personnelPackages.length ? (activePackage ? packageEditor(workspace, activePackage) : emptyState(workspace)) : emptyState(workspace)}<div id="depth-create-panel" hidden>${createPanel(workspace)}</div></div>
  </div>`;
  bindDepthCharts(workspace);
}

function createFromTemplate(workspace, templateId, fields = {}) {
  const template = PACKAGE_TEMPLATES.find((item) => item.id === templateId);
  const labels = String(fields.slotLabels || '').split(',').map((value) => value.trim()).filter(Boolean);
  const seeds = labels.length ? labels.map((label) => ({ label, positionCode: '' })) : clone(template?.slots || Array.from({ length: 11 }, (_, index) => ({ label: `Slot ${index + 1}`, positionCode: '' })));
  const personnelPackage = normalizePackage({
    id: id('package'),
    name: String(fields.name || template?.name || 'New Package').trim(),
    unit: template?.unit || fields.unit || 'Offense',
    category: template?.category || fields.category || 'Personnel Package',
    templateId: template?.id || '',
    slots: seeds.map((slot) => normalizeSlot({ ...slot, id: id('slot') })),
  });
  workspace.personnelPackages.push(personnelPackage);
  activePackageId = personnelPackage.id;
  saveWorkspace(workspace, `${personnelPackage.name} created`);
}

function loadStarterSet(workspace) {
  const starterIds = ['offense-11', 'defense-425', 'st-kickoff', 'st-punt', 'st-field-goal'];
  starterIds.forEach((templateId) => {
    if (!workspace.personnelPackages.some((item) => item.templateId === templateId)) createFromTemplate(workspace, templateId);
  });
  saveWorkspace(workspace, 'Starter depth chart set loaded');
}

function bindDepthCharts(workspace) {
  document.querySelectorAll('[data-unit]').forEach((button) => button.addEventListener('click', () => { activeUnit = button.dataset.unit; activePackageId = ''; renderDepthCharts(); }));
  document.querySelectorAll('[data-package]').forEach((button) => button.addEventListener('click', () => { activePackageId = button.dataset.package; renderDepthCharts(); }));
  document.querySelector('#open-create-package')?.addEventListener('click', () => {
    const panel = document.querySelector('#depth-create-panel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.querySelector('#load-starter-packages')?.addEventListener('click', () => { loadStarterSet(workspace); renderDepthCharts(); });
  document.querySelector('#create-package-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    createFromTemplate(workspace, data.templateId, data);
    renderDepthCharts();
  });
  const activePackage = workspace.personnelPackages.find((item) => item.id === activePackageId);
  if (!activePackage) return;
  document.querySelector('#save-package')?.addEventListener('click', () => {
    activePackage.name = document.querySelector('#package-name').value.trim() || activePackage.name;
    activePackage.unit = document.querySelector('#package-unit').value;
    activePackage.category = document.querySelector('#package-category').value;
    activePackage.description = document.querySelector('#package-description').value.trim();
    document.querySelectorAll('.depth-slot').forEach((row) => {
      const slot = activePackage.slots.find((item) => item.id === row.dataset.slot);
      if (!slot) return;
      slot.label = row.querySelector('.slot-label').value.trim() || slot.label;
      slot.positionCode = row.querySelector('.slot-position').value.trim().toUpperCase();
      slot.starterPlayerId = row.querySelector('[data-depth="starter"]').value;
      slot.backupPlayerIds = [row.querySelector('[data-depth="0"]').value, row.querySelector('[data-depth="1"]').value];
      slot.notes = row.querySelector('.slot-notes').value.trim();
    });
    activePackage.updatedAt = nowIso();
    saveWorkspace(workspace, `${activePackage.name} assignments saved`);
    renderDepthCharts();
  });
  document.querySelector('#add-slot')?.addEventListener('click', () => { activePackage.slots.push(normalizeSlot({ id: id('slot'), label: `Slot ${activePackage.slots.length + 1}` }, activePackage.slots.length)); saveWorkspace(workspace, `${activePackage.name}: custom slot added`); renderDepthCharts(); });
  document.querySelectorAll('.remove-slot').forEach((button) => button.addEventListener('click', () => { activePackage.slots = activePackage.slots.filter((slot) => slot.id !== button.closest('.depth-slot').dataset.slot); saveWorkspace(workspace, `${activePackage.name}: slot removed`); renderDepthCharts(); }));
  document.querySelector('#duplicate-package')?.addEventListener('click', () => {
    const duplicate = normalizePackage({ ...clone(activePackage), id: id('package'), name: `${activePackage.name} Copy`, slots: activePackage.slots.map((slot) => ({ ...slot, id: id('slot') })), createdAt: nowIso(), updatedAt: nowIso() });
    workspace.personnelPackages.push(duplicate); activePackageId = duplicate.id; saveWorkspace(workspace, `${activePackage.name} duplicated`); renderDepthCharts();
  });
  document.querySelector('#delete-package')?.addEventListener('click', () => {
    if (!confirm(`Delete ${activePackage.name}?`)) return;
    workspace.personnelPackages = workspace.personnelPackages.filter((item) => item.id !== activePackage.id); activePackageId = ''; saveWorkspace(workspace, `${activePackage.name} deleted`); renderDepthCharts();
  });
}

function afterAppRender() {
  injectNavigation();
  if (location.hash === routeName) setTimeout(renderDepthCharts, 0);
}

window.addEventListener('hashchange', afterAppRender);
new MutationObserver(() => injectNavigation()).observe(document.querySelector('#app'), { childList: true, subtree: true });
afterAppRender();
