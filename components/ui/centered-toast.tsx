import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";

type CenteredToastProps = {
  message: string | null;
  onHide: () => void;
  durationMs?: number;
};

export function CenteredToast({
  message,
  onHide,
  durationMs = 2000,
}: CenteredToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onHide());
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, opacity, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  toastText: {
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    color: tokens.colors.white,
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    overflow: "hidden",
    maxWidth: "80%",
    textAlign: "center",
  },
});
