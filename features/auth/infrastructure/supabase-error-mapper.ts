import { AuthError } from "../domain/errors/auth.errors";

type SupabaseLikeError = {
  name?: string;
  message?: string;
  status?: number;
};

export function mapSupabaseAuthError(err: unknown): AuthError {
  const e = (err ?? {}) as SupabaseLikeError;
  const message = e.message ?? "";
  const status = e.status;
  const name = e.name ?? "";

  if (name === "AuthRetryableFetchError" || /network|fetch/i.test(message)) {
    return new AuthError("NETWORK");
  }

  if (status === 429 || /rate limit|too many/i.test(message)) {
    return new AuthError("RATE_LIMITED");
  }

  if (/email not confirmed/i.test(message)) {
    return new AuthError("EMAIL_NOT_CONFIRMED");
  }

  if (/for security|only request password/i.test(message) || /password.*reset/i.test(message) && status === 422) {
    return new AuthError("PASSWORD_RESET_FAILED");
  }

  if (/same|different.*current|new password should be different/i.test(message)) {
    return new AuthError("SAME_PASSWORD");
  }

  if (/password.*(short|characters|weak|strength)/i.test(message) && status === 422) {
    return new AuthError("WEAK_PASSWORD");
  }

  if (/invalid|expired/i.test(message) && /otp|token|code/i.test(message)) {
    return new AuthError("INVALID_CONFIRMATION_CODE");
  }

  if (status === 400 || status === 401 || /invalid login credentials|user not found/i.test(message)) {
    return new AuthError("INVALID_CREDENTIALS");
  }

  return new AuthError("UNKNOWN");
}
