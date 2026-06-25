import { useCallback, useEffect, useRef, useState } from "react";

import { useChatIdentity } from "@/features/chat/hooks/use-chat-identity";
import { FavoriteError } from "../domain/errors/favorite.errors";
import { SupabaseFavoriteRepository } from "../infrastructure/supabase-favorite.repository";
import { ToggleFavoriteUseCase } from "../use-cases/toggle-favorite.use-case";

const favoriteRepository = new SupabaseFavoriteRepository();
const toggleFavoriteUseCase = new ToggleFavoriteUseCase(favoriteRepository);

export type UseToggleFavoriteResult = {
  isFavorited: boolean;
  isToggling: boolean;
  error: string | null;
  toggle: () => Promise<void>;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof FavoriteError) {
    if (error.code === "ADOPTER_PROFILE_REQUIRED") {
      return "Seu perfil de adotante não foi encontrado.";
    }
    if (error.code === "ANIMAL_ID_REQUIRED") {
      return "Pet inválido.";
    }
    if (error.code === "TOGGLE_FAILED") {
      return "Não foi possível favoritar o pet. Tente novamente.";
    }
    return "Algo deu errado. Tente novamente.";
  }
  return "Algo deu errado. Tente novamente.";
};

export function useToggleFavorite(
  animalId: string | null | undefined,
): UseToggleFavoriteResult {
  const identity = useChatIdentity();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const checkFavorited = async () => {
      if (!animalId || identity.status !== "ready" || !identity.viewer.isAdopter) {
        setIsFavorited(false);
        return;
      }

      const adopterProfileId = identity.viewer.adopterProfileIdValue;
      if (!adopterProfileId) {
        return;
      }

      try {
        const favorited = await favoriteRepository.isFavorited(
          adopterProfileId,
          animalId,
        );

        if (cancelled) return;
        setIsFavorited(favorited);
        loadedRef.current = true;
      } catch {
        if (!cancelled) {
          setError("Não foi possível verificar o favorito.");
        }
      }
    };

    void checkFavorited();

    return () => {
      cancelled = true;
    };
  }, [animalId, identity]);

  const toggle = useCallback(async () => {
    if (isToggling) return;

    if (identity.status !== "ready") {
      setError("Aguarde o carregamento da sua conta.");
      return;
    }

    if (!identity.viewer.isAdopter) {
      setError("Apenas adotantes podem favoritar pets.");
      return;
    }

    const adopterProfileId = identity.viewer.adopterProfileIdValue;
    if (!adopterProfileId) {
      setError("Seu perfil de adotante não foi encontrado.");
      return;
    }

    if (!animalId) {
      setError("Pet inválido.");
      return;
    }

    setIsToggling(true);
    setError(null);

    try {
      const newState = await toggleFavoriteUseCase.execute(
        adopterProfileId,
        animalId,
      );
      setIsFavorited(newState);
    } catch (caught) {
      setError(errorMessageFor(caught));
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, identity, animalId]);

  return { isFavorited, isToggling, error, toggle };
}
