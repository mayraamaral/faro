import { useCallback, useEffect, useState } from "react";

import { useChatIdentity } from "@/features/chat/hooks/use-chat-identity";
import { FavoriteError } from "../domain/errors/favorite.errors";
import type { FavoriteAnimal } from "../domain/entities/favorite-animal.entity";
import { SupabaseFavoriteRepository } from "../infrastructure/supabase-favorite.repository";
import { GetFavoritesUseCase } from "../use-cases/get-favorites.use-case";

const favoriteRepository = new SupabaseFavoriteRepository();
const getFavoritesUseCase = new GetFavoritesUseCase(favoriteRepository);

type UseFavoritesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; favorites: FavoriteAnimal[] };

export type UseFavoritesResult = UseFavoritesState & {
  refresh: () => Promise<void>;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof FavoriteError) {
    if (error.code === "ADOPTER_PROFILE_REQUIRED") {
      return "Seu perfil de adotante não foi encontrado.";
    }
    if (error.code === "FETCH_FAILED") {
      return "Não foi possível carregar seus favoritos.";
    }
    return "Algo deu errado. Tente novamente.";
  }
  return "Algo deu errado. Tente novamente.";
};

export function useFavorites(): UseFavoritesResult {
  const identity = useChatIdentity();
  const [state, setState] = useState<UseFavoritesState>({ status: "loading" });

  const load = useCallback(async () => {
    if (identity.status === "loading") {
      setState({ status: "loading" });
      return;
    }

    if (identity.status !== "ready" || !identity.viewer.isAdopter) {
      setState({ status: "empty" });
      return;
    }

    const adopterProfileId = identity.viewer.adopterProfileIdValue;
    if (!adopterProfileId) {
      setState({ status: "empty" });
      return;
    }

    setState({ status: "loading" });

    try {
      const favorites = await getFavoritesUseCase.execute(adopterProfileId);

      if (favorites.length === 0) {
        setState({ status: "empty" });
        return;
      }

      setState({ status: "ready", favorites });
    } catch (caught) {
      setState({ status: "error", message: errorMessageFor(caught) });
    }
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    refresh: load,
  };
}
