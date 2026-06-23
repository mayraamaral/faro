# AGENTS.md

> Context file for AI agents and contributors. Keep this up to date as the project evolves.

## Project Overview

**Faro** is a React Native mobile app that connects animals available for adoption with people who want to adopt them. It targets iOS and Android (with a static web build) and is built with Expo.

- **Package manager**: pnpm
- **Runtime**: Expo ~54 / React Native 0.81 / React 19
- **New Architecture**: enabled (`newArchEnabled: true`, React Compiler enabled)
- **Routing**: Expo Router v6 (file-based, typed routes)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Language**: TypeScript (strict mode)

---

## Repository Layout

```
faro/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout (AuthProvider, fonts, splash)
│   ├── index.tsx               # Entry redirect (auth gate)
│   ├── (auth)/                 # Unauthenticated route group
│   │   ├── home.tsx            # Marketing / landing screen
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── confirm-email.tsx
│   └── (app)/                  # Authenticated route group
│       ├── index.tsx           # Adopter home (find pets)
│       ├── find-pet.tsx
│       ├── lister-home.tsx
│       └── add-animal.tsx
├── features/                   # Feature modules (Clean Architecture slices)
│   ├── auth/
│   └── pets/
├── components/                 # Shared UI primitives
│   └── ui/                     # Design-system components (Button, Card, etc.)
├── constants/
│   ├── tokens.ts               # Design tokens (colors, spacing, radius, font sizes)
│   └── theme.ts                # Theme derivations
├── hooks/                      # Shared cross-feature hooks
├── lib/
│   └── supabase.ts             # Supabase client singleton
├── supabase/
│   └── migrations/             # SQL migration files (date-prefixed)
├── docs/
│   └── plans/                  # Implementation plans (*.plan.md)
├── assets/                     # Images, fonts, icons
└── .env / .env.example         # Environment variables
```

---

## Feature Module Structure

Every feature under `features/` follows this layer layout. **Do not deviate.**

```
features/{feature}/
├── domain/
│   ├── entities/       # Business objects — classes with static `create()` factory
│   ├── repositories/   # TypeScript interfaces only — no implementation here
│   └── errors/         # Domain-specific error classes with typed error codes
├── infrastructure/
│   ├── supabase-*.repository.ts   # Concrete Supabase implementations of domain interfaces
│   └── supabase-error-mapper.ts   # Maps Supabase errors → domain errors
├── use-cases/
│   └── *.use-case.ts   # Application layer: receives raw form data, calls domain + repositories
├── hooks/
│   └── use-*.ts        # React hooks: instantiate use cases, manage loading/error state for UI
├── schemas/
│   └── *.schema.ts     # Zod schemas — source of truth for form shape and validation
├── components/         # Feature-scoped UI components
├── context/            # React contexts scoped to this feature
└── utils/              # Pure helpers scoped to this feature
```

### Layer rules

| Layer | Allowed imports | Forbidden |
|---|---|---|
| `domain` | Nothing external — pure TS | Supabase, React, infra |
| `infrastructure` | `domain`, `lib/supabase` | React, hooks |
| `use-cases` | `domain`, schemas | Supabase directly, React |
| `hooks` | `use-cases`, `infrastructure`, `context` | Direct Supabase calls |
| `components` | `hooks`, `schemas`, `domain` types | `infrastructure` directly |

---

## Key Conventions

### Entities

- Always a `class` with a **private constructor** and a **static `create()` factory**.
- Validation / invariant enforcement happens inside `create()`.
- Expose data through **getters**, never raw fields.
- Include a `toPersistence()` method when the entity is persisted.

```ts
export class UserCredentialsEntity {
  private constructor(private readonly data: LoginFormData) {}

  static create(data: LoginFormData): UserCredentialsEntity {
    return new UserCredentialsEntity(data);
  }

  get email() { return this.data.email.trim().toLowerCase(); }
  get password() { return this.data.password; }
}
```

### Repositories

- Domain layer defines an **interface** (`auth.repository.ts`).
- Infrastructure layer provides a **concrete class** (`supabase-auth.repository.ts`) that `implements` the interface.
- Hooks instantiate the concrete class at **module level** (outside the hook function body), not inside.

```ts
// hooks/use-login.ts
const authRepository = new SupabaseAuthRepository();  // module-level singleton
const loginUseCase = new LoginUseCase(authRepository);

export function useLogin() { ... }
```

### Use Cases

- Single `execute()` method.
- Accepts raw form data (from Zod schema type), constructs entities internally.
- No React imports — pure async logic.
- Throws domain errors; never catches and swallows.

### Error Handling

- Domain errors extend a base error class and carry a **typed error code** (string union).
- Hooks map error codes to human-readable UI messages using a `Record<ErrorCode, string>` map.
- **Never use empty catch blocks.** Always handle or rethrow.

### Zod Schemas

