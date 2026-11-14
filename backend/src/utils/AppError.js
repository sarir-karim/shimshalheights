export class AppError extends Error {
  constructor(message, status = 500, code = "ERROR", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
  static badRequest(message, details) { return new AppError(message, 400, "BAD_REQUEST", details); }
  static unauthorized(message = "Authentication required") { return new AppError(message, 401, "UNAUTHORIZED"); }
  static forbidden(message = "You do not have permission to do this") { return new AppError(message, 403, "FORBIDDEN"); }
  static notFound(message = "Not found") { return new AppError(message, 404, "NOT_FOUND"); }
  static conflict(message, code = "CONFLICT") { return new AppError(message, 409, code); }
}
