import type { PasswordResetRequestFormData } from "../../schemas/password-reset.schema";

export class PasswordResetRequestEntity {
  private constructor(private readonly email: string) {}

  static create(data: PasswordResetRequestFormData): PasswordResetRequestEntity {
    return new PasswordResetRequestEntity(data.email.trim().toLowerCase());
  }

  get value(): string {
    return this.email;
  }
}
