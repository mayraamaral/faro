import type { AnimalSearchOptions } from "../domain/entities/animal-search-filter";
import type { AnimalRepository } from "../domain/repositories/animal.repository";

export class GetAnimalSearchOptionsUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(): Promise<AnimalSearchOptions> {
    return this.animalRepository.getSearchOptions();
  }
}
