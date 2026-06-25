import { supabase } from "@/lib/supabase";
import { extractStoragePath } from "../utils/extract-storage-path";
import { mapSupabasePetSearchError } from "./supabase-pet-search-error-mapper";
import { mapSupabaseUpdateAdoptionStatusError } from "./supabase-adoption-status-error-mapper";
import type { AnimalRepository } from "../domain/repositories/animal.repository";
import type { AnimalDetail, ExistingAnimalPhoto } from "../domain/repositories/animal.repository";
import type { Adoption, AdoptionStatus } from "../domain/entities/adoption.entity";
import type { AnimalRegistrationEntity } from "../domain/entities/animal-registration.entity";
import type { UserRole } from "../domain/entities/current-user.entity";
import { toListerAnimal, type ListerAnimal } from "../domain/entities/lister-animal.entity";
import type { AdopterAnimal } from "../domain/entities/adopter-animal.entity";
import {
  ANIMAL_AGE_CATEGORY_VALUES,
  ANIMAL_CATEGORY_VALUES,
  ANIMAL_SIZE_VALUES,
  type AnimalAgeCategory,
  type AnimalCategory,
  type AnimalSearchFilters,
  type AnimalSearchOption,
  type AnimalSearchOptions,
  type AnimalSize,
} from "../domain/entities/animal-search-filter";

type AnimalPhotoRow = {
  photo_url: string | null;
};

type ListerAnimalRow = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birth_date: string;
  city: string;
  state: string;
  adoption_status: string;
  animal_photos: AnimalPhotoRow[] | null;
};

type NearbyAnimalRow = {
  id: string;
  name: string;
  species: string;
  sex: string;
  size: string;
  birth_date: string;
  city: string;
  state: string;
  distance_km: number;
  photo_url: string | null;
  health_notes?: string | null;
  behavior_notes?: string | null;
  interesting_facts?: string | null;
  is_vaccinated?: boolean | null;
  is_neutered?: boolean | null;
};

type SearchOptionGroup = "CATEGORY" | "SIZE" | "AGE";

type SearchOptionRow = {
  option_group: SearchOptionGroup;
  value: string;
  label: string;
  display_order: number;
};

type AdoptionRow = {
  id: string;
  animal_id: string;
  adopter_profile_id: string | null;
  status: string;
  created_at: string;
};

const toAdoption = (row: AdoptionRow): Adoption => ({
  id: row.id,
  animalId: row.animal_id,
  adopterProfileId: row.adopter_profile_id,
  status: row.status,
  createdAt: row.created_at,
});

const isAnimalCategory = (value: string): value is AnimalCategory =>
  ANIMAL_CATEGORY_VALUES.includes(value as AnimalCategory);

const isAnimalSize = (value: string): value is AnimalSize =>
  ANIMAL_SIZE_VALUES.includes(value as AnimalSize);

const isAnimalAgeCategory = (value: string): value is AnimalAgeCategory =>
  ANIMAL_AGE_CATEGORY_VALUES.includes(value as AnimalAgeCategory);

function toSearchOption<TValue extends string>(
  row: SearchOptionRow,
  isValidValue: (value: string) => value is TValue
): AnimalSearchOption<TValue> {
  if (!isValidValue(row.value)) {
    throw new Error(`Opção de busca inválida recebida: ${row.value}`);
  }

  return {
    value: row.value,
    label: row.label,
  };
}

