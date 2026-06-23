---
name: Animal Table Modeling
overview: Plan to design and implement the `animals` data model in Supabase, with required geolocation for proximity search and ownership linked to `lister_profiles` (individual donors or shelters).
todos:
  - id: design-animals-schema
    content: Define animals table columns, enums, defaults, and ownership FK to lister_profiles
    status: pending
  - id: add-data-constraints
    content: Add CHECK constraints for coordinates, birth_date, and photo_url format
    status: pending
  - id: add-indexes
    content: Create indexes for owner queries, availability listing, and geolocation preparation
    status: pending
  - id: secure-with-rls
    content: Enable RLS and implement public-read and owner-write policies
    status: pending
  - id: add-updated-at-trigger
    content: Create trigger/function to maintain updated_at automatically
    status: pending
  - id: validate-migration-locally
    content: Run migration and verify create/read/update/delete behavior against RLS rules
    status: pending
  - id: prepare-next-phase-contract
    content: Document required/optional fields and query patterns for app-layer implementation
    status: pending
isProject: false
---

# Animal Table Modeling Plan

Create a production-ready `animals` table and related SQL structures in Supabase to support pet listing, adoption discovery, and future location-based matching. This plan defines required attributes, including animal type/species, optional pet profile enrichment fields, validation/indexing strategy, and RLS rules aligned with the existing architecture.

## Scope and decisions

- Location will be required as geographic coordinates (`latitude`, `longitude`) from day 1.
- Each animal will belong to one lister via `lister_profile_id` (FK to `lister_profiles.id`).
- Pet profile will include required adoption-facing basics and optional enrichment data.
- Plan focuses on schema/data model and access policy; app-level UI/use-cases come after this plan.

## Files to extend

- Add a new migration under [`/home/mayra/Documents/projects/faro/supabase/migrations`](file:///home/mayra/Documents/projects/faro/supabase/migrations) using the same style used in [`/home/mayra/Documents/projects/faro/supabase/migrations/20260419000000_entity_modeling.sql`](file:///home/mayra/Documents/projects/faro/supabase/migrations/20260419000000_entity_modeling.sql).
- Keep consistency with project planning conventions seen in [`/home/mayra/Documents/projects/faro/.cursor/plans/supabase_entity_modeling_63694da9.plan.md`](file:///home/mayra/Documents/projects/faro/.cursor/plans/supabase_entity_modeling_63694da9.plan.md).

## Proposed schema

Create `public.animals` with these fields:

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `lister_profile_id UUID NOT NULL REFERENCES public.lister_profiles(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `species` enum (`DOG`, `CAT`, `BIRD`, `RABBIT`, `OTHER`) NOT NULL
- `photo_url TEXT NOT NULL`
- `birth_date DATE NOT NULL`
- `latitude DOUBLE PRECISION NOT NULL`
- `longitude DOUBLE PRECISION NOT NULL`
- `city TEXT` (optional display convenience)
- `state TEXT` (optional display convenience)
- `country TEXT` (optional display convenience)
- `health_notes TEXT` (optional)
- `behavior_notes TEXT` (optional)
- `interesting_facts TEXT` (optional)
- `adoption_status` enum (default `AVAILABLE`)
- `is_neutered BOOLEAN` (optional)
- `is_vaccinated BOOLEAN` (optional)
- `size` enum (optional, e.g. `SMALL`, `MEDIUM`, `LARGE`)
- `sex` enum (optional, e.g. `MALE`, `FEMALE`, `UNKNOWN`)
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

### Why these extra fields

- `adoption_status`: needed to hide adopted/reserved animals without deleting history.
- `species`: enables key catalog filters (cat, dog, etc.) and category-level discovery pages.
- `sex` and `size`: common filters in pet discovery flows.
- `is_neutered`/`is_vaccinated`: high-value health filters while keeping full health details in notes.
- `city/state/country` alongside coordinates: better UX for display and fallback search text.

## Data quality and constraints

- Add `CHECK (latitude >= -90 AND latitude <= 90)`.
- Add `CHECK (longitude >= -180 AND longitude <= 180)`.
- Add `CHECK (birth_date <= CURRENT_DATE)`.
- Add URL sanity check for `photo_url` (basic `http://`/`https://` pattern).
- Add `updated_at` trigger to auto-update on row modification.

## Indexing strategy

- Index `lister_profile_id` for owner dashboards.
- Index `species` for common pet-type filters.
- Index `adoption_status` for listing queries.
- Add a composite index on `(species, adoption_status, created_at DESC)` for filtered feed loading.
- Prepare for proximity search:
  - First version: btree indexes on `latitude` and `longitude`.
  - Future upgrade path: PostGIS `geography(Point,4326)` or generated geohash column when implementing true radius queries.

## RLS and security

Enable RLS for `public.animals` and add policies:

- Public `SELECT` only for `adoption_status = 'AVAILABLE'` (or wider, per product decision later).
- Authenticated listers can `INSERT` only when the referenced `lister_profile_id` belongs to their `auth.uid()`.
- Listers can `UPDATE/DELETE` only their own animals.
- Optional admin policy (if admin role is added later).

## Query/read model to support next phase

Define target read patterns now (implementation later):

- Public catalog: available pets ordered by recency.
- Lister dashboard: my animals by status.
- Future nearby search: candidates by bounding box around adopter coordinates, then distance sort.

## Rollout plan

1. Add migration (table, enums, constraints, indexes, trigger, RLS policies).
2. Verify migration in local Supabase and confirm rollback behavior.
3. Seed a minimal sample dataset (individual + shelter animals) to validate query patterns.
4. Document contract for frontend/domain layer (required vs optional fields).
5. Move to application-layer implementation (repository/use-case/hooks/screens) in a separate plan.

## Acceptance criteria

- `animals` table created with required columns and FK to `lister_profiles`.
- Coordinates enforced and validated by DB constraints.
- RLS prevents cross-lister writes and allows intended reads.
- Basic indexes support owner and listing queries.
- Schema supports your required fields (`photo_url`, `name`, `birth_date`, location, optional health/behavior/facts) plus practical adoption filters.
- Schema supports animal-type filtering (`species`: cat, dog, etc.) for discovery.
