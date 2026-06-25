import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";

type ChatInputBarProps = {
  draft: string;
  onChangeDraft: Dispatch<SetStateAction<string>>;
  onSubmit: () => Promise<void>;
  isSending: boolean;
  isDisabled: boolean;
};

export function ChatInputBar({
  draft,
  onChangeDraft,
  onSubmit,
  isSending,
  isDisabled,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const [hasContent, setHasContent] = useState(draft.trim().length > 0);

  const handleChange = (next: string) => {
    onChangeDraft(next);
    setHasContent(next.trim().length > 0);
  };

  const handleSubmit = async () => {
    if (isDisabled || !hasContent || isSending) return;
    await onSubmit();
  };

  const sendDisabled = isDisabled || !hasContent || isSending;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={draft}
          onChangeText={handleChange}
          placeholder="Escreva algo aqui..."
          placeholderTextColor={tokens.colors.gray[500]}
          style={styles.input}
          editable={!isDisabled}
          multiline
          accessibilityLabel="Mensagem"
        />
      </View>
      <Pressable
        onPress={() => {
          void handleSubmit();
        }}
        disabled={sendDisabled}
        style={({ pressed }) => [
          styles.sendButton,
          sendDisabled ? styles.sendButtonDisabled : undefined,
          pressed && !sendDisabled ? styles.sendButtonPressed : undefined,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
      >
        <MaterialCommunityIcons
          name="send"
          size={22}
          color={tokens.colors.white}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
    gap: tokens.spacing[2],
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: tokens.colors.gray[100],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    minHeight: 48,
    maxHeight: 140,
    justifyContent: "center",
  },
  input: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[800],
    minHeight: 32,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: tokens.colors.gray[400],
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
});
