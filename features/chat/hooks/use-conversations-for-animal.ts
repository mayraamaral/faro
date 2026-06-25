import { useCallback, useEffect, useState } from "react";

import { ChatError } from "../domain/errors/chat.errors";
import { SupabaseChatRepository } from "../infrastructure/supabase-chat.repository";
import { GetConversationsForAnimalUseCase } from "../use-cases/get-conversations-for-animal.use-case";
import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";
import type { ChatIdentity } from "./use-chat-identity";

const chatRepository = new SupabaseChatRepository();
const getConversationsForAnimalUseCase = new GetConversationsForAnimalUseCase(
  chatRepository,
);

export type UseConversationsForAnimalResult = {
  status: "loading" | "error" | "ready";
  message: string | null;
  conversations: ConversationListItem[];
  refresh: () => Promise<void>;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof ChatError) {
    return "Não foi possível carregar os interessados.";
  }
  return "Não foi possível carregar os interessados.";
};

export function useConversationsForAnimal(
  animalId: string | null,
  identity: ChatIdentity,
): UseConversationsForAnimalResult {
  const [state, setState] = useState<{
    status: "loading" | "error" | "ready";
    message: string | null;
    conversations: ConversationListItem[];
  }>({ status: "loading", message: null, conversations: [] });

  const load = useCallback(async () => {
    if (!animalId) {
      setState({
        status: "error",
        message: "Pet não encontrado.",
        conversations: [],
      });
      return;
    }

    if (identity.status !== "ready") {
      if (identity.status === "unauthenticated") {
        setState({
          status: "error",
          message: "Faça login para ver os interessados.",
          conversations: [],
        });
        return;
      }
      if (identity.status === "error") {
        setState({
          status: "error",
          message: identity.message,
          conversations: [],
        });
        return;
      }
      setState({ status: "loading", message: null, conversations: [] });
      return;
    }

    setState((current) =>
      current.status === "ready" && current.conversations.length > 0
        ? current
        : { ...current, status: "loading" },
    );

    try {
      const conversations = await getConversationsForAnimalUseCase.execute(
        animalId,
        identity.viewer,
      );
      setState({ status: "ready", message: null, conversations });
    } catch (caught) {
      setState((current) =>
        current.status === "ready" && current.conversations.length > 0
          ? { ...current, status: "error", message: errorMessageFor(caught) }
          : { status: "error", message: errorMessageFor(caught), conversations: [] },
      );
    }
  }, [animalId, identity]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    status: state.status,
    message: state.message,
    conversations: state.conversations,
    refresh: load,
  };
}
