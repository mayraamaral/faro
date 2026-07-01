import type { NewPasswordFormData } from "../../schemas/new-password.schema";

export class NewPasswordEntity {
  private constructor(private readonly data: NewPasswordFormData) {}

  static create(data: NewPasswordFormData): NewPasswordEntity {
    return new NewPasswordEntity(data);
  }

  get password(): string {
    return this.data.password;
  }
}
