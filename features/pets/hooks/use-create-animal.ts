import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/context/auth.context";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { SupabaseAnimalPhotoRepository } from "../infrastructure/supabase-animal-photo.repository";
import { CreateAnimalUseCase } from "../use-cases/create-animal.use-case";
import type { CreateAnimalFormData } from "../schemas/create-animal.schema";

const animalRepository = new SupabaseAnimalRepository();
const animalPhotoRepository = new SupabaseAnimalPhotoRepository();
const createAnimalUseCase = new CreateAnimalUseCase(
  animalRepository,
  animalPhotoRepository
);

export function useCreateAnimal() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleCreateAnimal = async (data: CreateAnimalFormData): Promise<boolean> => {
    if (!user) {
      Alert.alert("Sessão inválida", "Faça login novamente para cadastrar um pet.");
      return false;
    }

    try {
      setIsLoading(true);
      await createAnimalUseCase.execute(data, user.id);
      Alert.alert("Pet cadastrado", "Seu pet foi cadastrado com sucesso.");
      router.replace("/my-pets" as any);
      return true;
    } catch (error: any) {
      Alert.alert(
        "Erro ao cadastrar pet",
        error?.message || "Não foi possível cadastrar o pet."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCreateAnimal,
    isLoading,
  };
}
