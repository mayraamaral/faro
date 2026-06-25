import type { AnimalRepository } from "../domain/repositories/animal.repository";
import type { Adoption, AdoptionStatus } from "../domain/entities/adoption.entity";
import { isAdoptionStatus } from "../domain/entities/adoption.entity";
import { UpdateAdoptionStatusError } from "../domain/errors/update-adoption-status.errors";

export class UpdateAdoptionStatusUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(params: {
    userId: string;
    adoptionId: string;
    status: string;
    cancelReason?: string;
    visitDate?: string | null;
  }): Promise<Adoption> {
    if (!params.adoptionId) {
      throw new UpdateAdoptionStatusError(
        "ADOPTION_ID_REQUIRED",
        "ID da adoção é obrigatório.",
      );
    }

    if (!isAdoptionStatus(params.status)) {
      throw new UpdateAdoptionStatusError(
        "INVALID_STATUS",
        "Status da adoção inválido.",
      );
    }

    const status: AdoptionStatus = params.status;
    const needsReason = status === "CANCELED" || status === "REJECTED";
    const cancelReason = params.cancelReason?.trim() ?? "";
    if (needsReason && cancelReason.length === 0) {
      throw new UpdateAdoptionStatusError(
        "UPDATE_FAILED",
        "Para cancelar ou recusar a adoção, é necessário informar o motivo.",
      );
    }

    const needsVisitDate =
      status === "VISIT_PENDING" || status === "VISITED";
    const visitDate = params.visitDate ?? null;
    if (needsVisitDate && !visitDate) {
      const message =
        status === "VISIT_PENDING"
          ? "Para marcar como visita agendada, é necessário informar a data da visita."
          : "Para marcar como visita realizada, é necessário informar a data da visita.";
      throw new UpdateAdoptionStatusError("UPDATE_FAILED", message);
    }

    const context = await this.animalRepository.getListerContextByUserId(
      params.userId,
    );

    if (!context.listerProfileId) {
      throw new UpdateAdoptionStatusError(
        "LISTER_NOT_FOUND",
        "Perfil de doador/abrigo não encontrado.",
      );
    }

    try {
      return await this.animalRepository.updateAdoptionStatusForLister(
        context.listerProfileId,
        params.adoptionId,
        status,
        needsReason ? cancelReason : null,
        needsVisitDate ? visitDate : null,
      );
    } catch (error) {
      if (error instanceof UpdateAdoptionStatusError) throw error;
      throw new UpdateAdoptionStatusError(
        "UPDATE_FAILED",
        "Não foi possível atualizar o status da adoção.",
      );
    }
  }
}
