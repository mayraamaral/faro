import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';

export class GetAdopterAdoptionsUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(adopterProfileId: string): Promise<AdoptionEntity[]> {
    if (!adopterProfileId) return [];
    return await this.adoptionRepository.getAdoptionsByAdopterId(adopterProfileId);
  }
}
