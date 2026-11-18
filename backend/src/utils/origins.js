/** Normalize configured URLs without matching other hosts or subdomains. */
export function normalizeOrigin(value) {
  try {
    const url = new URL(value.trim().replace(/^["']|["']$/g, ''));
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}

export function allowedOrigins(configured, production = false) {
  const origins = configured.split(',').map(normalizeOrigin).filter(Boolean);
  // The production frontend is explicitly trusted; additional domains remain configurable.
  if (production) origins.push('https://shimshalheights-frontend.vercel.app');
  return [...new Set(origins)];
}
