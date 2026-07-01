import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { AuthError, type AuthErrorCode } from "../domain/errors/auth.errors";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth.repository";
import type { NewPasswordFormData } from "../schemas/new-password.schema";
import { UpdatePasswordUseCase } from "../use-cases/update-password.use-case";

const authRepository = new SupabaseAuthRepository();
const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

const UI_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: "Sessão expirada. Inicie a recuperação de senha novamente.",
  INVALID_CONFIRMATION_CODE: "Código de confirmação inválido.",
  EMAIL_NOT_CONFIRMED: "Confirme seu e-mail antes de continuar.",
  PASSWORD_RESET_FAILED:
    "Não foi possível atualizar a senha. Tente novamente em alguns instantes.",
  SAME_PASSWORD: "A nova senha deve ser diferente da senha atual.",
  WEAK_PASSWORD: "A senha é muito fraca. Use pelo menos 6 caracteres.",
  RATE_LIMITED: "Muitas tentativas. Tente novamente em alguns minutos.",
  NETWORK: "Sem conexão. Verifique sua internet.",
  UNKNOWN: "Não foi possível atualizar a senha. Tente novamente.",
};

export function useNewPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (data: NewPasswordFormData) => {
    try {
      setIsLoading(true);
      await updatePasswordUseCase.execute(data);
      await authRepository.logout();
      Alert.alert(
        "Senha atualizada",
        "Sua senha foi redefinida com sucesso. Faça login novamente."
      );
      router.replace("/login");
    } catch (error) {
      const code = error instanceof AuthError ? error.code : "UNKNOWN";
      Alert.alert("Erro ao atualizar senha", UI_MESSAGES[code]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUpdatePassword,
    isLoading,
  };
}
