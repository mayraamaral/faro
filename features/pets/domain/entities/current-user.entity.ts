export type UserRole = "ADOPTER" | "LISTER";

type UserContext = {
  userId: string;
  role: UserRole | null;
  listerProfileId?: string | null;
  adopterProfileId?: string | null;
};

export class CurrentUserEntity {
  private constructor(private readonly context: UserContext) {}

  static create(context: UserContext): CurrentUserEntity {
    return new CurrentUserEntity(context);
  }

  get userId(): string {
    return this.context.userId;
  }

  get role(): UserRole | null {
    return this.context.role;
  }

  get isAdopter(): boolean {
    return this.context.role === "ADOPTER";
  }

  get isLister(): boolean {
    return this.context.role === "LISTER";
  }

  get listerProfileIdValue(): string | null {
    return this.context.listerProfileId ?? null;
  }

  get listerProfileId(): string {
    if (!this.context.listerProfileId) {
      throw new Error("Perfil de doador/abrigo não encontrado.");
    }
    return this.context.listerProfileId;
  }

  get adopterProfileIdValue(): string | null {
    return this.context.adopterProfileId ?? null;
  }

  get adopterProfileId(): string {
    if (!this.context.adopterProfileId) {
      throw new Error("Perfil de adotante não encontrado.");
    }
    return this.context.adopterProfileId;
  }

  canCreateAnimal(): boolean {
    return this.isLister && !!this.context.listerProfileId;
  }
}
