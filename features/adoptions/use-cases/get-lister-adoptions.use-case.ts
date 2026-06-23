import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';

export class GetListerAdoptionsUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(listerProfileId: string): Promise<AdoptionEntity[]> {
    if (!listerProfileId) return [];
    return await this.adoptionRepository.getAdoptionsByListerId(listerProfileId);
  }
}
