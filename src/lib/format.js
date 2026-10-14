export function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}
export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...options }).format(
    new Date(value),
  );
}
export function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}
export function localDateInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function makeActivity(type, text) {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), type, text };
}
export function makeDraft(intake) {
  return {
    id: crypto.randomUUID(),
    intake,
    analysis: null,
    source: 'draft',
    status: 'New',
    createdAt: new Date().toISOString(),
    analyzedAt: null,
    model: null,
    followup: null,
    activity: [],
    chat: [],
  };
}
