import type { User } from "@supabase/supabase-js";

export type AuthUserRole = "ADOPTER" | "LISTER" | null;
export type AuthUserListerType = "INDIVIDUAL" | "SHELTER" | null;

const ROLE_LABELS = {
  ADOPTER: "Adotante",
  LISTER_INDIVIDUAL: "Doador individual",
  LISTER_SHELTER: "Abrigo",
  LISTER_FALLBACK: "Doador",
} as const;

const LISTER_TYPE_LABELS = {
  INDIVIDUAL: "Doador individual",
  SHELTER: "Abrigo",
} as const;

const resolveRoleLabel = (
  role: AuthUserRole,
  listerType: AuthUserListerType,
): string | null => {
  if (role === "ADOPTER") return ROLE_LABELS.ADOPTER;
  if (role === "LISTER") {
    if (listerType === "INDIVIDUAL") return ROLE_LABELS.LISTER_INDIVIDUAL;
    if (listerType === "SHELTER") return ROLE_LABELS.LISTER_SHELTER;
    return ROLE_LABELS.LISTER_FALLBACK;
  }
  return null;
};

const resolveListerTypeLabel = (
  listerType: AuthUserListerType,
): string | null => {
  if (listerType === "INDIVIDUAL") return LISTER_TYPE_LABELS.INDIVIDUAL;
  if (listerType === "SHELTER") return LISTER_TYPE_LABELS.SHELTER;
  return null;
};

export class AuthUserEntity {
  private constructor(private readonly user: User | null) {}

  static fromSupabase(user: User | null): AuthUserEntity {
    return new AuthUserEntity(user);
  }

  static resolveRoleLabel(
    role: AuthUserRole,
    listerType: AuthUserListerType,
  ): string | null {
    return resolveRoleLabel(role, listerType);
  }

  static resolveListerTypeLabel(
    listerType: AuthUserListerType,
  ): string | null {
    return resolveListerTypeLabel(listerType);
  }

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  get email(): string | null {
    return this.user?.email ?? null;
  }

  get displayName(): string | null {
    const metadata = this.user?.user_metadata;
    if (metadata) {
      const fromMetadata =
        (typeof metadata.name === "string" && metadata.name.trim()) ||
        (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
        null;
      if (fromMetadata) return fromMetadata;
    }
    const email = this.user?.email;
    if (email) {
      const local = email.split("@")[0]?.trim();
      if (local) return local;
    }
    return null;
  }

  get initial(): string {
    const source =
      this.displayName ?? this.email ?? this.user?.id ?? null;
    if (!source) return "U";
    const trimmed = source.trim();
    if (trimmed.length === 0) return "U";
    return trimmed.charAt(0).toUpperCase();
  }
}
