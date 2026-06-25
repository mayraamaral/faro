import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useChatIdentity } from "../hooks/use-chat-identity";
import { useMyConversations } from "../hooks/use-my-conversations";
import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationListItem;
  onPress: () => void;
}) {
  const preview = conversation.lastMessagePreview ?? "Sem mensagens ainda.";
  const time = formatRelativeTime(conversation.lastMessageAt ?? conversation.createdAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : undefined]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversa com ${conversation.counterpartyName}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>
          {conversation.counterpartyName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.headerLine}>
          <Text style={styles.name} numberOfLines={1}>
            {conversation.counterpartyName}
          </Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

export function ConversationsListScreen() {
  const router = useRouter();
  const identity = useChatIdentity();
  const state = useMyConversations(identity);
  const refresh = state.refresh;

  useFocusEffect(
    useCallback(() => {
      if (identity.status === "ready") {
        void refresh();
      }
    }, [identity.status, refresh])
  );

  if (state.status === "loading") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === "error") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.message}</Text>
          <Pressable
            onPress={() => {
              void state.refresh();
            }}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
      </View>
      <View style={styles.listContainer}>
      {state.conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Você ainda não tem conversas. Inicie uma conversa ao demonstrar interesse em um pet.
          </Text>
        </View>
      ) : (
        <FlatList<ConversationListItem>
          data={state.conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/chat/${item.id}` as never)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  header: {
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  listContent: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.white,
  },
  body: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  headerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing[2],
  },
  name: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
  },
  time: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
  },
  preview: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[700],
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.brand.primary,
    borderRadius: tokens.radius.md,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.white,
  },
});
