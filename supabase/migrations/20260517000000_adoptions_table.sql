-- 1. CREATE TYPE
CREATE TYPE public.adoption_process_status AS ENUM (
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'VISIT_PENDING',
  'VISITED',
  'IN_ADAPTATION',
  'ADOPTED',
  'CANCELED',
  'REJECTED'
);

-- 2. ALTER public.animals
ALTER TABLE public.animals ADD COLUMN is_available BOOLEAN;

UPDATE public.animals
SET is_available = (adoption_status = 'AVAILABLE');

ALTER TABLE public.animals
  ALTER COLUMN is_available SET DEFAULT true,
  ALTER COLUMN is_available SET NOT NULL;

ALTER TABLE public.animals ADD COLUMN deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.animals.adoption_status
  IS 'Soft-deprecated. Use is_available for availability filtering. Kept for backwards compatibility.';

-- 3. CREATE TABLE public.adoptions
CREATE TABLE public.adoptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  adopter_profile_id UUID REFERENCES public.adopter_profiles(id) ON DELETE SET NULL,
  status public.adoption_process_status NOT NULL DEFAULT 'IN_PROGRESS',
  adoption_date TIMESTAMPTZ,
  cancel_reason TEXT,
  notes TEXT,
  decision_notes TEXT,
  visit_scheduled_for TIMESTAMPTZ,
  visited_at TIMESTAMPTZ,
  adaptation_started_at TIMESTAMPTZ,
  adaptation_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CHECK constraints
ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_adopted_requires_date
  CHECK (status <> 'ADOPTED' OR adoption_date IS NOT NULL);

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_adopted_requires_adopter
  CHECK (status <> 'ADOPTED' OR adopter_profile_id IS NOT NULL);

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_terminal_requires_reason
  CHECK (
    status NOT IN ('CANCELED', 'REJECTED')
    OR length(trim(coalesce(cancel_reason, ''))) > 0
  );

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_adaptation_dates_ordered
  CHECK (
    adaptation_started_at IS NULL
    OR adaptation_ended_at IS NULL
    OR adaptation_ended_at >= adaptation_started_at
  );

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_in_progress_requires_adopter
  CHECK (status <> 'IN_PROGRESS' OR adopter_profile_id IS NOT NULL);

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_visit_pending_requires_scheduled
  CHECK (status <> 'VISIT_PENDING' OR visit_scheduled_for IS NOT NULL);

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_visited_requires_visited_at
  CHECK (status <> 'VISITED' OR visited_at IS NOT NULL);

ALTER TABLE public.adoptions
  ADD CONSTRAINT adoptions_in_adaptation_requires_started_at
  CHECK (status <> 'IN_ADAPTATION' OR adaptation_started_at IS NOT NULL);

-- 4. CREATE TABLE public.adoption_status_history
CREATE TABLE public.adoption_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adoption_id UUID NOT NULL REFERENCES public.adoptions(id) ON DELETE CASCADE,
  old_status public.adoption_process_status,
  new_status public.adoption_process_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- 5. CREATE INDEX
CREATE INDEX idx_adoptions_animal_id_created_at
  ON public.adoptions (animal_id, created_at DESC);

CREATE INDEX idx_adoptions_adopter_profile_id_created_at
  ON public.adoptions (adopter_profile_id, created_at DESC);

CREATE INDEX idx_adoptions_status_created_at
  ON public.adoptions (status, created_at DESC);

CREATE UNIQUE INDEX idx_adoptions_animal_id_adopted_unique
  ON public.adoptions (animal_id)
  WHERE status = 'ADOPTED';

CREATE UNIQUE INDEX idx_adoptions_animal_id_adopter_profile_id_active_unique
  ON public.adoptions (animal_id, adopter_profile_id)
  WHERE status NOT IN ('ADOPTED', 'CANCELED', 'REJECTED');

CREATE INDEX idx_adoption_status_history_adoption_id_changed_at
  ON public.adoption_status_history (adoption_id, changed_at DESC);

CREATE INDEX idx_animals_is_available_created_at
  ON public.animals (is_available, created_at DESC)
  WHERE deleted_at IS NULL;

-- 6. ALTER TABLE ENABLE RLS
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_status_history ENABLE ROW LEVEL SECURITY;

-- 8. DROP POLICY (Physical deletes are no longer permitted)
DROP POLICY IF EXISTS "Listers can delete their own animals" ON public.animals;

-- 9. DROP / CREATE POLICY on public.animals and public.animal_photos
DROP POLICY IF EXISTS "Anyone can view available animals" ON public.animals;
DROP POLICY IF EXISTS "Read available or own animals" ON public.animals;

CREATE POLICY "Read available or own animals"
  ON public.animals
  FOR SELECT
  USING (
    (is_available = true AND deleted_at IS NULL)
    OR EXISTS (
      SELECT 1
      FROM public.lister_profiles lp
      WHERE lp.id = lister_profile_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Anyone can view animal photos" ON public.animal_photos;
CREATE POLICY "Anyone can view animal photos"
  ON public.animal_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.animals a
      WHERE a.id = animal_id
        AND a.is_available = true
        AND a.deleted_at IS NULL
    )
  );

