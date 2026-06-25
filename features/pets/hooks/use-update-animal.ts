import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/context/auth.context";
import type { CreateAnimalFormData } from "../schemas/create-animal.schema";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { SupabaseAnimalPhotoRepository } from "../infrastructure/supabase-animal-photo.repository";
import { UpdateAnimalUseCase } from "../use-cases/update-animal.use-case";

const animalRepository = new SupabaseAnimalRepository();
const animalPhotoRepository = new SupabaseAnimalPhotoRepository();
const updateAnimalUseCase = new UpdateAnimalUseCase(
  animalRepository,
  animalPhotoRepository,
);

type UseUpdateAnimalResult = {
  handleUpdateAnimal: (
    animalId: string,
    data: CreateAnimalFormData,
    keptExistingPhotoStoragePaths: string[],
  ) => Promise<boolean>;
  isLoading: boolean;
};

export function useUpdateAnimal(
  onSuccessRedirectPath = "/my-pets",
): UseUpdateAnimalResult {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateAnimal = useCallback(
    async (
      animalId: string,
      data: CreateAnimalFormData,
      keptExistingPhotoStoragePaths: string[],
    ): Promise<boolean> => {
      if (!user) {
        Alert.alert("Sessão inválida", "Faça login novamente para editar o pet.");
        return false;
      }

      try {
        setIsLoading(true);
        await updateAnimalUseCase.execute(user.id, {
          animalId,
          data,
          keptExistingPhotoStoragePaths,
        });
        Alert.alert("Pet atualizado", "As alterações foram salvas com sucesso.");
        router.replace(onSuccessRedirectPath as never);
        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o pet.";
        Alert.alert("Erro ao atualizar pet", message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, router, onSuccessRedirectPath],
  );

  return {
    handleUpdateAnimal,
    isLoading,
  };
}
