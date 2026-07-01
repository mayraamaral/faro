import { PasswordResetRequestEntity } from "../domain/entities/password-reset-request.entity";
import type { AuthRepository } from "../domain/repositories/auth.repository";
import type { PasswordResetRequestFormData } from "../schemas/password-reset.schema";

export class RequestPasswordResetUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(rawData: PasswordResetRequestFormData): Promise<void> {
    const request = PasswordResetRequestEntity.create(rawData);
    await this.authRepository.requestPasswordReset(request);
  }
}
