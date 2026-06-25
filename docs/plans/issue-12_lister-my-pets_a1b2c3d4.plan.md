---
status: in-progress
phase: 1
updated: 2026-06-25
---

# Implementation Plan — Issue #12 (LISTER "Meus pets")

## Goal
Build the LISTER "Meus pets" experience: a screen listing the lister's pets with age, an edit option per pet, and a "Ver interessados" option that lists adoption conversations for that pet and opens chat on tap.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| Use a new dedicated `My Pets` route (`/my-pets`) rather than expanding the existing `ListerHomeScreen` | The existing `ListerHomeScreen` is the post-auth "landing" for listers and is wired to the auth gate. Separating concerns keeps that file simple. Issue #12 is a distinct feature. | `b1`, `b2` |
| Reuse the existing add-animal form for edit by extracting a shared `AnimalFormScreen` component with `mode: "create" \| "edit"` | The form fields are identical (same Zod schema). The repository writes are different (insert vs. update + photo diff). One form, two submit handlers. Avoids duplication. | `b2` |
| Compute age client-side from `birthDate` via a pure utility | The codebase already does this implicitly in `pet-profile`; the schema doesn't store an `age` column. A pure `formatAge` util makes it testable and reusable. | `b2` |
| Extend `AnimalRepository` with `getAnimalById`, `updateForLister`, `replaceAnimalPhotos` | The domain layer must own the persistence contract. Hooks/components cannot touch Supabase. | `b1` (AGENTS.md) |
| Extend `ChatRepository` with `getConversationsForAnimal(animalId, viewer)` | The embed already returns `animals.id`. We just need to add an `animalId` filter to the existing query. The existing `viewer.isLister` filter naturally scopes to the lister's own animals. | `b2` |
| New routes: `/my-pets`, `/my-pets/edit/[animal_id]`, `/my-pets/[animal_id]/interested` | Three distinct screens with distinct params. The `chat/[conversation_id]` route already exists for opening chat. | `b1`, `b2` |
| The edit form pre-fills values from a `useAnimalDetail` hook that resolves the lister's `listerProfileId` and fetches the animal | Reuses the same auth + repository flow as `use-lister-home`. | `b2` |
| For edit, photo handling: any new URIs get uploaded; ALL existing photos get replaced with the new set (delete + insert) | Simpler than diffing. The `animal_photos` rows have no other FK. Keeps the form simple. | `b2` |

## Phase 1: Domain & utilities [IN PROGRESS]
- [x] 1.1 Explore existing patterns (lister-home, chat, animal repo, AGENTS.md)
- [x] 1.2 Read create-animal screen, schema, entity, repository, use case, hook
- [x] 1.3 Read chat repository, use-cases, list screen, identity hook
- [x] 1.4 Read migrations to confirm columns & RLS
- [ ] **1.5 Create `features/pets/utils/format-age.ts` (pure utility)** ← CURRENT
- [ ] 1.6 Add `age` to `ListerAnimal` entity (derived in mapper)
- [ ] 1.7 Extend `AnimalRepository` interface: `getAnimalById`, `updateForLister`, `replaceAnimalPhotos`
- [ ] 1.8 Implement those methods in `SupabaseAnimalRepository`
- [ ] 1.9 Extend `ChatRepository` interface: `getConversationsForAnimal`
- [ ] 1.10 Implement it in `SupabaseChatRepository`
- [ ] 1.11 Create use-cases: `GetAnimalByIdUseCase`, `UpdateAnimalUseCase`, `GetConversationsForAnimalUseCase`

## Phase 2: Hooks & shared form [PENDING]
- [ ] 2.1 Create `use-animal-detail.ts` (loads single animal by id for edit prefill)
- [ ] 2.2 Create `use-update-animal.ts` (handles update + photo replacement + rollback on error)
- [ ] 2.3 Create `use-conversations-for-animal.ts` (mirrors `use-my-conversations`)
- [ ] 2.4 Extract `AnimalFormScreen` from `AddAnimalScreen` (add + edit modes)
- [ ] 2.5 Update `AddAnimalScreen` to be a thin wrapper around `AnimalFormScreen` in `create` mode
- [ ] 2.6 Update `useCreateAnimal` to keep behavior (no change, it stays the public hook for create)

## Phase 3: New screens & routes [PENDING]
- [ ] 3.1 Create `features/pets/components/my-pets-screen.tsx` (FlatList of cards with age, "Editar", "Ver interessados" buttons)
- [ ] 3.2 Create `features/chat/components/conversations-for-animal-screen.tsx`
- [ ] 3.3 Create `features/pets/components/edit-animal-screen.tsx` (wraps `AnimalFormScreen` in `edit` mode)
- [ ] 3.4 Create route files: `app/(app)/my-pets.tsx`, `app/(app)/my-pets/edit/[animal_id].tsx`, `app/(app)/my-pets/[animal_id]/interested.tsx`
- [ ] 3.5 Register new routes in `app/(app)/_layout.tsx`
- [ ] 3.6 Update `ListerHomeScreen` to add a "Ver todos os meus pets" link or repurpose it as the My Pets screen entry — simplest: the "Meus pets" button on lister-home navigates to `/my-pets`

## Phase 4: Verification [PENDING]
- [ ] 4.1 `pnpm lint` passes
- [ ] 4.2 `lsp_diagnostics` clean on all changed files
- [ ] 4.3 TypeScript strict mode (no `as any`, no `@ts-ignore`)
- [ ] 4.4 Visual smoke: card shows name + age; "Editar" loads prefill; "Ver interessados" lists conversations; tapping row opens chat

## Notes
- 2026-06-25: Issue #12 is `front-end` label only. No DB migrations are required because (a) age is derived, (b) we already have `animals` + `animal_photos` tables that support update/delete/insert via RLS, (c) `getConversationsForAnimal` filters the existing query.
- 2026-06-25: The "Ver interessados" data already exists in `adoption_conversations` joined with `adoptions` → `animals`. We just need to add a `animal_id` filter.
