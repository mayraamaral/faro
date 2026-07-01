import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { AuthError } from "../domain/errors/auth.errors";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth.repository";
import type { EmailConfirmationFormData } from "../schemas/email-confirmation.schema";
import { ConfirmEmailUseCase } from "../use-cases/confirm-email.use-case";

const authRepository = new SupabaseAuthRepository();
const confirmEmailUseCase = new ConfirmEmailUseCase(authRepository);

export function useEmailConfirmation(email: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const handleConfirmEmail = async (data: EmailConfirmationFormData) => {
    try {
      setIsLoading(true);
      await confirmEmailUseCase.execute(email, data.code.trim());
      router.replace("/");
    } catch (error) {
      if (error instanceof AuthError && error.code === "INVALID_CONFIRMATION_CODE") {
        Alert.alert("Código inválido", "Verifique o código de 6 dígitos e tente novamente.");
        return;
      }

      Alert.alert("Erro na confirmação", "Não foi possível confirmar o e-mail. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert("E-mail inválido", "Não encontramos o e-mail para reenviar o código.");
      return;
    }

    try {
      setIsResending(true);
      await authRepository.resendConfirmationEmail(email);
      Alert.alert("E-mail reenviado", "Enviamos um novo código para o seu e-mail.");
    } catch (error) {
      if (error instanceof AuthError && error.code === "RATE_LIMITED") {
        Alert.alert("Aguarde um pouco", "Você solicitou muitos envios. Tente novamente em alguns minutos.");
        return;
      }

      Alert.alert("Erro no reenvio", "Não foi possível reenviar o código. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  };

  return {
    isLoading,
    isResending,
    handleConfirmEmail,
    handleResendEmail,
  };
}
