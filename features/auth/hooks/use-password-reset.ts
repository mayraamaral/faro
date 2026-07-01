import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { AuthError, type AuthErrorCode } from "../domain/errors/auth.errors";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth.repository";
import type { PasswordResetRequestFormData } from "../schemas/password-reset.schema";
import { RequestPasswordResetUseCase } from "../use-cases/request-password-reset.use-case";

const authRepository = new SupabaseAuthRepository();
const requestPasswordResetUseCase = new RequestPasswordResetUseCase(authRepository);

const UI_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  INVALID_CONFIRMATION_CODE: "Código de confirmação inválido.",
  EMAIL_NOT_CONFIRMED: "Confirme seu e-mail antes de entrar.",
  PASSWORD_RESET_FAILED:
    "Não foi possível enviar as instruções. Verifique o e-mail e tente novamente.",
  SAME_PASSWORD: "A nova senha deve ser diferente da senha atual.",
  WEAK_PASSWORD: "A senha é muito fraca. Use pelo menos 6 caracteres.",
  RATE_LIMITED: "Muitas tentativas. Tente novamente em alguns minutos.",
  NETWORK: "Sem conexão. Verifique sua internet.",
  UNKNOWN: "Não foi possível enviar as instruções. Tente novamente.",
};

export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestReset = async (data: PasswordResetRequestFormData) => {
    try {
      setIsLoading(true);
      await requestPasswordResetUseCase.execute(data);
      router.push({
        pathname: "/verify-recovery-code",
        params: { email: data.email.trim().toLowerCase() },
      } as any);
    } catch (error) {
      const code = error instanceof AuthError ? error.code : "UNKNOWN";
      Alert.alert("Erro na recuperação", UI_MESSAGES[code]);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    router.replace("/login");
  };

  return {
    handleRequestReset,
    goBackToLogin,
    isLoading,
  };
}
