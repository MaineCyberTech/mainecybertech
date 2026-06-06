export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function failure(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): ApiResponse {
  return {
    success: false,
    error: { code, message, status, ...(details && { details }) },
  };
}

export interface AuthUser {
  userId: string;
  email: string;
  roleKey?: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthenticatedRequest extends Request {
  authUser?: {
    userId: string;
    email: string;
  };
}
