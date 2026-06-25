DROP FUNCTION IF EXISTS get_nearby_animals(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION
);

CREATE OR REPLACE FUNCTION get_nearby_animals(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  species_filter public.animal_species[] DEFAULT NULL,
  size_filter public.animal_size[] DEFAULT NULL,
  age_category_filter TEXT[] DEFAULT NULL
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
SET search_path = public, pg_temp
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
          least(1, greatest(-1,
            cos(radians(user_lat)) * cos(radians(a.latitude)) *
            cos(radians(a.longitude) - radians(user_lon)) +
            sin(radians(user_lat)) * sin(radians(a.latitude))
          ))
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
      AND (
        species_filter IS NULL
        OR cardinality(species_filter) = 0
        OR a.species = ANY(species_filter)
      )
      AND (
        size_filter IS NULL
        OR cardinality(size_filter) = 0
        OR a.size = ANY(size_filter)
      )
      AND (
        age_category_filter IS NULL
        OR cardinality(age_category_filter) = 0
        OR (
          'BABY' = ANY(age_category_filter)
          AND a.birth_date > CURRENT_DATE - INTERVAL '1 year'
        )
        OR (
          'ADULT' = ANY(age_category_filter)
          AND a.birth_date <= CURRENT_DATE - INTERVAL '1 year'
          AND a.birth_date > CURRENT_DATE - INTERVAL '7 years'
        )
        OR (
          'SENIOR' = ANY(age_category_filter)
          AND a.birth_date <= CURRENT_DATE - INTERVAL '7 years'
        )
      )
  ) AS nearby_animals
  WHERE
    nearby_animals.distance_km <= radius_km
  ORDER BY
    nearby_animals.distance_km ASC;
END;
$$;

CREATE OR REPLACE FUNCTION get_animal_search_options()
RETURNS TABLE (
  option_group TEXT,
  value TEXT,
  label TEXT,
  display_order INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM (
    VALUES
      ('CATEGORY', 'DOG', 'Cachorro', 1),
      ('CATEGORY', 'CAT', 'Gato', 2),
      ('CATEGORY', 'BIRD', 'Pássaro', 3),
      ('CATEGORY', 'RABBIT', 'Coelho', 4),
      ('CATEGORY', 'OTHER', 'Outro', 5),
      ('SIZE', 'SMALL', 'Pequeno', 1),
      ('SIZE', 'MEDIUM', 'Médio', 2),
      ('SIZE', 'LARGE', 'Grande', 3),
      ('AGE', 'BABY', 'Até 1 ano', 1),
      ('AGE', 'ADULT', '1 a 7 anos', 2),
      ('AGE', 'SENIOR', '7+ anos', 3)
  ) AS t(option_group, value, label, display_order)
  ORDER BY t.option_group, t.display_order;
$$;

REVOKE EXECUTE ON FUNCTION get_nearby_animals(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  public.animal_species[],
  public.animal_size[],
  TEXT[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_nearby_animals(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  public.animal_species[],
  public.animal_size[],
  TEXT[]
) TO authenticated;

REVOKE EXECUTE ON FUNCTION get_animal_search_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_animal_search_options() TO authenticated;
