export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'BAD_GATEWAY'
  | 'UNAVAILABLE';

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  UNAUTHORIZED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    statusOrMessage?: number | string,
    message?: string,
    details?: unknown,
  ) {
    const status = typeof statusOrMessage === 'number' ? statusOrMessage : DEFAULT_STATUS[code];
    const msg = typeof statusOrMessage === 'string' ? statusOrMessage : (message ?? code);
    super(msg);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'AppError';
  }
}
