export type ChatErrorCode =
  | "MESSAGE_SEND_FAILED"
  | "MESSAGES_FETCH_FAILED"
  | "CONVERSATION_CREATE_FAILED"
  | "CONVERSATION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class ChatError extends Error {
  readonly code: ChatErrorCode;

  constructor(code: ChatErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "ChatError";
  }
}
