import { zodResolver } from "@hookform/resolvers/zod";
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
import { usePasswordReset } from "../hooks/use-password-reset";
import {
  passwordResetSchema,
  type PasswordResetRequestFormData,
} from "../schemas/password-reset.schema";

export function ForgotPasswordScreen() {
  const { handleRequestReset, goBackToLogin, isLoading } = usePasswordReset();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
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
                <Text style={styles.title}>Recuperar senha</Text>
                <Text style={styles.description}>
                  Informe o e-mail cadastrado e enviaremos um código de 6 dígitos para você continuar redefinindo a sua senha.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="Digite seu e-mail"
                      placeholderTextColor={tokens.colors.gray[500]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>

              <Button
                label={isLoading ? "ENVIANDO..." : "ENVIAR INSTRUÇÕES"}
                variant="primary"
                size="md"
                onPress={handleSubmit(handleRequestReset)}
                disabled={isLoading}
                containerStyle={styles.buttonContainer}
              />

              <Pressable
                onPress={goBackToLogin}
                style={styles.linkContainer}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Voltar para o login</Text>
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
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.bold,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.brand.primary,
  },
});
