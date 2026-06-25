import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { ADOPTION_STATUS_LABELS, AdoptionStatus } from "@/features/pets/domain/entities/adoption.entity";
import { useAdoptionById } from "../hooks/use-adoption-by-id";
import type { AdoptionEntity } from "../domain/entities/adoption.entity";

type TimelineStep = {
  key: string;
  status: AdoptionStatus;
  label: string;
  date: string | null;
  description: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  reached: boolean;
  isCurrent: boolean;
};

const formatDate = (isoDate: string | null | undefined): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (isoDate: string | null | undefined): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HAPPY_PATH_STEPS: Array<{
  status: AdoptionStatus;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
  dateOf: (adoption: AdoptionEntity) => string | null | undefined;
}> = [
  {
    status: "UNDER_REVIEW",
    iconName: "file-document-outline",
    description: "Recebemos sua proposta e ela está sendo analisada.",
    dateOf: (a) => a.createdAt,
  },
  {
    status: "IN_PROGRESS",
    iconName: "chat-processing-outline",
    description: "Você iniciou o processo de adoção.",
    dateOf: (a) => a.visitedAt ?? a.visitScheduledFor ?? a.createdAt,
  },
  {
    status: "VISIT_PENDING",
    iconName: "calendar-clock",
    description: "Visita agendada para conhecer o pet.",
    dateOf: (a) => a.visitScheduledFor,
  },
  {
    status: "VISITED",
    iconName: "paw-outline",
    description: "Visita realizada — tudo certo para seguir.",
    dateOf: (a) => a.visitedAt,
  },
  {
    status: "IN_ADAPTATION",
    iconName: "home-heart",
    description: "Período de adaptação com a nova família.",
    dateOf: (a) => a.adaptationStartedAt,
  },
  {
    status: "ADOPTED",
    iconName: "check-decagram",
    description: "Adoção concluída — parabéns!",
    dateOf: (a) => a.adoptionDate,
  },
];

const TERMINAL_NEGATIVE: Record<"CANCELED" | "REJECTED", {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}> = {
  CANCELED: {
    label: "Cancelado",
    iconName: "close-circle-outline",
    description: "Adoção cancelada.",
  },
  REJECTED: {
    label: "Recusado",
    iconName: "cancel",
    description: "Adoção recusada pelo doador.",
  },
};

const buildTimeline = (adoption: AdoptionEntity): TimelineStep[] => {
  const currentIndex = HAPPY_PATH_STEPS.findIndex((step) => step.status === adoption.status);

  return HAPPY_PATH_STEPS.map((step, index) => {
    const reached =
      currentIndex === -1
        ? step.status === "UNDER_REVIEW"
        : index <= currentIndex;
    const rawDate = step.dateOf(adoption);
    const date = reached && adoption.status !== "UNDER_REVIEW"
      ? formatDate(rawDate ?? null)
      : reached
        ? formatDateTime(rawDate ?? null)
        : null;

    return {
      key: step.status,
      status: step.status,
      label: ADOPTION_STATUS_LABELS[step.status],
      description: step.description,
      iconName: step.iconName,
      reached,
      isCurrent: index === currentIndex,
      date,
    };
  });
};

