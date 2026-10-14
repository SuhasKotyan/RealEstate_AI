export function apiUrl(path, base = import.meta.env?.VITE_API_BASE_URL || '') {
  if (!['health', 'analyze', 'chat'].includes(path)) throw new Error('Unknown API endpoint.');
  const configured = base.trim();
  if (!configured) return `/api/${path}`;
  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('The configured API URL is invalid.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('Use a secure API origin without credentials, a path or query parameters.');
  }
  return `${url.origin}/api/${path}`;
}
