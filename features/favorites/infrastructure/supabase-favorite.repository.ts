import { supabase } from "@/lib/supabase";
import { extractStoragePath } from "@/features/pets/utils/extract-storage-path";
import type { FavoriteRepository } from "../domain/repositories/favorite.repository";
import type { FavoriteAnimal } from "../domain/entities/favorite-animal.entity";

type FavoriteRow = {
  animal_id: string;
  created_at: string;
};

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  city: string | null;
  state: string | null;
};

type PhotoRow = {
  animal_id: string;
  photo_url: string;
};

export class SupabaseFavoriteRepository implements FavoriteRepository {
  async toggle(
    adopterProfileId: string,
    animalId: string,
  ): Promise<boolean> {
    const { data: existing, error: selectError } = await supabase
      .from("favorites")
      .select("id")
      .eq("adopter_profile_id", adopterProfileId)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        throw deleteError;
      }

      return false;
    }

    const { error: insertError } = await supabase
      .from("favorites")
      .insert({
        adopter_profile_id: adopterProfileId,
        animal_id: animalId,
      });

    if (insertError) {
      throw insertError;
    }

    return true;
  }

  async isFavorited(
    adopterProfileId: string,
    animalId: string,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("adopter_profile_id", adopterProfileId)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return !!data;
  }

  async getAll(adopterProfileId: string): Promise<FavoriteAnimal[]> {
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("animal_id, created_at")
      .eq("adopter_profile_id", adopterProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    const animalIds = favorites.map((row: FavoriteRow) => row.animal_id);

    const { data: animals, error: animalsError } = await supabase
      .from("animals")
      .select("id, name, species, city, state")
      .in("id", animalIds);

    if (animalsError) {
      throw animalsError;
    }

    const animalMap = new Map<string, AnimalRow>();
    if (animals) {
      for (const animal of animals) {
        animalMap.set(animal.id, animal);
      }
    }

    const { data: photos, error: photosError } = await supabase
      .from("animal_photos")
      .select("animal_id, photo_url")
      .in("animal_id", animalIds)
      .order("display_order", { ascending: true });

    if (photosError) {
      throw photosError;
    }

    const bucket = process.env.EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET || "animals";

    const photoMap = new Map<string, string>();
    if (photos && photos.length > 0) {
      const signedUrls = await Promise.all(
        photos.map(async (photo) => {
          const storagePath = extractStoragePath(photo.photo_url);
          const { data: urlData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(storagePath, 60 * 60);
          return {
            animalId: photo.animal_id,
            signedUrl: urlData?.signedUrl ?? photo.photo_url,
          };
        }),
      );

      for (const { animalId, signedUrl } of signedUrls) {
        if (!photoMap.has(animalId)) {
          photoMap.set(animalId, signedUrl);
        }
      }
    }

    return favorites.map((row: FavoriteRow): FavoriteAnimal => {
      const animal = animalMap.get(row.animal_id);
      return {
        animalId: row.animal_id,
        name: animal?.name ?? "",
        species: animal?.species ?? "",
        photoUrl: photoMap.get(row.animal_id) ?? null,
        city: animal?.city ?? null,
        state: animal?.state ?? null,
        favoritedAt: row.created_at,
      };
    });
  }
}
