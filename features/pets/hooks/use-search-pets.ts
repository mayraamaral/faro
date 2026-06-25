import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdopterAnimal } from "../domain/entities/adopter-animal.entity";
import {
  EMPTY_ANIMAL_SEARCH_FILTERS,
  type AnimalAgeCategory,
  type AnimalCategory,
  type AnimalSearchFilters,
  type AnimalSearchOptions,
  type AnimalSize,
} from "../domain/entities/animal-search-filter";
import { PetSearchError, type PetSearchErrorCode } from "../domain/errors/pet-search.errors";
import { SupabaseAnimalRepository } from "../infrastructure/supabase-animal.repository";
import { GetAnimalSearchOptionsUseCase } from "../use-cases/get-animal-search-options.use-case";
import { SearchAnimalsUseCase } from "../use-cases/search-animals.use-case";
import { useDeviceLocation } from "./use-device-location";

const animalRepository = new SupabaseAnimalRepository();
const getAnimalSearchOptionsUseCase = new GetAnimalSearchOptionsUseCase(animalRepository);
const searchAnimalsUseCase = new SearchAnimalsUseCase(animalRepository);

const UI_MESSAGES: Record<PetSearchErrorCode, string> = {
  LOCATION_UNAVAILABLE: "Não foi possível acessar sua localização para buscar pets próximos.",
  SEARCH_OPTIONS_UNAVAILABLE: "Não foi possível carregar os filtros de busca.",
  SEARCH_UNAVAILABLE: "Não foi possível buscar pets agora. Tente novamente.",
  UNKNOWN: "Algo deu errado. Tente novamente.",
};

const emptyOptions: AnimalSearchOptions = {
  categories: [],
  sizes: [],
  ageCategories: [],
};

const toggleValue = <TValue extends string>(values: TValue[], value: TValue): TValue[] => {
  if (values.includes(value)) {
    return values.filter((currentValue) => currentValue !== value);
  }

  return [...values, value];
};

const getPetSearchErrorMessage = (error: unknown, fallbackCode: PetSearchErrorCode) => {
  const code = error instanceof PetSearchError ? error.code : fallbackCode;
  return UI_MESSAGES[code];
};

export function useSearchPets() {
  const { resolveCurrentLocation } = useDeviceLocation();
  const [options, setOptions] = useState<AnimalSearchOptions>(emptyOptions);
  const [filters, setFilters] = useState<AnimalSearchFilters>(EMPTY_ANIMAL_SEARCH_FILTERS);
  const [results, setResults] = useState<AdopterAnimal[]>([]);
  const [hasAppliedSearch, setHasAppliedSearch] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFilterCount = useMemo(
    () =>
      filters.categories.length +
      filters.sizes.length +
      filters.ageCategories.length +
      (filters.name.trim() ? 1 : 0),
    [filters]
  );

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        setError(null);

        const searchOptions = await getAnimalSearchOptionsUseCase.execute();
        if (!cancelled) {
          setOptions(searchOptions);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getPetSearchErrorMessage(loadError, "SEARCH_OPTIONS_UNAVAILABLE"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const setName = useCallback((name: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      name,
    }));
  }, []);

  const setRadiusKm = useCallback((radiusKm: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      radiusKm,
    }));
  }, []);

  const toggleCategory = useCallback((category: AnimalCategory) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      categories: toggleValue(currentFilters.categories, category),
    }));
  }, []);

  const toggleSize = useCallback((size: AnimalSize) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      sizes: toggleValue(currentFilters.sizes, size),
    }));
  }, []);

  const toggleAgeCategory = useCallback((ageCategory: AnimalAgeCategory) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ageCategories: toggleValue(currentFilters.ageCategories, ageCategory),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_ANIMAL_SEARCH_FILTERS);
    setResults([]);
    setHasAppliedSearch(false);
    setError(null);
  }, []);

  const applyFilters = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);

      const location = await resolveCurrentLocation();
      const animals = await searchAnimalsUseCase.execute(
        Number(location.latitude),
        Number(location.longitude),
        filters.radiusKm,
        filters
      );

      setResults(animals);
      setHasAppliedSearch(true);
    } catch (searchError) {
      setError(getPetSearchErrorMessage(searchError, "SEARCH_UNAVAILABLE"));
    } finally {
      setIsSearching(false);
    }
  }, [filters, resolveCurrentLocation]);

  return {
    options,
    filters,
    results,
    hasAppliedSearch,
    isLoadingOptions,
    isSearching,
    error,
    selectedFilterCount,
    setName,
    setRadiusKm,
    toggleCategory,
    toggleSize,
    toggleAgeCategory,
    clearFilters,
    applyFilters,
  };
}