export function AdoptionStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ adoption_id?: string }>();
  const adoptionId = params.adoption_id ?? null;
  const { state, refetch } = useAdoptionById(adoptionId);

  const isNegativeTerminal = useMemo(() => {
    if (state.status !== "ready") return false;
    return state.adoption.isCanceled || state.adoption.isRejected;
  }, [state]);

  const timeline = useMemo(() => {
    if (state.status !== "ready") return [];
    return buildTimeline(state.adoption);
  }, [state]);

  const negativeTerminal = useMemo(() => {
    if (state.status !== "ready") return null;
    if (state.adoption.isCanceled) {
      return {
        status: "CANCELED" as const,
        ...TERMINAL_NEGATIVE.CANCELED,
        date: formatDateTime(state.adoption.updatedAt ?? state.adoption.createdAt),
        reason: state.adoption.cancelReason ?? null,
      };
    }
    if (state.adoption.isRejected) {
      return {
        status: "REJECTED" as const,
        ...TERMINAL_NEGATIVE.REJECTED,
        date: formatDateTime(state.adoption.updatedAt ?? state.adoption.createdAt),
        reason: state.adoption.cancelReason ?? null,
      };
    }
    return null;
  }, [state]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>Status da adoção</Text>
          <Text style={styles.headerSubtitle}>Acompanhe cada etapa do processo</Text>
        </View>
        <Pressable
          onPress={() => {
            void refetch();
          }}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Atualizar status"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={24}
            color={tokens.colors.brand.primary}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        {state.status === "loading" ? (
          <View style={styles.center}>
            <ActivityIndicator color={tokens.colors.brand.primary} size="large" />
          </View>
        ) : state.status === "error" ? (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color={tokens.colors.red[400]}
            />
            <Text style={styles.errorTitle}>Não foi possível carregar</Text>
            <Text style={styles.errorText}>{state.message}</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.timelineCard}>
            {timeline.map((step, index) => {
              const isLast = index === timeline.length - 1;
              const iconColor = step.reached
                ? step.isCurrent
                  ? tokens.colors.brand.orange
                  : tokens.colors.brand.green
                : tokens.colors.gray[300];
              const dateColor = step.reached
                ? tokens.colors.gray[700]
                : tokens.colors.gray[400];
              const lineColor = step.reached
                ? tokens.colors.brand.green
                : tokens.colors.gray[200];

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicatorColumn}>
                    <View
                      style={[
                        styles.iconBubble,
                        step.reached && styles.iconBubbleReached,
                        step.isCurrent && styles.iconBubbleCurrent,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={step.iconName}
                        size={22}
                        color={
                          step.reached
                            ? tokens.colors.white
                            : tokens.colors.gray[400]
                        }
                      />
                    </View>
                    {!isLast ? (
                      <View
                        style={[
                          styles.connector,
                          { backgroundColor: lineColor },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text
                        style={[
                          styles.stepLabel,
                          !step.reached && styles.stepLabelMuted,
                          step.isCurrent && styles.stepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {step.isCurrent ? (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Atual</Text>
                        </View>
                      ) : null}
                    </View>
                    {step.date ? (
                      <Text style={[styles.stepDate, { color: dateColor }]}>
                        {step.date}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.stepDescription,
                        !step.reached && styles.stepDescriptionMuted,
                      ]}
                    >
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {isNegativeTerminal && negativeTerminal ? (
            <View style={styles.negativeCard}>
              <View style={styles.negativeHeader}>
                <MaterialCommunityIcons
                  name={negativeTerminal.iconName}
                  size={24}
                  color={tokens.colors.red[500]}
                />
                <Text style={styles.negativeTitle}>{negativeTerminal.label}</Text>
              </View>
              <Text style={styles.negativeDescription}>
                {negativeTerminal.description}
              </Text>
              {negativeTerminal.date ? (
                <Text style={styles.negativeDate}>
                  {negativeTerminal.date}
                </Text>
              ) : null}
              {negativeTerminal.reason ? (
                <View style={styles.reasonWrapper}>
                  <Text style={styles.reasonLabel}>Motivo</Text>
                  <Text style={styles.reasonText}>{negativeTerminal.reason}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          </ScrollView>
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
  body: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
    gap: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
  },
  backButton: {
    padding: tokens.spacing[1],
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.brand.primary,
  },
  headerSubtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[500],
    marginTop: 2,
  },
  refreshButton: {
    padding: tokens.spacing[1],
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
    color: tokens.colors.gray[800],
  },
  errorText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[600],
    textAlign: "center",
  },
  scrollContent: {
    padding: tokens.spacing[5],
    paddingBottom: tokens.spacing[12],
  },
  timelineCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[5],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepRow: {
    flexDirection: "row",
    gap: tokens.spacing[4],
  },
  stepIndicatorColumn: {
    alignItems: "center",
    width: 44,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.colors.gray[200],
  },
  iconBubbleReached: {
    backgroundColor: tokens.colors.brand.green,
    borderColor: tokens.colors.brand.green,
  },
  iconBubbleCurrent: {
    backgroundColor: tokens.colors.brand.orange,
    borderColor: tokens.colors.brand.orange,
    transform: [{ scale: 1.08 }],
  },
  connector: {
    width: 3,
    flex: 1,
    marginVertical: tokens.spacing[1],
  },
  stepContent: {
    flex: 1,
    paddingBottom: tokens.spacing[6],
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  stepLabel: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[800],
  },
  stepLabelMuted: {
    color: tokens.colors.gray[400],
  },
  stepLabelCurrent: {
    color: tokens.colors.brand.orange,
  },
  currentBadge: {
    backgroundColor: `${tokens.colors.brand.orange}1F`,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
  },
  currentBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.brand.orange,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepDate: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.sm,
    marginTop: 2,
  },
  stepDescription: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
    marginTop: tokens.spacing[1],
    lineHeight: 20,
  },
  stepDescriptionMuted: {
    color: tokens.colors.gray[400],
  },
  negativeCard: {
    marginTop: tokens.spacing[5],
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[5],
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.red[500],
    gap: tokens.spacing[2],
  },
  negativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  negativeTitle: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.red[500],
  },
  negativeDescription: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[700],
  },
  negativeDate: {
    fontFamily: Fonts.semiBold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  reasonWrapper: {
    marginTop: tokens.spacing[2],
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.gray[50],
    borderRadius: tokens.radius.md,
  },
  reasonLabel: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[1],
  },
  reasonText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[800],
    lineHeight: 20,
  },
});
