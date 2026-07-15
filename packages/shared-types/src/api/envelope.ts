/** Standard error shape for all Covet API responses. */
export interface ApiError {
  code: string;
  /** Calm, specific, user-presentable message (docs/04_design_system.md errors). */
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Success envelope for all Covet API responses. Every endpoint returns
 * either `{ data }` or `{ error }` so the mobile client can unwrap one
 * consistent shape (docs/05_engineering_architecture.md: typed, stable
 * contracts).
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
