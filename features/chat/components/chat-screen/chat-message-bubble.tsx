import { StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";

type ChatMessageBubbleProps = {
  content: string;
  createdAt: string;
  isFromCurrentUser: boolean;
  senderLabel: string;
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function ChatMessageBubble({
  content,
  createdAt,
  isFromCurrentUser,
  senderLabel,
}: ChatMessageBubbleProps) {
  const time = formatTime(createdAt);

  return (
    <View
      style={[
        styles.row,
        isFromCurrentUser ? styles.rowFromCurrentUser : styles.rowFromOther,
      ]}
      accessibilityLabel={`${senderLabel} at ${time}: ${content}`}
    >
      <View
        style={[
          styles.bubble,
          isFromCurrentUser ? styles.bubbleFromCurrentUser : styles.bubbleFromOther,
        ]}
      >
        <Text
          style={[
            styles.content,
            isFromCurrentUser ? styles.contentFromCurrentUser : styles.contentFromOther,
          ]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    paddingHorizontal: tokens.spacing[5],
    marginBottom: tokens.spacing[3],
  },
  rowFromCurrentUser: {
    alignItems: "flex-end",
  },
  rowFromOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
  },
  bubbleFromCurrentUser: {
    backgroundColor: tokens.colors.brand.primary,
  },
  bubbleFromOther: {
    backgroundColor: tokens.colors.brand.secondary,
  },
  content: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.base,
  },
  contentFromCurrentUser: {
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
  contentFromOther: {
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
});
