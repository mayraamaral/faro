export type UpdateAdoptionStatusErrorCode =
  | "ADOPTION_ID_REQUIRED"
  | "LISTER_NOT_FOUND"
  | "ADOPTION_NOT_FOUND"
  | "INVALID_STATUS"
  | "UPDATE_FAILED"
  | "UNKNOWN";

export class UpdateAdoptionStatusError extends Error {
  readonly code: UpdateAdoptionStatusErrorCode;

  constructor(code: UpdateAdoptionStatusErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "UpdateAdoptionStatusError";
  }
}
