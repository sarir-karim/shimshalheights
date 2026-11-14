import { env } from "../config/env.js";

const write = (level, ...args) => {
  if (env.isTest && level !== "error") return;
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](`[${new Date().toISOString()}] ${level.toUpperCase()}`, ...args);
};

export const logger = {
  info: (...a) => write("info", ...a),
  warn: (...a) => write("warn", ...a),
  error: (...a) => write("error", ...a),
};
