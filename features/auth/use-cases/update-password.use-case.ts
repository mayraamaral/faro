import { NewPasswordEntity } from "../domain/entities/new-password.entity";
import type { AuthRepository } from "../domain/repositories/auth.repository";
import type { NewPasswordFormData } from "../schemas/new-password.schema";

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(rawData: NewPasswordFormData): Promise<void> {
    const entity = NewPasswordEntity.create(rawData);
    await this.authRepository.updatePassword(entity);
  }
}
