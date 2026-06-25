import { PetSearchError } from "../domain/errors/pet-search.errors";

type SupabaseLikeError = {
  name?: string;
  message?: string;
  code?: string;
  status?: number;
};

export function mapSupabasePetSearchError(err: unknown): PetSearchError {
  const error = (err ?? {}) as SupabaseLikeError;
  const message = error.message ?? "";
  const name = error.name ?? "";

  if (name.includes("FetchError") || /network|fetch/i.test(message)) {
    return new PetSearchError("SEARCH_UNAVAILABLE");
  }

  return new PetSearchError("UNKNOWN");
}
