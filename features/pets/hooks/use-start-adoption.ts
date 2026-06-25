import { useCallback, useState } from "react";

import { SupabaseChatRepository } from "@/features/chat/infrastructure/supabase-chat.repository";
import { CreateConversationUseCase } from "@/features/chat/use-cases/create-conversation.use-case";
import { ChatError } from "@/features/chat/domain/errors/chat.errors";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { GetOrCreateActiveAdoptionUseCase } from "../use-cases/get-or-create-active-adoption.use-case";
import { StartAdoptionError } from "../domain/errors/start-adoption.errors";
import type { ChatIdentity } from "@/features/chat/hooks/use-chat-identity";

const animalRepository = new SupabaseAnimalRepository();
const chatRepository = new SupabaseChatRepository();
const getOrCreateActiveAdoptionUseCase = new GetOrCreateActiveAdoptionUseCase(animalRepository);
const createConversationUseCase = new CreateConversationUseCase(chatRepository);

export type UseStartAdoptionResult = {
  isStarting: boolean;
  error: string | null;
  start: (animalId: string) => Promise<string | null>;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof StartAdoptionError) {
    if (error.code === "ADOPTER_PROFILE_REQUIRED") {
      return "Seu perfil de adotante não foi encontrado.";
    }
    if (error.code === "ANIMAL_ID_REQUIRED") {
      return "Pet inválido.";
    }
    return "Não foi possível iniciar a adoção. Tente novamente.";
  }
  if (error instanceof ChatError) {
    if (error.code === "CONVERSATION_NOT_FOUND") {
      return "Conversa não encontrada.";
    }
    if (error.code === "CONVERSATION_CREATE_FAILED") {
      return "Não foi possível abrir a conversa com o tutor.";
    }
    if (error.code === "UNAUTHORIZED") {
      return "Você não tem permissão para iniciar esta conversa.";
    }
    return "Não foi possível abrir a conversa com o tutor.";
  }
  return "Algo deu errado. Tente novamente.";
};

export function useStartAdoption(identity: ChatIdentity): UseStartAdoptionResult {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (animalId: string): Promise<string | null> => {
      if (identity.status !== "ready") {
        setError("Aguarde o carregamento da sua conta.");
        return null;
      }
      if (!identity.viewer.isAdopter) {
        setError("Apenas adotantes podem iniciar adoções.");
        return null;
      }
      const adopterProfileId = identity.viewer.adopterProfileIdValue;
      if (!adopterProfileId) {
        setError("Seu perfil de adotante não foi encontrado.");
        return null;
      }

      setIsStarting(true);
      setError(null);

      try {
        const adoption = await getOrCreateActiveAdoptionUseCase.execute({
          animalId,
          adopterProfileId,
        });
        const conversation = await createConversationUseCase.execute(adoption.id);
        return conversation.id;
      } catch (caught) {
        setError(errorMessageFor(caught));
        return null;
      } finally {
        setIsStarting(false);
      }
    },
    [identity]
  );

  return { isStarting, error, start };
}
