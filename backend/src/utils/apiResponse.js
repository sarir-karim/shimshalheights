/** Every successful response has the shape { success: true, data, meta? }. Errors: { success: false, message, code, errors? }. */
export function ok(res, data, { status = 200, meta } = {}) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}
