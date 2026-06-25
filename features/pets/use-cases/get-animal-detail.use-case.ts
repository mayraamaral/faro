import type { AnimalDetail, AnimalRepository } from "../domain/repositories/animal.repository";

export class GetAnimalDetailUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(
    userId: string,
    animalId: string,
  ): Promise<AnimalDetail | null> {
    const context = await this.animalRepository.getListerContextByUserId(userId);
    if (!context.listerProfileId) {
      return null;
    }
    return this.animalRepository.getAnimalDetailForLister(
      context.listerProfileId,
      animalId,
    );
  }
}
