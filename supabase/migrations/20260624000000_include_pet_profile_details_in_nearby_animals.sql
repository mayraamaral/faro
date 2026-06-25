DROP FUNCTION IF EXISTS get_nearby_animals(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION
);

CREATE OR REPLACE FUNCTION get_nearby_animals(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  species public.animal_species,
  sex public.animal_sex,
  size public.animal_size,
  birth_date DATE,
  city TEXT,
  state TEXT,
  distance_km DOUBLE PRECISION,
  photo_url TEXT,
  health_notes TEXT,
  behavior_notes TEXT,
  interesting_facts TEXT,
  is_vaccinated BOOLEAN,
  is_neutered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT
      a.id,
      a.name,
      a.species,
      a.sex,
      a.size,
      a.birth_date,
      a.city,
      a.state,
      (
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(a.latitude)) *
          cos(radians(a.longitude) - radians(user_lon)) +
          sin(radians(user_lat)) * sin(radians(a.latitude))
        )
      ) AS distance_km,
      (
        SELECT ap.photo_url
        FROM public.animal_photos ap
        WHERE ap.animal_id = a.id
        ORDER BY ap.display_order ASC
        LIMIT 1
      ) AS photo_url,
      a.health_notes,
      a.behavior_notes,
      a.interesting_facts,
      a.is_vaccinated,
      a.is_neutered
    FROM
      public.animals a
    WHERE
      a.is_available = true
      AND a.deleted_at IS NULL
  ) AS nearby_animals
  WHERE
    nearby_animals.distance_km <= radius_km
  ORDER BY
    nearby_animals.distance_km ASC;
END;
$$;
