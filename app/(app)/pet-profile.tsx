import { useLocalSearchParams } from "expo-router";

import {
  PetProfileScreen,
  type PetProfileData,
} from "@/features/pets/components/pet-profile-screen";

type PetProfileParams = {
  id?: string;
  name?: string;
  species?: string;
  sex?: string;
  size?: string;
  birthDate?: string;
  city?: string;
  state?: string;
  distanceKm?: string;
  photoUrl?: string;
  healthNotes?: string;
  behaviorNotes?: string;
  interestingFacts?: string;
  isVaccinated?: string;
  isNeutered?: string;
};

const normalizeParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";

  return value ?? "";
};

const normalizeOptionalParam = (value: string | string[] | undefined) => {
  const normalized = normalizeParam(value).trim();

  return normalized ? normalized : null;
};

const parseBooleanParam = (value: string | string[] | undefined) => {
  const normalized = normalizeParam(value);

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return null;
};

const parseAnimalFromParams = (params: PetProfileParams): PetProfileData | null => {
  const id = normalizeParam(params.id).trim();
  const name = normalizeParam(params.name).trim();
  const birthDate = normalizeParam(params.birthDate).trim();
  const distanceKm = Number.parseFloat(normalizeParam(params.distanceKm));

  if (!id || !name || !birthDate || !Number.isFinite(distanceKm)) return null;

  return {
    id,
    name,
    species: normalizeParam(params.species),
    sex: normalizeParam(params.sex),
    size: normalizeParam(params.size),
    birthDate,
    city: normalizeParam(params.city),
    state: normalizeParam(params.state),
    distanceKm,
    photoUrl: normalizeOptionalParam(params.photoUrl),
    healthNotes: normalizeOptionalParam(params.healthNotes),
    behaviorNotes: normalizeOptionalParam(params.behaviorNotes),
    interestingFacts: normalizeOptionalParam(params.interestingFacts),
    isVaccinated: parseBooleanParam(params.isVaccinated),
    isNeutered: parseBooleanParam(params.isNeutered),
  };
};

export default function PetProfileRoute() {
  const params = useLocalSearchParams<PetProfileParams>();
  const animal = parseAnimalFromParams(params);

  return <PetProfileScreen animal={animal} />;
}
