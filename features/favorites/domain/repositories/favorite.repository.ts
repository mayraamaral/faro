import type { FavoriteAnimal } from "../entities/favorite-animal.entity";

export interface FavoriteRepository {
  toggle(adopterProfileId: string, animalId: string): Promise<boolean>;
  isFavorited(adopterProfileId: string, animalId: string): Promise<boolean>;
  getAll(adopterProfileId: string): Promise<FavoriteAnimal[]>;
}
