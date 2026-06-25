import type { FavoriteRepository } from "../domain/repositories/favorite.repository";
import { FavoriteError } from "../domain/errors/favorite.errors";

export class ToggleFavoriteUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(
    adopterProfileId: string,
    animalId: string,
  ): Promise<boolean> {
    if (!animalId) {
      throw new FavoriteError(
        "ANIMAL_ID_REQUIRED",
        "ID do animal é obrigatório.",
      );
    }

    if (!adopterProfileId) {
      throw new FavoriteError(
        "ADOPTER_PROFILE_REQUIRED",
        "Perfil de adotante não encontrado.",
      );
    }

    try {
      return await this.favoriteRepository.toggle(
        adopterProfileId,
        animalId,
      );
    } catch (error) {
      if (error instanceof FavoriteError) throw error;
      throw new FavoriteError(
        "TOGGLE_FAILED",
        "Não foi possível favoritar o pet.",
      );
    }
  }
}
