import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { AuthError } from "../domain/errors/auth.errors";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth.repository";
import type { RecoveryCodeFormData } from "../schemas/recovery-code.schema";
import { VerifyRecoveryCodeUseCase } from "../use-cases/verify-recovery-code.use-case";

const authRepository = new SupabaseAuthRepository();
const verifyRecoveryCodeUseCase = new VerifyRecoveryCodeUseCase(authRepository);

export function useRecoveryCode(email: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const handleVerifyCode = async (data: RecoveryCodeFormData) => {
    try {
      setIsLoading(true);
      await verifyRecoveryCodeUseCase.execute(email, data.code.trim());
      router.replace("/new-password");
    } catch (error) {
      if (error instanceof AuthError && error.code === "INVALID_CONFIRMATION_CODE") {
        Alert.alert("Código inválido", "Verifique o código de 6 dígitos e tente novamente.");
        return;
      }

      Alert.alert(
        "Erro na verificação",
        "Não foi possível verificar o código. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert("E-mail inválido", "Não encontramos o e-mail para reenviar o código.");
      return;
    }

    try {
      setIsResending(true);
      await authRepository.resendRecoveryCode(email);
      Alert.alert("Código reenviado", "Enviamos um novo código para o seu e-mail.");
    } catch (error) {
      if (error instanceof AuthError && error.code === "RATE_LIMITED") {
        Alert.alert(
          "Aguarde um pouco",
          "Você solicitou muitos envios. Tente novamente em alguns minutos."
        );
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
    handleVerifyCode,
    handleResendCode,
  };
}
