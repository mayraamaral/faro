import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";

type ChatHeaderProps = {
  counterpartyName: string;
  canEditStatus?: boolean;
  onEditStatus?: () => void;
  canViewStatus?: boolean;
  onOpenStatus?: () => void;
};

export function ChatHeader({
  counterpartyName,
  canEditStatus = false,
  onEditStatus,
  canViewStatus = false,
  onOpenStatus,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={28}
          color={tokens.colors.brand.orange}
        />
      </Pressable>
      <View style={styles.avatar}>
        <MaterialCommunityIcons
          name="account"
          size={24}
          color={tokens.colors.white}
        />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {counterpartyName}
      </Text>
      {canViewStatus && onOpenStatus ? (
        <Pressable
          onPress={onOpenStatus}
          style={styles.statusButton}
          accessibilityRole="button"
          accessibilityLabel="Ver status da adoção"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="clipboard-check-multiple-outline"
            size={28}
            color={tokens.colors.brand.primary}
          />
        </Pressable>
      ) : null}
      {canEditStatus && onEditStatus ? (
        <Pressable
          onPress={onEditStatus}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel="Editar status da adoção"
          hitSlop={8}
        >
          <IconSymbol
            name="square.and.pencil"
            size={28}
            color={tokens.colors.brand.green}
            weight="bold"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
    gap: tokens.spacing[3],
  },
  backButton: {
    padding: tokens.spacing[2],
    marginLeft: -tokens.spacing[2],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  editButton: {
    padding: tokens.spacing[1],
  },
  statusButton: {
    padding: tokens.spacing[1],
  },
});