export class SupabaseAnimalRepository implements AnimalRepository {
  async getListerContextByUserId(userId: string): Promise<{
    userId: string;
    role: UserRole | null;
    listerProfileId: string | null;
  }> {
    const { data: userRow, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (roleError || !userRow) {
      return {
        userId,
        role: null,
        listerProfileId: null,
      };
    }

    if (userRow.role !== "LISTER") {
      return {
        userId,
        role: userRow.role as UserRole,
        listerProfileId: null,
      };
    }

    const { data: listerProfile, error: listerError } = await supabase
      .from("lister_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (listerError || !listerProfile) {
      return {
        userId,
        role: "LISTER",
        listerProfileId: null,
      };
    }

    return {
      userId,
      role: "LISTER",
      listerProfileId: listerProfile.id,
    };
  }

  async createForLister(
    listerProfileId: string,
    entity: AnimalRegistrationEntity
  ): Promise<void> {
    const payload = {
      ...entity.toPersistence(),
      lister_profile_id: listerProfileId,
    };

    const { data: animal, error: insertError } = await supabase
      .from("animals")
      .insert(payload)
      .select("id")
      .single();
      
    if (insertError) throw insertError;

    const photoPayloads = entity.photoUrls.map((url, index) => ({
      animal_id: animal.id,
      photo_url: url,
      display_order: index,
    }));

    if (photoPayloads.length > 0) {
      const { error: photosError } = await supabase
        .from("animal_photos")
        .insert(photoPayloads);
        
      if (photosError) throw photosError;
    }
  }

  async getAnimalsForLister(listerProfileId: string): Promise<ListerAnimal[]> {
    const { data, error } = await supabase
      .from("animals")
      .select(`
        id,
        name,
        species,
        sex,
        size,
        birth_date,
        city,
        state,
        adoption_status,
        animal_photos (
          photo_url
        )
      `)
      .eq("lister_profile_id", listerProfileId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as ListerAnimalRow[];

    const animals = await Promise.all(rows.map(async (row) => {
      // Sort photos by display_order if it was fetched, but here we just take the first one
      const photos = row.animal_photos || [];
      const photoPath = photos.length > 0 ? photos[0].photo_url : null;
      let photoUrl: string | null = null;

      if (photoPath) {
        const storagePath = extractStoragePath(photoPath);

        const { data: urlData } = await supabase.storage
          .from(process.env.EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET || "animals")
          .createSignedUrl(storagePath, 60 * 60); // 1 hour

        if (urlData?.signedUrl) {
          photoUrl = urlData.signedUrl;
        }
      }

      return toListerAnimal({
        id: row.id,
        name: row.name,
        species: row.species,
        sex: row.sex,
        size: row.size,
        birthDate: row.birth_date,
        city: row.city,
        state: row.state,
        adoptionStatus: row.adoption_status,
        photoUrl,
      });
    }));

    return animals;
  }

  async getAnimalDetailForLister(
    listerProfileId: string,
    animalId: string,
  ): Promise<AnimalDetail | null> {
    const { data, error } = await supabase
      .from("animals")
      .select(
        `
        id,
        name,
        species,
        sex,
        size,
        birth_date,
        latitude,
        longitude,
        city,
        state,
        country,
        health_notes,
        behavior_notes,
        interesting_facts,
        is_neutered,
        is_vaccinated,
        adoption_status,
        animal_photos (
          photo_url
        )
      `,
      )
      .eq("id", animalId)
      .eq("lister_profile_id", listerProfileId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as unknown as {
      id: string;
      name: string;
      species: string;
      sex: string;
      size: string;
      birth_date: string;
      latitude: number;
      longitude: number;
      city: string;
      state: string;
      country: string;
      health_notes: string | null;
      behavior_notes: string | null;
      interesting_facts: string | null;
      is_neutered: boolean;
      is_vaccinated: boolean;
      adoption_status: string;
      animal_photos: AnimalPhotoRow[] | null;
    };

    const photoRows = (row.animal_photos ?? [])
      .map((photo) => photo.photo_url)
      .filter((path): path is string => Boolean(path));

    const existingPhotos: ExistingAnimalPhoto[] = await Promise.all(
      photoRows.map(async (photoUrl) => {
        const storagePath = extractStoragePath(photoUrl);
        const { data: urlData } = await supabase.storage
          .from(process.env.EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET || "animals")
          .createSignedUrl(storagePath, 60 * 60);
        return { storagePath, signedUrl: urlData?.signedUrl ?? photoUrl };
      }),
    );

    return {
      id: row.id,
      name: row.name,
      species: row.species,
      sex: row.sex,
      size: row.size,
      birthDate: row.birth_date,
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city,
      state: row.state,
      country: row.country,
      healthNotes: row.health_notes,
      behaviorNotes: row.behavior_notes,
      interestingFacts: row.interesting_facts,
      isNeutered: row.is_neutered,
      isVaccinated: row.is_vaccinated,
      adoptionStatus: row.adoption_status,
      existingPhotos,
    };
  }

  async updateForLister(
    listerProfileId: string,
    animalId: string,
    entity: AnimalRegistrationEntity,
  ): Promise<void> {
    const { error } = await supabase
      .from("animals")
      .update(entity.toPersistence())
      .eq("id", animalId)
      .eq("lister_profile_id", listerProfileId);

    if (error) throw error;
  }

  async replaceAnimalPhotos(
    animalId: string,
    storagePaths: string[],
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from("animal_photos")
      .delete()
      .eq("animal_id", animalId);

    if (deleteError) throw deleteError;

    if (storagePaths.length === 0) return;

    const photoPayloads = storagePaths.map((path, index) => ({
      animal_id: animalId,
      photo_url: path,
      display_order: index,
    }));

    const { error: insertError } = await supabase
      .from("animal_photos")
      .insert(photoPayloads);

    if (insertError) throw insertError;
  }

  async hasAnimalsForLister(listerProfileId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .eq("lister_profile_id", listerProfileId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async getNearbyAnimals(
    lat: number,
    lng: number,
    radiusKm: number,
    filters?: AnimalSearchFilters
  ): Promise<AdopterAnimal[]> {
    const { data, error } = await supabase.rpc("get_nearby_animals", {
      user_lat: lat,
      user_lon: lng,
      radius_km: radiusKm,
      species_filter: filters?.categories.length ? filters.categories : null,
      size_filter: filters?.sizes.length ? filters.sizes : null,
      age_category_filter: filters?.ageCategories.length ? filters.ageCategories : null,
    });

    if (error) throw mapSupabasePetSearchError(error);

    const animals = await Promise.all(
      ((data ?? []) as NearbyAnimalRow[]).map(async (row) => {
        let photoUrl = null;

        if (row.photo_url) {
          const storagePath = extractStoragePath(row.photo_url);

          const { data: urlData } = await supabase.storage
            .from(process.env.EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET || "animals")
            .createSignedUrl(storagePath, 60 * 60); // 1 hour

          if (urlData?.signedUrl) {
            photoUrl = urlData.signedUrl;
          }
        }

        return {
          id: row.id,
          name: row.name,
          species: row.species,
          sex: row.sex,
          size: row.size,
          birthDate: row.birth_date,
          city: row.city,
          state: row.state,
          distanceKm: row.distance_km,
          photoUrl,
          healthNotes: row.health_notes ?? null,
          behaviorNotes: row.behavior_notes ?? null,
          interestingFacts: row.interesting_facts ?? null,
          isVaccinated: row.is_vaccinated ?? null,
          isNeutered: row.is_neutered ?? null,
        };
      })
    );

    return animals;
  }

  async getSearchOptions(): Promise<AnimalSearchOptions> {
    const { data, error } = await supabase.rpc("get_animal_search_options");

    if (error) throw mapSupabasePetSearchError(error);

    const rows = ((data ?? []) as SearchOptionRow[]).sort(
      (current, next) => current.display_order - next.display_order
    );

    return {
      categories: rows
        .filter((row) => row.option_group === "CATEGORY")
        .map((row) => toSearchOption(row, isAnimalCategory)),
      sizes: rows
        .filter((row) => row.option_group === "SIZE")
        .map((row) => toSearchOption(row, isAnimalSize)),
      ageCategories: rows
        .filter((row) => row.option_group === "AGE")
        .map((row) => toSearchOption(row, isAnimalAgeCategory)),
    };
  }

  async getOrCreateActiveAdoption(
    animalId: string,
    adopterProfileId: string
  ): Promise<Adoption> {
    const { data, error } = await supabase
      .from("adoptions")
      .insert({
        animal_id: animalId,
        adopter_profile_id: adopterProfileId,
        status: "IN_PROGRESS",
      })
      .select("id, animal_id, adopter_profile_id, status, created_at")
      .single();

    if (!error && data) {
      return toAdoption(data as AdoptionRow);
    }

    if (error?.code !== "23505") {
      throw error;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("adoptions")
      .select("id, animal_id, adopter_profile_id, status, created_at")
      .eq("animal_id", animalId)
      .eq("adopter_profile_id", adopterProfileId)
      .not("status", "in", "(ADOPTED,CANCELED,REJECTED)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) throw error;

    return toAdoption(existing as AdoptionRow);
  }

  async getAdoptionByIdForLister(
    listerProfileId: string,
    adoptionId: string,
  ): Promise<Adoption | null> {
    const { data, error } = await supabase
      .from("adoptions")
      .select(
        `
        id,
        animal_id,
        adopter_profile_id,
        status,
        created_at,
        animals:animal_id (
          lister_profile_id
        )
      `,
      )
      .eq("id", adoptionId)
      .maybeSingle();

    if (error) throw mapSupabaseUpdateAdoptionStatusError(error);
    if (!data) return null;

    type AdoptionWithAnimal = AdoptionRow & {
      animals: { lister_profile_id: string } | null;
    };

    const row = data as unknown as AdoptionWithAnimal;
    if (row.animals?.lister_profile_id !== listerProfileId) {
      return null;
    }

    return toAdoption(row);
  }

  async updateAdoptionStatusForLister(
    listerProfileId: string,
    adoptionId: string,
    status: AdoptionStatus,
    cancelReason: string | null,
    visitDate: string | null,
  ): Promise<Adoption> {
    const existing = await this.getAdoptionByIdForLister(
      listerProfileId,
      adoptionId,
    );
    if (!existing) {
      throw mapSupabaseUpdateAdoptionStatusError({ code: "PGRST116" });
    }

    const updatePayload: {
      status: AdoptionStatus;
      cancel_reason?: string;
      visit_scheduled_for?: string;
      visited_at?: string;
    } = { status };
    if (cancelReason !== null) {
      updatePayload.cancel_reason = cancelReason;
    }
    if (visitDate !== null) {
      if (status === "VISIT_PENDING") {
        updatePayload.visit_scheduled_for = visitDate;
      } else if (status === "VISITED") {
        updatePayload.visited_at = visitDate;
      }
    }

    const { data, error } = await supabase
      .from("adoptions")
      .update(updatePayload)
      .eq("id", adoptionId)
      .select("id, animal_id, adopter_profile_id, status, created_at")
      .single();

    if (error) throw mapSupabaseUpdateAdoptionStatusError(error);
    if (!data) {
      throw mapSupabaseUpdateAdoptionStatusError({ message: "No row returned" });
    }

    return toAdoption(data as AdoptionRow);
  }
}