-- 10. CREATE POLICY on adoptions
CREATE POLICY "Adopters can apply for available animals"
  ON public.adoptions FOR INSERT
  WITH CHECK (
    adopter_profile_id = (
      SELECT id FROM public.adopter_profiles WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.animals
      WHERE id = animal_id
        AND is_available = true
        AND deleted_at IS NULL
    )
    AND status = 'IN_PROGRESS'
    AND adoption_date IS NULL
    AND cancel_reason IS NULL
    AND decision_notes IS NULL
    AND visit_scheduled_for IS NULL
    AND visited_at IS NULL
    AND adaptation_started_at IS NULL
    AND adaptation_ended_at IS NULL
  );

CREATE POLICY "Adopters can view their own adoption processes"
  ON public.adoptions FOR SELECT
  USING (
    adopter_profile_id = (
      SELECT id FROM public.adopter_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Listers can view adoption processes for their animals"
  ON public.adoptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.animals a
      JOIN public.lister_profiles lp ON lp.id = a.lister_profile_id
      WHERE a.id = animal_id AND lp.user_id = auth.uid()
    )
  );

CREATE POLICY "Listers can update adoption processes for their animals"
  ON public.adoptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.animals a
      JOIN public.lister_profiles lp ON lp.id = a.lister_profile_id
      WHERE a.id = animal_id AND lp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.animals a
      JOIN public.lister_profiles lp ON lp.id = a.lister_profile_id
      WHERE a.id = animal_id AND lp.user_id = auth.uid()
    )
  );

-- 11. CREATE POLICY on adoption_status_history
CREATE POLICY "Adopters can view their own adoption history"
  ON public.adoption_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adoptions ad
      JOIN public.adopter_profiles ap ON ap.id = ad.adopter_profile_id
      WHERE ad.id = adoption_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Listers can view adoption history for their animals"
  ON public.adoption_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adoptions ad
      JOIN public.animals a ON a.id = ad.animal_id
      JOIN public.lister_profiles lp ON lp.id = a.lister_profile_id
      WHERE ad.id = adoption_id AND lp.user_id = auth.uid()
    )
  );

-- 12. CREATE OR REPLACE FUNCTION get_nearby_animals
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
  photo_url TEXT
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
      ) AS photo_url
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

-- 13. REVOKE table-level UPDATE and grant column-level to protect is_available
REVOKE UPDATE ON public.animals FROM authenticated;
REVOKE UPDATE ON public.animals FROM anon;

GRANT UPDATE (
  name, species, photo_url, birth_date, latitude, longitude, 
  city, state, country, health_notes, behavior_notes, 
  interesting_facts, adoption_status, is_neutered, is_vaccinated, 
  size, sex, deleted_at, updated_at
) ON public.animals TO authenticated;

-- 14. CREATE TRIGGER set_updated_at_adoptions
CREATE TRIGGER set_updated_at_adoptions
  BEFORE UPDATE ON public.adoptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 15. CREATE FUNCTION + TRIGGER sync_adoption_effects
CREATE OR REPLACE FUNCTION public.sync_adoption_effects()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard: skip no-op status updates (UPDATE OF status fires even when value unchanged)
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Sync availability
  IF NEW.status IN ('IN_ADAPTATION', 'ADOPTED') THEN
    UPDATE public.animals SET is_available = false WHERE id = NEW.animal_id;
  ELSIF NEW.status IN ('CANCELED', 'REJECTED') THEN
    -- Only restore availability if no other blocking adoption exists for this animal
    UPDATE public.animals a
    SET is_available = true
    WHERE a.id = NEW.animal_id
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.adoptions ad
        WHERE ad.animal_id = NEW.animal_id
          AND ad.id <> NEW.id
          AND ad.status IN ('IN_ADAPTATION', 'ADOPTED')
      );
  END IF;

  -- Append history row
  INSERT INTO public.adoption_status_history
    (adoption_id, old_status, new_status, changed_by, changed_at)
  VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    auth.uid(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth;

CREATE TRIGGER sync_adoption_effects
  AFTER INSERT OR UPDATE OF status ON public.adoptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_adoption_effects();

-- 16. CREATE FUNCTION + TRIGGER sync_animal_soft_delete
CREATE OR REPLACE FUNCTION public.sync_animal_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Block undeletes: once deleted_at is set it cannot be cleared
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    RAISE EXCEPTION 'Animals cannot be undeleted once deleted_at is set';
  END IF;

  -- Soft-delete: mark unavailable when deleted_at is first set
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    NEW.is_available := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE TRIGGER sync_animal_soft_delete
  BEFORE UPDATE OF deleted_at ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.sync_animal_soft_delete();

-- 17. CREATE FUNCTION + TRIGGER validate_adoption_update
CREATE OR REPLACE FUNCTION public.validate_adoption_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent transitions from terminal statuses
  IF OLD.status IN ('ADOPTED', 'CANCELED', 'REJECTED')
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot transition from terminal adoption status %', OLD.status;
  END IF;

  -- Prevent identity field mutations after creation
  IF NEW.animal_id IS DISTINCT FROM OLD.animal_id THEN
    RAISE EXCEPTION 'adoptions.animal_id cannot be changed after creation';
  END IF;

  IF NEW.adopter_profile_id IS DISTINCT FROM OLD.adopter_profile_id THEN
    RAISE EXCEPTION 'adoptions.adopter_profile_id cannot be changed after creation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

CREATE TRIGGER validate_adoption_update
  BEFORE UPDATE ON public.adoptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_adoption_update();
