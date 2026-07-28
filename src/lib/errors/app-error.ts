export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PROVIDER_AUTH_ERROR"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "POLICY_VIOLATION";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly metadata: Record<string, string | number | boolean | null>;

  constructor(
    code: AppErrorCode,
    message: string,
    statusCode: number,
    metadata: Record<string, string | number | boolean | null> = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    metadata: Record<string, string | number | boolean | null> = {},
  ) {
    super("VALIDATION_ERROR", message, 400, metadata);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class ProviderAuthError extends AppError {
  constructor(message = "Provider authentication failed") {
    super("PROVIDER_AUTH_ERROR", message, 401);
    this.name = "ProviderAuthError";
  }
}

export class ProviderRateLimitError extends AppError {
  constructor(message = "Provider rate limit exceeded") {
    super("PROVIDER_RATE_LIMIT", message, 429);
    this.name = "ProviderRateLimitError";
  }
}

export class ProviderUnavailableError extends AppError {
  constructor(message = "Provider is temporarily unavailable") {
    super("PROVIDER_UNAVAILABLE", message, 503);
    this.name = "ProviderUnavailableError";
  }
}

export class PolicyViolationError extends AppError {
  constructor(message = "Action violates application policy") {
    super("POLICY_VIOLATION", message, 422);
    this.name = "PolicyViolationError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
