import type { Adoption } from "../entities/adoption.entity";
import type { AnimalRegistrationEntity } from "../entities/animal-registration.entity";
import type { UserRole } from "../entities/current-user.entity";
import type { ListerAnimal } from "../entities/lister-animal.entity";
import type { AdopterAnimal } from "../entities/adopter-animal.entity";
import type {
  AnimalSearchFilters,
  AnimalSearchOptions,
} from "../entities/animal-search-filter";

export type ListerContext = {
  userId: string;
  role: UserRole | null;
  listerProfileId: string | null;
};

export type ExistingAnimalPhoto = {
  storagePath: string;
  signedUrl: string;
};

export type AnimalDetail = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  healthNotes: string | null;
  behaviorNotes: string | null;
  interestingFacts: string | null;
  isNeutered: boolean;
  isVaccinated: boolean;
  adoptionStatus: string;
  existingPhotos: ExistingAnimalPhoto[];
};

export interface AnimalRepository {
  getListerContextByUserId(userId: string): Promise<ListerContext>;
  hasAnimalsForLister(listerProfileId: string): Promise<boolean>;
  getAnimalsForLister(listerProfileId: string): Promise<ListerAnimal[]>;
  getAnimalDetailForLister(
    listerProfileId: string,
    animalId: string,
  ): Promise<AnimalDetail | null>;
  updateForLister(
    listerProfileId: string,
    animalId: string,
    entity: AnimalRegistrationEntity,
  ): Promise<void>;
  replaceAnimalPhotos(
    animalId: string,
    storagePaths: string[],
  ): Promise<void>;
  getNearbyAnimals(
    lat: number,
    lng: number,
    radiusKm: number,
    filters?: AnimalSearchFilters
  ): Promise<AdopterAnimal[]>;
  getSearchOptions(): Promise<AnimalSearchOptions>;
  createForLister(
    listerProfileId: string,
    entity: AnimalRegistrationEntity
  ): Promise<void>;
  getOrCreateActiveAdoption(
    animalId: string,
    adopterProfileId: string
  ): Promise<Adoption>;
}
