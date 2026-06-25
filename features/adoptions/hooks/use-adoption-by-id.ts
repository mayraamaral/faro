import { useCallback, useEffect, useState } from "react";

import { SupabaseAdoptionRepository } from "../infrastructure/supabase-adoption.repository";
import type { AdoptionEntity } from "../domain/entities/adoption.entity";
import { GetAdoptionByIdUseCase } from "../use-cases/get-adoption-by-id.use-case";
import { AdoptionError } from "../domain/errors/adoption.error";

const adoptionRepository = new SupabaseAdoptionRepository();
const getAdoptionByIdUseCase = new GetAdoptionByIdUseCase(adoptionRepository);

export type UseAdoptionByIdState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; adoption: AdoptionEntity };

export type UseAdoptionByIdResult = {
  state: UseAdoptionByIdState;
  refetch: () => Promise<void>;
};

export function useAdoptionById(adoptionId: string | null): UseAdoptionByIdResult {
  const [state, setState] = useState<UseAdoptionByIdState>({ status: "loading" });

  const fetchAdoption = useCallback(async () => {
    if (!adoptionId) {
      setState({ status: "error", message: "Adoção inválida." });
      return;
    }

    setState({ status: "loading" });
    try {
      const adoption = await getAdoptionByIdUseCase.execute(adoptionId);
      if (!adoption) {
        setState({ status: "error", message: "Adoção não encontrada." });
        return;
      }
      setState({ status: "ready", adoption });
    } catch (error) {
      console.error("[useAdoptionById] failed to load adoption", error);
      if (error instanceof AdoptionError) {
        setState({ status: "error", message: error.message });
        return;
      }
      if (error instanceof Error && error.message) {
        setState({ status: "error", message: error.message });
        return;
      }
      setState({ status: "error", message: "Não foi possível carregar o status da adoção." });
    }
  }, [adoptionId]);

  useEffect(() => {
    void fetchAdoption();
  }, [fetchAdoption]);

  return { state, refetch: fetchAdoption };
}