- Live in `features/{feature}/schemas/`.
- Exported as both the schema (`loginSchema`) and the inferred type (`LoginFormData`).
- Used as the single source of truth for form shape — `react-hook-form` resolver points here.

### TypeScript

- Strict mode is on. **No `as any`, no `@ts-ignore`, no `@ts-expect-error`.**
- Path alias `@/*` resolves to project root (e.g., `import { supabase } from "@/lib/supabase"`).
- Enums are plain TypeScript string unions or Zod enums — **not** TypeScript `enum` keyword.

---

## Database & Supabase

### Migration Conventions

- Files live in `supabase/migrations/`.
- Naming: `YYYYMMDD000000_description.sql` (date + sequential suffix + snake_case description).
- Structure order in each file:
  1. `CREATE TYPE … AS ENUM` (uppercase values)
  2. `CREATE TABLE`
  3. `CREATE INDEX` (named `idx_{table}_{column(s)}`)
  4. `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
  5. `CREATE POLICY` (one per role/action, descriptive quoted name)
  6. `CREATE TRIGGER` (named `set_updated_at_{table}`)

### Schema

| Table | Purpose |
|---|---|
| `public.users` | Mirrors `auth.users`; stores `user_role` (`ADOPTER` \| `LISTER`) |
| `public.adopter_profiles` | Profile for adopter users (1:1 with `users`) |
| `public.lister_profiles` | Profile for lister users — individual donors or shelters (1:1 with `users`) |
| `public.animals` | Pet listings owned by a `lister_profile` |
| `public.animal_photos` | Photos linked to an animal (ordered by `display_order`) |
| `public.adoptions` | *(planned)* Adoption process records linking animals and adopters |

### RLS Patterns

- One permissive policy per role/action to avoid "multiple permissive policies" lint warnings.
- Lister ownership is always resolved by joining `animals.lister_profile_id` → `lister_profiles.user_id = auth.uid()`.
- Public catalog reads filter by `animals.is_available = true` (not directly on `adoptions`).

### Supabase Client

- Singleton in `lib/supabase.ts`. Import as `import { supabase } from "@/lib/supabase"`.
- Session is persisted via `AsyncStorage` on native, disabled on web.

---

## User Roles

| Role | DB value | Profile table | Description |
|---|---|---|---|
| Adopter | `ADOPTER` | `adopter_profiles` | Looking for a pet to adopt |
| Individual donor | `LISTER` + `lister_type = INDIVIDUAL` | `lister_profiles` | Private person listing a pet |
| Shelter | `LISTER` + `lister_type = SHELTER` | `lister_profiles` | Organized shelter with `trade_name` / `cnpj` |

---

## Design System

### Tokens (`constants/tokens.ts`)

- **Colors**: `tokens.colors.brand.primary` (`#0952A6` blue), `tokens.colors.brand.secondary` (`#EF8422` orange).
- **Spacing**: T-shirt scale — `tokens.spacing[4]` = 16px.
- **Radius**: `tokens.radius.md` = 8, `tokens.radius.full` = 9999.
- **Typography**: `tokens.fontSize.*` and `tokens.lineHeight.*`.

### Fonts

| Key | Font | Use |
|---|---|---|
| `appFonts.primary` | Quicksand Regular | Body text |
| `appFonts.primaryBold` | Quicksand Bold | Headings, labels |
| `appFonts.secondary` | Walter Turncoat | Logo accent |

### Shared components

- `components/ui/button/` — primary/secondary button variants.
- `components/ui/card/` — card container.
- `components/themed-text.tsx`, `components/themed-view.tsx` — theme-aware primitives.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<anon-key>
EXPO_PUBLIC_SUPABASE_ANIMALS_BUCKET=animals
```

All variables must be prefixed `EXPO_PUBLIC_` to be accessible in the app bundle.

---

## Development Commands

| Command | Description |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm start` | Start Expo dev server (scan QR with Expo Go) |
| `pnpm android` | Run on Android emulator/device |
| `pnpm ios` | Run on iOS simulator (macOS only) |
| `pnpm web` | Run in browser |
| `pnpm storybook` | Start Expo with Storybook enabled |
| `pnpm lint` | Run ESLint |

> **Dev environment**: Linux (Ubuntu 24). App is tested on iPhone via Expo Go on the same Wi-Fi network.

---

## Plans

Implementation plans live in `docs/plans/`. Each plan is a Markdown file with YAML frontmatter (`name`, `overview`, `todos`, `isProject`). Plans use the naming convention `{slug}_{hash}.plan.md`.

---

## What to Avoid

- **No `as any` / `@ts-ignore` / `@ts-expect-error`** — TypeScript strict mode is enforced.
- **No direct Supabase calls from hooks or components** — always go through a use case + repository.
- **No business logic in screens** — screens call hooks only.
- **No committing `.env`** — it is gitignored.
- **No new global state libraries** — the project uses React Context intentionally.
- **No TypeScript `enum` keyword** — use string unions or `as const` objects.
- **Never suppress errors in empty catch blocks** — handle or rethrow.
