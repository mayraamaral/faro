import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { LogoWordmark } from "./logo-wordmark";

type TopBarProps = {
  userInitial?: string | null;
  onPressAvatar?: () => void;
  onPressSettings?: () => void;
  hideSettingsIcon?: boolean;
  hideAvatar?: boolean;
  backgroundColor?: string;
};

const AVATAR_SIZE = 40;
const ICON_BUTTON_SIZE = 40;

export function TopBar({
  userInitial,
  onPressAvatar,
  onPressSettings,
  hideSettingsIcon = false,
  hideAvatar = false,
  backgroundColor,
}: TopBarProps) {
  const initial = (userInitial ?? "").trim().charAt(0).toUpperCase() || "U";

  return (
    <View style={[styles.bar, backgroundColor ? { backgroundColor } : null]}>
      {hideAvatar ? (
        <View style={styles.avatarPlaceholder} />
      ) : (
        <Pressable
          onPress={onPressAvatar}
          disabled={!onPressAvatar}
          style={({ pressed }) => [
            styles.avatar,
            pressed && onPressAvatar && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          hitSlop={8}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      )}

      <View style={styles.logoWrapper} pointerEvents="none">
        <LogoWordmark size="sm" />
      </View>

      {hideSettingsIcon ? (
        <View style={styles.iconButton} />
      ) : (
        <Pressable
          onPress={onPressSettings}
          disabled={!onPressSettings}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && onPressSettings && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="cog"
            size={26}
            color={tokens.colors.brand.secondary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.white,
  },
  logoWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
