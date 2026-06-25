export type PetSearchErrorCode =
  | "LOCATION_UNAVAILABLE"
  | "SEARCH_OPTIONS_UNAVAILABLE"
  | "SEARCH_UNAVAILABLE"
  | "UNKNOWN";

export class PetSearchError extends Error {
  readonly code: PetSearchErrorCode;

  constructor(code: PetSearchErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "PetSearchError";
  }
}
