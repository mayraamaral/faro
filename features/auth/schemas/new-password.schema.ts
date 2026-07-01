import { z } from "zod";

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });
    }
  });

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
