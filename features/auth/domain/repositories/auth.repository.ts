import { UserRegistrationEntity } from "../entities/user-registration.entity";
import { UserCredentialsEntity } from "../entities/user-credentials.entity";
import { PasswordResetRequestEntity } from "../entities/password-reset-request.entity";
import { NewPasswordEntity } from "../entities/new-password.entity";

export interface AuthRepository {
  signUp(entity: UserRegistrationEntity): Promise<{ id: string }>;
  login(entity: UserCredentialsEntity): Promise<void>;
  confirmEmail(email: string, code: string): Promise<void>;
  resendConfirmationEmail(email: string): Promise<void>;
  requestPasswordReset(entity: PasswordResetRequestEntity): Promise<void>;
  resendRecoveryCode(email: string): Promise<void>;
  verifyRecoveryCode(email: string, code: string): Promise<void>;
  updatePassword(entity: NewPasswordEntity): Promise<void>;
  logout(): Promise<void>;
}
