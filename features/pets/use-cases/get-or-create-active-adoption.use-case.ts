import type { Adoption } from "../domain/entities/adoption.entity";
import type { AnimalRepository } from "../domain/repositories/animal.repository";
import { StartAdoptionError } from "../domain/errors/start-adoption.errors";

export class GetOrCreateActiveAdoptionUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(params: {
    animalId: string;
    adopterProfileId: string;
  }): Promise<Adoption> {
    if (!params.animalId) {
      throw new StartAdoptionError(
        "ANIMAL_ID_REQUIRED",
        "ID do animal é obrigatório."
      );
    }
    if (!params.adopterProfileId) {
      throw new StartAdoptionError(
        "ADOPTER_PROFILE_REQUIRED",
        "Perfil de adotante não encontrado."
      );
    }

    try {
      return await this.animalRepository.getOrCreateActiveAdoption(
        params.animalId,
        params.adopterProfileId
      );
    } catch (error) {
      if (error instanceof StartAdoptionError) throw error;
      throw new StartAdoptionError(
        "ADOPTION_CREATE_FAILED",
        "Não foi possível iniciar a adoção."
      );
    }
  }
}
