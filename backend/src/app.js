import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { originCheck } from "./middleware/originCheck.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin/no-Origin requests (curl, server-to-server) and the configured frontends only.
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  app.use("/api", globalLimiter, originCheck, routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
