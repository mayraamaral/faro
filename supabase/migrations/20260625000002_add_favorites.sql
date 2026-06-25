-- 1. CREATE TABLE
CREATE TABLE public.favorites (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adopter_profile_id  UUID NOT NULL REFERENCES public.adopter_profiles(id) ON DELETE CASCADE,
  animal_id           UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_favorites_adopter_animal UNIQUE (adopter_profile_id, animal_id)
);

-- 2. CREATE INDEX
CREATE INDEX idx_favorites_adopter_profile_id
  ON public.favorites (adopter_profile_id, created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICY
CREATE POLICY "Adopters can view their own favorites"
  ON public.favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adopter_profiles ap
      WHERE ap.id = adopter_profile_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Adopters can insert their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.adopter_profiles ap
      WHERE ap.id = adopter_profile_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Adopters can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.adopter_profiles ap
      WHERE ap.id = adopter_profile_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );
