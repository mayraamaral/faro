import { useCallback, useEffect, useState } from "react";

import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";
import { ChatError } from "../domain/errors/chat.errors";
import { SupabaseChatRepository } from "../infrastructure/supabase-chat.repository";
import { GetMyConversationsUseCase } from "../use-cases/get-my-conversations.use-case";
import type { ChatIdentity } from "./use-chat-identity";

const chatRepository = new SupabaseChatRepository();
const getMyConversationsUseCase = new GetMyConversationsUseCase(chatRepository);

export type UseMyConversationsResult = {
  status: "loading" | "error" | "ready";
  message: string | null;
  conversations: ConversationListItem[];
  refresh: () => Promise<void>;
};

const errorMessageFor = (error: unknown): string => {
  if (error instanceof ChatError) {
    return "Não foi possível carregar suas conversas.";
  }
  return "Não foi possível carregar suas conversas.";
};

export function useMyConversations(identity: ChatIdentity): UseMyConversationsResult {
  const [state, setState] = useState<
    { status: "loading" | "error" | "ready"; message: string | null; conversations: ConversationListItem[] }
  >({ status: "loading", message: null, conversations: [] });

  const load = useCallback(async () => {
    if (identity.status !== "ready") {
      if (identity.status === "unauthenticated") {
        setState({ status: "error", message: "Faça login para ver suas conversas.", conversations: [] });
        return;
      }
      if (identity.status === "error") {
        setState({ status: "error", message: identity.message, conversations: [] });
        return;
      }
      setState({ status: "loading", message: null, conversations: [] });
      return;
    }

    setState((current) =>
      current.status === "ready" && current.conversations.length > 0
        ? current
        : { ...current, status: "loading" }
    );

    try {
      const conversations = await getMyConversationsUseCase.execute(identity.viewer);
      setState({ status: "ready", message: null, conversations });
    } catch (caught) {
      setState((current) =>
        current.status === "ready" && current.conversations.length > 0
          ? { ...current, status: "error", message: errorMessageFor(caught) }
          : { status: "error", message: errorMessageFor(caught), conversations: [] }
      );
    }
  }, [identity]);

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
