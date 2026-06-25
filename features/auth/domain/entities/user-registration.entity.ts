import type { UserRole } from "@/features/pets/domain/entities/current-user.entity";
import type { SignupFormData } from "../../schemas/signup.schema";

export type { UserRole };
export type ListerType = "INDIVIDUAL" | "SHELTER";

export class UserRegistrationEntity {
  private constructor(private readonly data: SignupFormData) {}

  static create(data: SignupFormData): UserRegistrationEntity {
    // Validações de domínio
    return new UserRegistrationEntity(data);
  }

  get email() {
    return this.data.email;
  }

  get password() {
    return this.data.password;
  }

  get role(): UserRole {
    return this.data.role === "adotante" ? "ADOPTER" : "LISTER";
  }

  get isAdopter(): boolean {
    return this.role === "ADOPTER";
  }

  get isLister(): boolean {
    return this.role === "LISTER";
  }

  get isIndividual(): boolean {
    return this.data.role === "doador";
  }

  get isShelter(): boolean {
    return this.data.role === "abrigo";
  }

  toAuthMetadata(): Record<string, string> {
    if (this.isAdopter) {
      return {
        role: this.role,
        name: this.data.name ?? "",
      };
    }

    const listerType: ListerType = this.isIndividual ? "INDIVIDUAL" : "SHELTER";

    return {
      role: this.role,
      lister_type: listerType,
      name: this.isIndividual ? (this.data.name ?? "") : "",
      trade_name: this.isShelter ? (this.data.tradeName ?? "") : "",
      corporate_name: this.isShelter ? (this.data.corporateName ?? "") : "",
      cnpj: this.isShelter ? (this.data.cnpj ?? "") : "",
    };
  }
}
