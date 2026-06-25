import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/features/auth/context/auth.context";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { UpdateAdoptionStatusUseCase } from "../use-cases/update-adoption-status.use-case";
import type { Adoption } from "../domain/entities/adoption.entity";
import { UpdateAdoptionStatusError } from "../domain/errors/update-adoption-status.errors";

const animalRepository = new SupabaseAnimalRepository();
const updateAdoptionStatusUseCase = new UpdateAdoptionStatusUseCase(
  animalRepository,
);

export type UpdateAdoptionStatusInput = {
  adoptionId: string;
  status: string;
  cancelReason?: string;
  visitDate?: string | null;
};

type UseUpdateAdoptionStatusResult = {
  handleUpdateStatus: (
    input: UpdateAdoptionStatusInput,
  ) => Promise<Adoption | null>;
  isLoading: boolean;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof UpdateAdoptionStatusError) {
    return error.message;
  }
  return "Não foi possível atualizar o status da adoção.";
};

export function useUpdateAdoptionStatus(): UseUpdateAdoptionStatusResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateStatus = useCallback(
    async (input: UpdateAdoptionStatusInput): Promise<Adoption | null> => {
      if (!user) {
        Alert.alert("Sessão inválida", "Faça login para atualizar a adoção.");
        return null;
      }

      try {
        setIsLoading(true);
        const updated = await updateAdoptionStatusUseCase.execute({
          userId: user.id,
          adoptionId: input.adoptionId,
          status: input.status,
          cancelReason: input.cancelReason,
          visitDate: input.visitDate,
        });
        return updated;
      } catch (error: unknown) {
        Alert.alert("Erro ao atualizar status", errorMessageFor(error));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return {
    handleUpdateStatus,
    isLoading,
  };
}
