export type AdoptionErrorCode =
  | 'ADOPTION_NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'MISSING_REQUIRED_FIELDS'
  | 'NOT_AUTHORIZED'
  | 'ANIMAL_NOT_AVAILABLE'
  | 'INVALID_INPUT';

export class AdoptionError extends Error {
  public readonly code: AdoptionErrorCode;
  public readonly details?: unknown;

  constructor(message: string, code: AdoptionErrorCode, details?: unknown) {
    super(message);
    this.name = 'AdoptionError';
    this.code = code;
    this.details = details;
  }
}
