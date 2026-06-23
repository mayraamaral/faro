import { AdoptionEntity } from '../entities/adoption.entity';

export interface AdoptionRepository {
  createAdoption(entity: AdoptionEntity): Promise<AdoptionEntity>;
  updateAdoption(entity: AdoptionEntity): Promise<AdoptionEntity>;
  getAdoptionById(id: string): Promise<AdoptionEntity | null>;
  getAdoptionsByAnimalId(animalId: string): Promise<AdoptionEntity[]>;
  getAdoptionsByAdopterId(adopterProfileId: string): Promise<AdoptionEntity[]>;
  getAdoptionsByListerId(listerProfileId: string): Promise<AdoptionEntity[]>;
}
