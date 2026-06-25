export type FavoriteErrorCode =
  | "ADOPTER_PROFILE_REQUIRED"
  | "ANIMAL_ID_REQUIRED"
  | "TOGGLE_FAILED"
  | "FETCH_FAILED"
  | "UNKNOWN";

export class FavoriteError extends Error {
  readonly code: FavoriteErrorCode;

  constructor(code: FavoriteErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "FavoriteError";
  }
}
