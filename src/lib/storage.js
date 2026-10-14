import { backupSchema } from '../../shared/contracts.mjs';

export const STORAGE_KEY = 'closewise.leads.v1';
export function readLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { leads: null, error: null };
    return { leads: backupSchema.parse(JSON.parse(raw)).leads, error: null };
  } catch {
    return {
      leads: [],
      error:
        'Saved data could not be read. It has not been overwritten. Export the stored backup before resetting.',
    };
  }
}
export function writeLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backupSchema.parse({ version: 1, leads })));
}
export function downloadFile(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportLeads(leads) {
  downloadFile(
    `closewise-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ version: 1, leads }, null, 2),
  );
}
