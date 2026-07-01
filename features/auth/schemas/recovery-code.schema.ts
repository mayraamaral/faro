import { z } from "zod";

export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe o código de 6 dígitos"),
});

export type RecoveryCodeFormData = z.infer<typeof recoveryCodeSchema>;
