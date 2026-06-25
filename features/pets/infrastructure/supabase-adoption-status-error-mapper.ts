import { UpdateAdoptionStatusError } from "../domain/errors/update-adoption-status.errors";

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const PGRST_NO_ROWS = "PGRST116";
const PGRST_CHECK_VIOLATION = "23514";
const PGRST_FOREIGN_KEY_VIOLATION = "23503";
const AUTH_403_DENIED = "42501";

const CHECK_VIOLATION_HINTS: Record<string, string> = {
  adoptions_adopted_requires_date:
    "Para marcar como adotado, é necessário definir a data de adoção.",
  adoptions_adopted_requires_adopter:
    "Não é possível marcar como adotado sem um adotante vinculado.",
  adoptions_terminal_requires_reason:
    "Para cancelar ou recusar a adoção, é necessário informar o motivo.",
  adoptions_visit_pending_requires_scheduled:
    "Para marcar como visita agendada, é necessário informar a data da visita.",
  adoptions_visited_requires_visited_at:
    "Para marcar como visita realizada, é necessário informar quando a visita aconteceu.",
  adoptions_in_progress_requires_adopter:
    "Para voltar ao status em andamento, é necessário manter um adotante vinculado.",
  adoptions_adaptation_dates_ordered:
    "A data de fim da adaptação não pode ser anterior à data de início.",
};

const humanizeCheckViolation = (raw: string | null | undefined): string => {
  if (!raw) return "Não foi possível atualizar o status da adoção.";
  for (const [constraint, message] of Object.entries(CHECK_VIOLATION_HINTS)) {
    if (raw.includes(constraint)) return message;
  }
  return "Não foi possível atualizar o status da adoção.";
};

export const mapSupabaseUpdateAdoptionStatusError = (
  error: SupabaseLikeError | null | undefined,
): UpdateAdoptionStatusError => {
  const code = error?.code ?? null;
  const rawMessage = error?.message ?? null;
  const details = error?.details ?? null;

  if (code === PGRST_NO_ROWS) {
    return new UpdateAdoptionStatusError(
      "ADOPTION_NOT_FOUND",
      "Adoção não encontrada.",
    );
  }

  if (code === PGRST_CHECK_VIOLATION) {
    return new UpdateAdoptionStatusError(
      "UPDATE_FAILED",
      humanizeCheckViolation(details ?? rawMessage),
    );
  }

  if (code === AUTH_403_DENIED) {
    return new UpdateAdoptionStatusError(
      "UPDATE_FAILED",
      "Você não tem permissão para atualizar o status desta adoção.",
    );
  }

  if (code === PGRST_FOREIGN_KEY_VIOLATION) {
    return new UpdateAdoptionStatusError(
      "UPDATE_FAILED",
      "Adoção inválida ou inexistente.",
    );
  }

  return new UpdateAdoptionStatusError(
    "UNKNOWN",
    rawMessage ?? "Erro desconhecido ao atualizar o status.",
  );
};
