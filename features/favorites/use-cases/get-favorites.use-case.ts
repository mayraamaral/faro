import type { FavoriteRepository } from "../domain/repositories/favorite.repository";
import type { FavoriteAnimal } from "../domain/entities/favorite-animal.entity";
import { FavoriteError } from "../domain/errors/favorite.errors";

export class GetFavoritesUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(adopterProfileId: string): Promise<FavoriteAnimal[]> {
    if (!adopterProfileId) {
      throw new FavoriteError(
        "ADOPTER_PROFILE_REQUIRED",
        "Perfil de adotante não encontrado.",
      );
    }

    try {
      return await this.favoriteRepository.getAll(adopterProfileId);
    } catch (error) {
      if (error instanceof FavoriteError) throw error;
      throw new FavoriteError(
        "FETCH_FAILED",
        "Não foi possível carregar seus favoritos.",
      );
    }
  }
}
