import { AdoptionRepository } from "../domain/repositories/adoption.repository";
import { AdoptionEntity } from "../domain/entities/adoption.entity";

export class GetAdoptionByIdUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(adoptionId: string): Promise<AdoptionEntity | null> {
    if (!adoptionId) return null;
    return await this.adoptionRepository.getAdoptionById(adoptionId);
  }
}
