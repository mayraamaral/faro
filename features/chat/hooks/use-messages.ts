import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { ChatError } from "../domain/errors/chat.errors";
import type { Message, MessageSenderType } from "../domain/entities/message.entity";
import { SupabaseChatRepository } from "../infrastructure/supabase-chat.repository";
import { GetMessagesUseCase } from "../use-cases/get-messages.use-case";

const chatRepository = new SupabaseChatRepository();
const getMessagesUseCase = new GetMessagesUseCase(chatRepository);

type ConversationState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; messages: Message[] };

const errorMessageFor = (error: unknown, fallback: string): string => {
  if (error instanceof ChatError) {
    if (error.code === "MESSAGES_FETCH_FAILED") return fallback;
    if (error.code === "UNAUTHORIZED") {
      return "Você não tem permissão para visualizar esta conversa.";
    }
    return "Algo deu errado ao carregar as mensagens.";
  }
  return fallback;
};

export function useMessages(conversationId: string) {
  const [state, setState] = useState<ConversationState>({ status: "loading" });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSyncedAtRef = useRef<string | null>(null);

  const subscribe = useCallback(
    (knownLastAt: string | null) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const inserted = payload.new as {
              id: string;
              conversation_id: string;
              sender_type: MessageSenderType;
              user_id: string;
              adopter_profile_id: string | null;
              lister_profile_id: string | null;
              content: string;
              created_at: string;
            };

            const message: Message = {
              id: inserted.id,
              conversationId: inserted.conversation_id,
              senderType: inserted.sender_type,
              userId: inserted.user_id,
              adopterProfileId: inserted.adopter_profile_id,
              listerProfileId: inserted.lister_profile_id,
              content: inserted.content,
              createdAt: inserted.created_at,
            };

            setState((current) => {
              if (current.status !== "ready") return current;
              if (current.messages.some((m) => m.id === message.id)) return current;
              return { ...current, messages: [...current.messages, message] };
            });
            lastSyncedAtRef.current = message.createdAt;
          }
        )
        .subscribe();

      channelRef.current = channel;
      lastSyncedAtRef.current = knownLastAt;
    },
    [conversationId]
  );

  const fetchHistory = useCallback(async () => {
    try {
      const messages = await getMessagesUseCase.execute(conversationId);
      const last = messages.length > 0 ? messages[messages.length - 1].createdAt : null;
      setState({ status: "ready", messages });
      lastSyncedAtRef.current = last;
      subscribe(last);
    } catch (error) {
      setState({
        status: "error",
        message: errorMessageFor(error, "Não foi possível carregar as mensagens."),
      });
    }
  }, [conversationId, subscribe]);

  useEffect(() => {
    void fetchHistory();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          const since = lastSyncedAtRef.current;
          subscribe(since);

          if (since) {
            getMessagesUseCase
              .execute(conversationId)
              .then((messages) => {
                const newer = messages.filter((m) => m.createdAt > since);
                if (newer.length === 0) return;
                setState((current) => {
                  if (current.status !== "ready") return current;
                  const existing = new Set(current.messages.map((m) => m.id));
                  const merged = [...current.messages];
                  for (const message of newer) {
                    if (!existing.has(message.id)) merged.push(message);
                  }
                  merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                  lastSyncedAtRef.current = merged[merged.length - 1].createdAt;
                  return { ...current, messages: merged };
                });
              })
              .catch(() => undefined);
          }
        } else {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        }
      }
    );

    return () => {
      appStateSubscription.remove();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, fetchHistory, subscribe]);

  return state;
}
