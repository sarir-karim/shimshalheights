/** Strips Mongo operator injection ({"$ne": null}) and dotted keys from body, query and params. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      out[key] = clean(v);
    }
    return out;
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = clean(req.body);
  if (req.query) {
    const cleaned = clean(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleaned);
  }
  if (req.params) req.params = clean(req.params);
  next();
}
