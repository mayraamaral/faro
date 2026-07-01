export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_CONFIRMATION_CODE"
  | "EMAIL_NOT_CONFIRMED"
  | "PASSWORD_RESET_FAILED"
  | "SAME_PASSWORD"
  | "WEAK_PASSWORD"
  | "RATE_LIMITED"
  | "NETWORK"
  | "UNKNOWN";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "AuthError";
  }
}
