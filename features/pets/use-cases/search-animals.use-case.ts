import type { AnimalSearchFilters } from "../domain/entities/animal-search-filter";
import type { AdopterAnimal } from "../domain/entities/adopter-animal.entity";
import type { AnimalRepository } from "../domain/repositories/animal.repository";

const matchesName = (animalName: string, query: string): boolean => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return animalName.toLowerCase().includes(trimmed);
};

export class SearchAnimalsUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(
    lat: number,
    lng: number,
    radiusKm: number,
    filters: AnimalSearchFilters
  ): Promise<AdopterAnimal[]> {
    const animals = await this.animalRepository.getNearbyAnimals(
      lat,
      lng,
      radiusKm,
      filters
    );

    if (!filters.name.trim()) {
      return animals;
    }

    return animals.filter((animal) => matchesName(animal.name, filters.name));
  }
}
