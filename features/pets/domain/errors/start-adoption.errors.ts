export type StartAdoptionErrorCode =
  | "ANIMAL_ID_REQUIRED"
  | "ADOPTER_PROFILE_REQUIRED"
  | "ADOPTION_CREATE_FAILED"
  | "UNKNOWN";

export class StartAdoptionError extends Error {
  readonly code: StartAdoptionErrorCode;

  constructor(code: StartAdoptionErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "StartAdoptionError";
  }
}
