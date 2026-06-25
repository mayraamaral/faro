import { useCallback, useState } from "react";

import type { Message } from "../domain/entities/message.entity";
import { ChatError } from "../domain/errors/chat.errors";
import { SupabaseChatRepository } from "../infrastructure/supabase-chat.repository";
import { SendMessageUseCase } from "../use-cases/send-message.use-case";
import type { ChatIdentity } from "./use-chat-identity";

const chatRepository = new SupabaseChatRepository();
const sendMessageUseCase = new SendMessageUseCase(chatRepository);

const errorMessageFor = (error: unknown): string => {
  if (error instanceof ChatError) {
    if (error.code === "MESSAGE_SEND_FAILED") {
      return "Não foi possível enviar a mensagem. Tente novamente.";
    }
    if (error.code === "UNAUTHORIZED") {
      return "Você não tem permissão para enviar mensagens nesta conversa.";
    }
    return "Algo deu errado. Tente novamente.";
  }
  return "Não foi possível enviar a mensagem. Tente novamente.";
};

export type UseSendMessageResult = {
  isSending: boolean;
  error: string | null;
  send: (content: string) => Promise<Message | null>;
};

export function useSendMessage(
  conversationId: string,
  identity: ChatIdentity
): UseSendMessageResult {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (content: string): Promise<Message | null> => {
      if (identity.status !== "ready") {
        setError("Aguarde o carregamento da sua conta antes de enviar.");
        return null;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        setError("Mensagem não pode estar vazia.");
        return null;
      }

      setIsSending(true);
      setError(null);

      try {
        const viewer = identity.viewer;
        if (!viewer.role) {
          throw new Error("Conta sem papel definido. Entre em contato com o suporte.");
        }
        const message = await sendMessageUseCase.execute({
          content: trimmed,
          conversationId,
          senderType: viewer.role,
          userId: viewer.userId,
          adopterProfileId: viewer.adopterProfileIdValue,
          listerProfileId: viewer.listerProfileIdValue,
        });

        return message;
      } catch (caught) {
        setError(errorMessageFor(caught));
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, identity]
  );

  return { isSending, error, send };
}
