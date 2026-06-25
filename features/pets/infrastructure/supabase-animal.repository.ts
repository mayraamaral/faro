import { supabase } from "@/lib/supabase";
import { extractStoragePath } from "../utils/extract-storage-path";
import type { AnimalRepository } from "../domain/repositories/animal.repository";
import type { AnimalRegistrationEntity } from "../domain/entities/animal-registration.entity";
import type { UserRole } from "../domain/entities/current-user.entity";
import type { ListerAnimal } from "../domain/entities/lister-animal.entity";
import type { AdopterAnimal } from "../domain/entities/adopter-animal.entity";

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

export class SupabaseAnimalRepository implements AnimalRepository {
  async getListerContextByUserId(userId: string): Promise<{
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
        role: null,
        listerProfileId: null,
      };
    }

    if (userRow.role !== "LISTER") {
      return {
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
        role: "LISTER",
        listerProfileId: null,
      };
    }

    return {
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
      let photoUrl = null;

      if (photoPath) {
        const storagePath = extractStoragePath(photoPath);

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
        adoptionStatus: row.adoption_status,
        photoUrl,
      };
    }));

    return animals;
  }

  async hasAnimalsForLister(listerProfileId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .eq("lister_profile_id", listerProfileId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async getNearbyAnimals(lat: number, lng: number, radiusKm: number): Promise<AdopterAnimal[]> {
    const { data, error } = await supabase.rpc("get_nearby_animals", {
      user_lat: lat,
      user_lon: lng,
      radius_km: radiusKm,
    });

    if (error) throw error;

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
}
