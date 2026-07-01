import { z } from "zod";

export const passwordResetSchema = z.object({
  email: z.email({ error: "E-mail inválido" }),
});

export type PasswordResetRequestFormData = z.infer<typeof passwordResetSchema>;
