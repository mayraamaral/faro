export const ANIMAL_CATEGORY_VALUES = ["DOG", "CAT", "BIRD", "RABBIT", "OTHER"] as const;
export const ANIMAL_SIZE_VALUES = ["SMALL", "MEDIUM", "LARGE"] as const;
export const ANIMAL_AGE_CATEGORY_VALUES = ["BABY", "ADULT", "SENIOR"] as const;

export const ANIMAL_SEARCH_RADIUS_MIN_KM = 1;
export const ANIMAL_SEARCH_RADIUS_MAX_KM = 100;
export const ANIMAL_SEARCH_RADIUS_DEFAULT_KM = 50;
export const ANIMAL_SEARCH_RADIUS_STEP_KM = 1;

export type AnimalCategory = (typeof ANIMAL_CATEGORY_VALUES)[number];
export type AnimalSize = (typeof ANIMAL_SIZE_VALUES)[number];
export type AnimalAgeCategory = (typeof ANIMAL_AGE_CATEGORY_VALUES)[number];

export type AnimalSearchFilters = {
  name: string;
  categories: AnimalCategory[];
  sizes: AnimalSize[];
  ageCategories: AnimalAgeCategory[];
  radiusKm: number;
};

export type AnimalSearchOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type AnimalSearchOptions = {
  categories: AnimalSearchOption<AnimalCategory>[];
  sizes: AnimalSearchOption<AnimalSize>[];
  ageCategories: AnimalSearchOption<AnimalAgeCategory>[];
};

export const EMPTY_ANIMAL_SEARCH_FILTERS: AnimalSearchFilters = {
  name: "",
  categories: [],
  sizes: [],
  ageCategories: [],
  radiusKm: ANIMAL_SEARCH_RADIUS_DEFAULT_KM,
};
