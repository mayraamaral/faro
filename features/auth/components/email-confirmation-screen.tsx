import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { LogoWordmark } from "@/components/ui/logo-wordmark";
import { Fonts } from "@/constants/theme";
import { tokens } from "@/constants/tokens";
import { useEmailConfirmation } from "../hooks/use-email-confirmation";
import {
  emailConfirmationSchema,
  type EmailConfirmationFormData,
} from "../schemas/email-confirmation.schema";

export function EmailConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const { handleConfirmEmail, handleResendEmail, isLoading, isResending } =
    useEmailConfirmation(email);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailConfirmationFormData>({
    resolver: zodResolver(emailConfirmationSchema),
    defaultValues: {
      code: "",
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <LogoWordmark size="sm" />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>Confirme seu e-mail</Text>
                <Text style={styles.description}>
                  Digite o código de 6 dígitos enviado para {email || "seu e-mail"}.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código de confirmação</Text>
                <Controller
                  control={control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.codeInput,
                        errors.code && styles.inputError,
                      ]}
                      placeholder="000000"
                      placeholderTextColor={tokens.colors.gray[500]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                    />
                  )}
                />
                {errors.code && <Text style={styles.errorText}>{errors.code.message}</Text>}
              </View>

              <Button
                label={isLoading ? "CONFIRMANDO..." : "CONFIRMAR E-MAIL"}
                variant="primary"
                size="md"
                onPress={handleSubmit(handleConfirmEmail)}
                disabled={isLoading || !email}
                containerStyle={styles.buttonContainer}
              />

              <Pressable
                onPress={() => {
                  void handleResendEmail();
                }}
                style={styles.linkContainer}
                disabled={isResending || !email}
              >
                <Text style={styles.linkText}>
                  {isResending ? "Reenviando..." : "Não recebeu o e-mail? Reenviar código"}
                </Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/login")} style={styles.linkContainer}>
                <Text style={styles.linkText}>Voltar para login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.brand.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: tokens.spacing[6],
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[6],
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: tokens.spacing[8],
    marginTop: tokens.spacing[4],
  },
  formContainer: {
    gap: tokens.spacing[4],
  },
  textContainer: {
    gap: tokens.spacing[2],
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.gray[900],
    textAlign: "center",
  },
  description: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
    textAlign: "center",
    lineHeight: tokens.lineHeight.sm,
  },
  inputGroup: {
    gap: tokens.spacing[2],
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[700],
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.gray[900],
    backgroundColor: tokens.colors.white,
  },
  codeInput: {
    letterSpacing: 6,
  },
  inputError: {
    borderColor: tokens.colors.red[500],
  },
  errorText: {
    fontFamily: Fonts.primary,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.red[500],
  },
  buttonContainer: {
    marginTop: tokens.spacing[2],
  },
  linkContainer: {
    alignItems: "center",
    marginTop: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
  },
  linkText: {
    fontFamily: Fonts.medium,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
  },
});
