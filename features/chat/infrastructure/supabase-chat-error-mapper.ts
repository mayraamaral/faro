import type { ChatErrorCode } from "../domain/errors/chat.errors";
import { ChatError } from "../domain/errors/chat.errors";

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
};

const PGRST_FOREIGN_KEY_VIOLATION = "23503";
const PGRST_UNIQUE_VIOLATION = "23505";
const PGRST_CHECK_VIOLATION = "23514";
const PGRST_NO_ROWS = "PGRST116";

const AUTH_403_DENIED = "42501";

const mapErrorCode = (supabaseCode: string | null | undefined): ChatErrorCode => {
  switch (supabaseCode) {
    case PGRST_NO_ROWS:
      return "CONVERSATION_NOT_FOUND";
    case AUTH_403_DENIED:
    case PGRST_FOREIGN_KEY_VIOLATION:
    case PGRST_CHECK_VIOLATION:
    case PGRST_UNIQUE_VIOLATION:
      return "UNAUTHORIZED";
    default:
      return "UNKNOWN";
  }
};

export const mapSupabaseChatError = (
  error: SupabaseLikeError,
  fallback: ChatErrorCode
): ChatError => {
  const code = error.code ?? null;
  const resolvedCode = code ? mapErrorCode(code) : fallback;

  return new ChatError(resolvedCode, error.message ?? undefined);
};
