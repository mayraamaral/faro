import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";

type ChatHeaderProps = {
  counterpartyName: string;
};

export function ChatHeader({ counterpartyName }: ChatHeaderProps) {
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
});
