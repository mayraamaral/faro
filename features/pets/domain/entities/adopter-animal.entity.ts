export type AdopterAnimal = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  city: string;
  state: string;
  distanceKm: number;
  photoUrl: string | null;
  healthNotes: string | null;
  behaviorNotes: string | null;
  interestingFacts: string | null;
  isVaccinated: boolean | null;
  isNeutered: boolean | null;
};
