import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
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
import { useNewPassword } from "../hooks/use-new-password";
import {
  newPasswordSchema,
  type NewPasswordFormData,
} from "../schemas/new-password.schema";

export function NewPasswordScreen() {
  const { handleUpdatePassword, isLoading } = useNewPassword();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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
                <Text style={styles.title}>Defina uma nova senha</Text>
                <Text style={styles.description}>
                  Crie uma nova senha para acessar a sua conta.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova senha</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Digite a nova senha"
                      placeholderTextColor={tokens.colors.gray[500]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                    />
                  )}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar nova senha</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.inputError,
                      ]}
                      placeholder="Digite a senha novamente"
                      placeholderTextColor={tokens.colors.gray[500]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              <Button
                label={isLoading ? "SALVANDO..." : "SALVAR NOVA SENHA"}
                variant="primary"
                size="md"
                onPress={handleSubmit(handleUpdatePassword)}
                disabled={isLoading}
                containerStyle={styles.buttonContainer}
              />
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
});
