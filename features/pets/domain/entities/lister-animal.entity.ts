import { formatPetAgeLabel } from "../../utils/format-pet-age-label";

export type ListerAnimal = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  age: string;
  city: string;
  state: string;
  adoptionStatus: string;
  photoUrl: string | null;
};

export const toListerAnimal = (row: {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  city: string;
  state: string;
  adoptionStatus: string;
  photoUrl: string | null;
}): ListerAnimal => ({
  id: row.id,
  name: row.name,
  species: row.species,
  sex: row.sex,
  size: row.size,
  birthDate: row.birthDate,
  age: formatPetAgeLabel(row.birthDate),
  city: row.city,
  state: row.state,
  adoptionStatus: row.adoptionStatus,
  photoUrl: row.photoUrl,
});
