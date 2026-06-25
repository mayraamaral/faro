import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
import { useConversationsForAnimal } from "../hooks/use-conversations-for-animal";
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
  const time = formatRelativeTime(
    conversation.lastMessageAt ?? conversation.createdAt,
  );

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

export function ConversationsForAnimalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ animal_id: string }>();
  const animalId =
    typeof params.animal_id === "string" ? params.animal_id : null;
  const identity = useChatIdentity();
  const state = useConversationsForAnimal(animalId, identity);
  const refresh = state.refresh;

  useFocusEffect(
    useCallback(() => {
      if (identity.status === "ready") {
        void refresh();
      }
    }, [identity.status, refresh]),
  );

  if (state.status === "loading") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.brand.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === "error") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Não foi possível carregar os interessados</Text>
          <Text style={styles.errorMessage}>{state.message}</Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (state.conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={styles.headerBackText}>‹ Voltar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Interessados</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            Nenhum interessado ainda.
          </Text>
          <Text style={styles.emptyMessage}>
            Quando alguém iniciar uma conversa sobre este pet, ela aparecerá aqui.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBackButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.headerBackText}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Interessados</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={state.conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/chat/${item.id}` as never)}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            void refresh();
          }}
          refreshing={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  errorTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.brand.primary,
    textAlign: "center",
  },
  errorMessage: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  backButton: {
    marginTop: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.brand.primary,
  },
  backButtonText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.gray[700],
    textAlign: "center",
  },
  emptyMessage: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[500],
    textAlign: "center",
    maxWidth: 320,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
  },
  headerBackButton: {
    paddingVertical: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[2],
  },
  headerBackText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.brand.primary,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  headerSpacer: {
    width: 60,
  },
  listContainer: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  listContent: {
    padding: tokens.spacing[3],
    gap: tokens.spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    gap: tokens.spacing[3],
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  time: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
  },
  preview: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  separator: {
    height: tokens.spacing[2],
  },
});
