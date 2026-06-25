import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CenteredToast } from "@/components/ui/centered-toast";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useUpdateAdoptionStatus } from "@/features/pets/hooks/use-update-adoption-status";
import { SupabaseChatRepository } from "../../infrastructure/supabase-chat.repository";
import { GetConversationHeaderUseCase } from "../../use-cases/get-conversation-header.use-case";
import { useChatIdentity } from "../../hooks/use-chat-identity";
import { useMessages } from "../../hooks/use-messages";
import { useSendMessage } from "../../hooks/use-send-message";
import type { Message } from "../../domain/entities/message.entity";
import type { AdoptionStatus } from "@/features/pets/domain/entities/adoption.entity";
import { AdoptionStatusEditor } from "./adoption-status-editor";
import { ChatHeader } from "./chat-header";
import { ChatInputBar } from "./chat-input-bar";
import { ChatMessageBubble } from "./chat-message-bubble";

const chatRepository = new SupabaseChatRepository();
const getConversationHeaderUseCase = new GetConversationHeaderUseCase(chatRepository);

type ChatScreenProps = {
  conversationId?: string;
};

export function ChatScreen({ conversationId: conversationIdProp }: ChatScreenProps = {}) {
  const params = useLocalSearchParams<{ conversation_id?: string }>();
  const conversationId = conversationIdProp ?? params.conversation_id ?? "";
  const identity = useChatIdentity();
  const { handleUpdateStatus, isLoading: isUpdatingStatus } =
    useUpdateAdoptionStatus();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [counterpartyName, setCounterpartyName] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [adoptionId, setAdoptionId] = useState<string | null>(null);
  const [adoptionStatus, setAdoptionStatus] = useState<string | null>(null);
  const [isStatusEditorVisible, setIsStatusEditorVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (identity.status !== "ready" || !conversationId) return;
    let cancelled = false;
    setCounterpartyName(null);
    setHeaderError(null);
    setAdoptionId(null);
    setAdoptionStatus(null);
    getConversationHeaderUseCase
      .execute(conversationId, identity.viewer)
      .then((result) => {
        if (cancelled) return;
        setCounterpartyName(result.counterpartyName);
        setAdoptionId(result.adoptionId);
        setAdoptionStatus(result.adoptionStatus);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Não foi possível carregar a conversa.";
        setHeaderError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, identity]);

  const handleOpenStatusEditor = useCallback(() => {
    setIsStatusEditorVisible(true);
  }, []);

  const handleCloseStatusEditor = useCallback(() => {
    if (isUpdatingStatus) return;
    setIsStatusEditorVisible(false);
  }, [isUpdatingStatus]);

  const handleSaveStatus = useCallback(
    async (
      status: AdoptionStatus,
      payload: { cancelReason: string | null; visitDate: string | null },
    ) => {
      if (!adoptionId) return;
      const updated = await handleUpdateStatus({
        adoptionId,
        status,
        cancelReason: payload.cancelReason ?? undefined,
        visitDate: payload.visitDate,
      });
      if (updated) {
        setAdoptionStatus(updated.status);
        setIsStatusEditorVisible(false);
        setToastMessage("Status atualizado");
      }
    },
    [adoptionId, handleUpdateStatus],
  );

  const conversationState = useMessages(conversationId);

  const sendMessage = useSendMessage(conversationId, identity);

  const mergedMessages = useMemo<Message[]>(() => {
    if (conversationState.status !== "ready") return [];
    const seen = new Set<string>();
    const result: Message[] = [];
    for (const message of conversationState.messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      result.push(message);
    }
    return result;
  }, [conversationState]);

  const handleSend = async () => {
    if (identity.status !== "ready") return;
    if (sendMessage.isSending) return;
    const sent = await sendMessage.send(draft);
    if (sent) {
      setDraft("");
    }
  };

  const isIdentityLoading = identity.status === "loading";
  const isIdentityError = identity.status === "error";
  const isUnauthenticated = identity.status === "unauthenticated";

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Conversa inválida.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canEditStatus = identity.status === "ready" && identity.viewer.isLister;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ChatHeader
        counterpartyName={counterpartyName ?? headerError ?? "Conversa"}
        canEditStatus={canEditStatus && adoptionId !== null}
        onEditStatus={handleOpenStatusEditor}
      />
      <View style={styles.flex}>
        <View style={styles.messagesContainer}>
          {isIdentityLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
            </View>
          ) : isUnauthenticated ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>Faça login para participar da conversa.</Text>
            </View>
          ) : isIdentityError ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{identity.message}</Text>
            </View>
          ) : conversationState.status === "loading" ? (
            <View style={styles.center}>
              <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
            </View>
          ) : conversationState.status === "error" ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{conversationState.message}</Text>
            </View>
          ) : mergedMessages.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                Nenhuma mensagem ainda. Diga olá!
              </Text>
            </View>
          ) : (
            <FlatList<Message>
              data={mergedMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isFromCurrentUser =
                  identity.status === "ready" && item.userId === identity.viewer.userId;
                return (
                  <ChatMessageBubble
                    content={item.content}
                    createdAt={item.createdAt}
                    isFromCurrentUser={isFromCurrentUser}
                    senderLabel={
                      isFromCurrentUser ? "Você" : counterpartyName ?? "Conversa"
                    }
                  />
                );
              }}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
        {sendMessage.error ? (
          <Text style={styles.inlineError}>{sendMessage.error}</Text>
        ) : null}
        <View style={{ marginBottom: keyboardHeight }}>
          <ChatInputBar
            draft={draft}
            onChangeDraft={setDraft}
            onSubmit={handleSend}
            isSending={sendMessage.isSending}
            isDisabled={identity.status !== "ready" || conversationState.status !== "ready"}
          />
        </View>
      </View>
      <AdoptionStatusEditor
        visible={isStatusEditorVisible}
        currentStatus={adoptionStatus}
        isSubmitting={isUpdatingStatus}
        onClose={handleCloseStatusEditor}
        onShowToast={setToastMessage}
        onSave={handleSaveStatus}
      />
      <CenteredToast
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  flex: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  listContent: {
    paddingVertical: tokens.spacing[4],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[700],
    textAlign: "center",
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  inlineError: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.red[500],
    textAlign: "center",
    backgroundColor: tokens.colors.white,
    paddingVertical: tokens.spacing[2],
  },
});
