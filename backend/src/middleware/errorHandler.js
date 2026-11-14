import { ZodError } from "zod";
import mongoose from "mongoose";
import multer from "multer";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export function notFound(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl.split("?")[0]}`));
}

const zodDetails = (err) => err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));

/** Single place that turns every failure into { success:false, message, code, errors? }. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let errors;

  if (err instanceof AppError) {
    ({ status, code, message } = err);
    errors = err.details;
  } else if (err instanceof ZodError) {
    status = 422; code = "VALIDATION_ERROR"; message = "Please check the highlighted fields"; errors = zodDetails(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422; code = "VALIDATION_ERROR"; message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400; code = "BAD_REQUEST"; message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409; code = "DUPLICATE"; message = `A record with that ${Object.keys(err.keyPattern ?? {})[0] ?? "value"} already exists`;
  } else if (err instanceof multer.MulterError) {
    status = 400; code = "UPLOAD_ERROR";
    message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (maximum 5 MB)" : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "Too many files" : "Upload failed";
  } else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    status = 401; code = "UNAUTHORIZED"; message = "Session expired. Please sign in again.";
  } else if (err?.type === "entity.parse.failed") {
    status = 400; code = "BAD_REQUEST"; message = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    status = 413; code = "PAYLOAD_TOO_LARGE"; message = "Request body is too large";
  }

  if (status >= 500) logger.error(err);
  res.status(status).json({
    success: false,
    message,
    code,
    ...(errors ? { errors } : {}),
    ...(env.isProd || status < 500 ? {} : { stack: err.stack }),
  });
}
