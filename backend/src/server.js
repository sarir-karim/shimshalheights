import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import "./models/index.js";
import { logger } from "./utils/logger.js";

await connectDB();
// Make sure unique indexes (booking reference, room slug, inventory per night) exist before serving traffic.
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

const server = createApp().listen(env.PORT, () => logger.info(`API listening on :${env.PORT} (${env.NODE_ENV})`));

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection:", reason));
