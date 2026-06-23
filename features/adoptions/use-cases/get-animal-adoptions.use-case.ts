import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';

export class GetAnimalAdoptionsUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(animalId: string): Promise<AdoptionEntity[]> {
    if (!animalId) return [];
    return await this.adoptionRepository.getAdoptionsByAnimalId(animalId);
  }
}
