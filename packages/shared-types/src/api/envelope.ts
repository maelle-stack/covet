/** Standard error shape for all Covet API responses. */
export interface ApiError {
  code: string;
  /** Calm, specific, user-presentable message (docs/04_design_system.md errors). */
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}
