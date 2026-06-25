import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import {
  ADOPTION_STATUS_LABELS,
  ADOPTION_STATUS_VALUES,
  isAdoptionStatus,
  type AdoptionStatus,
} from "../../../pets/domain/entities/adoption.entity";

type AdoptionStatusEditorProps = {
  visible: boolean;
  currentStatus: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
  onSave: (
    status: AdoptionStatus,
    payload: { cancelReason: string | null; visitDate: string | null },
  ) => void;
};

const STATUSES_REQUIRING_REASON: AdoptionStatus[] = ["CANCELED", "REJECTED"];
const STATUSES_REQUIRING_VISIT_DATE: AdoptionStatus[] = [
  "VISIT_PENDING",
  "VISITED",
];

const formatIsoDate = (date: Date): string => date.toISOString();

const formatDisplayDate = (iso: string | null): string => {
  if (!iso) return "Selecione a data";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Selecione a data";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function AdoptionStatusEditor({
  visible,
  currentStatus,
  isSubmitting,
  onClose,
  onShowToast,
  onSave,
}: AdoptionStatusEditorProps) {
  const [pendingStatus, setPendingStatus] = useState<AdoptionStatus | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [visitDate, setVisitDate] = useState<string | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!visible) {
      setPendingStatus(null);
      setCancelReason("");
      setVisitDate(null);
      setIsDatePickerVisible(false);
    }
  }, [visible]);

  const requiresReason = pendingStatus
    ? STATUSES_REQUIRING_REASON.includes(pendingStatus)
    : false;

  const requiresVisitDate = pendingStatus
    ? STATUSES_REQUIRING_VISIT_DATE.includes(pendingStatus)
    : false;

  const requiresExtraFields = requiresReason || requiresVisitDate;

  const resetExtraFields = () => {
    setCancelReason("");
    setVisitDate(null);
    setIsDatePickerVisible(false);
  };

  const handleSelectStatus = (status: AdoptionStatus) => {
    if (status === currentStatus) {
      onShowToast("Este já é o status atual");
      onClose();
      return;
    }
    if (
      STATUSES_REQUIRING_REASON.includes(status) ||
      STATUSES_REQUIRING_VISIT_DATE.includes(status)
    ) {
      setPendingStatus(status);
      resetExtraFields();
      return;
    }
    onSave(status, { cancelReason: null, visitDate: null });
  };

  const handleConfirmExtra = () => {
    if (!pendingStatus) return;
    if (requiresReason && cancelReason.trim().length === 0) return;
    if (requiresVisitDate) {
      if (isDatePickerVisible) {
        setVisitDate(formatIsoDate(pendingDate));
        setIsDatePickerVisible(false);
        return;
      }
      if (!visitDate) return;
    }
    onSave(pendingStatus, {
      cancelReason: requiresReason ? cancelReason.trim() : null,
      visitDate: requiresVisitDate ? visitDate : null,
    });
  };

  const handleBackFromExtra = () => {
    setPendingStatus(null);
    resetExtraFields();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setPendingStatus(null);
    resetExtraFields();
    onClose();
  };

  const openDatePicker = () => {
    setPendingDate(visitDate ? new Date(visitDate) : new Date());
    setIsDatePickerVisible(true);
  };

  const handleDateChange = (_event: unknown, selected?: Date) => {
    if (!selected) return;
    setPendingDate(selected);
    if (Platform.OS !== "ios") {
      setVisitDate(formatIsoDate(selected));
    }
  };

  const handleDatePickerDone = () => {
    setVisitDate(formatIsoDate(pendingDate));
    setIsDatePickerVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isSubmitting ? undefined : handleClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <SafeAreaView
          edges={["bottom"]}
          style={styles.sheetWrapper}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.sheet}
            onPress={() => undefined}
            accessibilityRole="none"
          >
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>
                    {requiresExtraFields
                      ? requiresReason
                        ? "Informe o motivo"
                        : "Data da visita"
                      : "Status da adoção"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {requiresReason
                      ? `${ADOPTION_STATUS_LABELS[pendingStatus as AdoptionStatus]} exige um motivo.`
                      : requiresVisitDate
                        ? `${ADOPTION_STATUS_LABELS[pendingStatus as AdoptionStatus]} exige uma data.`
                        : "Selecione o novo status para esta conversa."}
                  </Text>
                </View>
                <Pressable
                  onPress={isSubmitting ? undefined : handleClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={tokens.colors.gray[700]}
                  />
                </Pressable>
              </View>

              {requiresReason ? (
                <View style={styles.extraContainer}>
                  <Text style={styles.extraLabel}>Motivo</Text>
                  <TextInput
                    style={styles.reasonInput}
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    placeholder="Descreva o motivo..."
                    placeholderTextColor={tokens.colors.gray[500]}
                    multiline
                    numberOfLines={3}
                    editable={!isSubmitting}
                    autoFocus
                  />
                </View>
              ) : requiresVisitDate ? (
                <View
                  style={[
                    styles.extraContainer,
                    isDatePickerVisible && styles.extraContainerExpanded,
                  ]}
                >
                  <Text style={styles.extraLabel}>Data</Text>
                  {isDatePickerVisible ? (
                    <View style={styles.datePickerWrapper}>
                      <View style={styles.datePickerInner}>
                        <DateTimePicker
                          value={pendingDate}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={handleDateChange}
                          minimumDate={
                            pendingStatus === "VISIT_PENDING"
                              ? new Date()
                              : undefined
                          }
                          {...(Platform.OS === "ios"
                            ? { textColor: tokens.colors.gray[900] }
                            : {})}
                        />
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={isSubmitting ? undefined : openDatePicker}
                      style={styles.dateButton}
                      accessibilityRole="button"
                      accessibilityLabel="Selecionar data da visita"
                    >
                      <Text
                        style={[
                          styles.dateButtonText,
                          !visitDate && styles.dateButtonPlaceholder,
                        ]}
                      >
                        {formatDisplayDate(visitDate)}
                      </Text>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={20}
                        color={tokens.colors.brand.primary}
                      />
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.optionsContent}>
                  {ADOPTION_STATUS_VALUES.map((status) => {
                    if (!isAdoptionStatus(status)) return null;
                    const isSelected = currentStatus === status;
                    return (
                      <Pressable
                        key={status}
                        style={({ pressed }) => [
                          styles.option,
                          isSelected && styles.optionSelected,
                          pressed && styles.optionPressed,
                        ]}
                        onPress={() => handleSelectStatus(status)}
                        disabled={isSubmitting}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={ADOPTION_STATUS_LABELS[status]}
                      >
                        <MaterialCommunityIcons
                          name={
                            isSelected
                              ? "radiobox-marked"
                              : "radiobox-blank"
                          }
                          size={24}
                          color={
                            isSelected
                              ? tokens.colors.brand.green
                              : tokens.colors.gray[500]
                          }
                        />
                        <View style={styles.optionBody}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {ADOPTION_STATUS_LABELS[status]}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {requiresExtraFields ? (
              <View style={styles.footer}>
                <Pressable
                  onPress={
                    isSubmitting
                      ? undefined
                      : requiresVisitDate && isDatePickerVisible
                        ? () => setIsDatePickerVisible(false)
                        : handleBackFromExtra
                  }
                  style={({ pressed }) => [
                    styles.footerButton,
                    styles.footerButtonSecondary,
                    pressed && styles.footerButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                >
                  <Text style={styles.footerButtonSecondaryText}>Voltar</Text>
                </Pressable>
                <Pressable
                  onPress={isSubmitting ? undefined : handleConfirmExtra}
                  style={({ pressed }) => [
                    styles.footerButton,
                    styles.footerButtonPrimary,
                    (requiresReason
                      ? cancelReason.trim().length === 0
                      : requiresVisitDate && !isDatePickerVisible && !visitDate) &&
                      styles.footerButtonDisabled,
                    pressed && styles.footerButtonPressed,
                  ]}
                  disabled={
                    isSubmitting ||
                    (requiresReason
                      ? cancelReason.trim().length === 0
                      : requiresVisitDate && !isDatePickerVisible && !visitDate)
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar"
                >
                  <Text style={styles.footerButtonPrimaryText}>
                    {isSubmitting
                      ? "Salvando..."
                      : requiresVisitDate && isDatePickerVisible
                        ? "Confirmar data"
                        : "Confirmar"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[2],
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    paddingHorizontal: tokens.spacing[5],
    paddingBottom: tokens.spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  headerText: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.brand.primary,
  },
  subtitle: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  closeButton: {
    padding: tokens.spacing[1],
  },
  optionsContent: {
    gap: tokens.spacing[2],
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.gray[200],
    backgroundColor: tokens.colors.white,
  },
  optionSelected: {
    borderColor: tokens.colors.brand.green,
    backgroundColor: `${tokens.colors.brand.green}10`,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionBody: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[800],
  },
  optionLabelSelected: {
    fontFamily: Fonts.bold,
    color: tokens.colors.brand.green,
  },
  extraContainer: {
    gap: tokens.spacing[3],
  },
  extraContainerExpanded: {},
  extraLabel: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
    backgroundColor: tokens.colors.white,
    minHeight: 96,
    textAlignVertical: "top",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing[3],
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    minHeight: 48,
    backgroundColor: tokens.colors.white,
  },
  dateButtonText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
  },
  dateButtonPlaceholder: {
    color: tokens.colors.gray[500],
  },
  datePickerWrapper: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.white,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    height: 240,
  },
  datePickerInner: {
    width: "100%",
    height: 216,
  },
  footer: {
    flexDirection: "row",
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[5],
    paddingTop: tokens.spacing[3],
    paddingBottom: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray[200],
    backgroundColor: tokens.colors.white,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: tokens.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing[3],
  },
  footerButtonPressed: {
    opacity: 0.7,
  },
  footerButtonDisabled: {
    opacity: 0.4,
  },
  footerButtonSecondary: {
    borderWidth: 1,
    borderColor: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.white,
  },
  footerButtonSecondaryText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
    textTransform: "uppercase",
  },
  footerButtonPrimary: {
    backgroundColor: tokens.colors.brand.green,
  },
  footerButtonPrimaryText: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.white,
    textTransform: "uppercase",
  },
});
