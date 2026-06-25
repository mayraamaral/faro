import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { appFonts, tokens } from "@/constants/tokens";

export default function MatchesRoute() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Matches</ThemedText>
      <ThemedText style={styles.subtitle}>Em breve</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.brand.background,
    gap: tokens.spacing[2],
  },
  title: {
    fontFamily: appFonts.primaryBold,
    fontSize: tokens.fontSize["2xl"],
    color: tokens.colors.brand.primary,
  },
  subtitle: {
    fontFamily: appFonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[500],
  },
});
