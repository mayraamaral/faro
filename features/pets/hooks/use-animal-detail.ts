import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/context/auth.context";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { GetAnimalDetailUseCase } from "../use-cases/get-animal-detail.use-case";
import type { AnimalDetail } from "../domain/repositories/animal.repository";

type UseAnimalDetailResult = {
  status: "loading" | "error" | "ready";
  message: string | null;
  detail: AnimalDetail | null;
  refresh: () => Promise<void>;
};

const animalRepository = new SupabaseAnimalRepository();
const getAnimalDetailUseCase = new GetAnimalDetailUseCase(animalRepository);

export function useAnimalDetail(animalId: string | null): UseAnimalDetailResult {
  const { user } = useAuth();
  const [state, setState] = useState<{
    status: "loading" | "error" | "ready";
    message: string | null;
    detail: AnimalDetail | null;
  }>({ status: "loading", message: null, detail: null });

  const load = useCallback(async () => {
    if (!user || !animalId) {
      setState({ status: "error", message: "Pet não encontrado.", detail: null });
      return;
    }

    setState((current) =>
      current.status === "ready" && current.detail !== null
        ? current
        : { ...current, status: "loading" },
    );

    try {
      const detail = await getAnimalDetailUseCase.execute(user.id, animalId);
      if (!detail) {
        setState({
          status: "error",
          message: "Pet não encontrado.",
          detail: null,
        });
        return;
      }
      setState({ status: "ready", message: null, detail });
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar o pet.";
      setState((current) =>
        current.status === "ready" && current.detail !== null
          ? { ...current, status: "error", message }
          : { status: "error", message, detail: null },
      );
    }
  }, [user, animalId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    status: state.status,
    message: state.message,
    detail: state.detail,
    refresh: load,
  };
}
