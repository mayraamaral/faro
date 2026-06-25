import { z } from "zod";

import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH } from "../domain/entities/message.entity";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MESSAGE_MIN_LENGTH, "Mensagem não pode estar vazia.")
    .max(MESSAGE_MAX_LENGTH, `Mensagem deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres.`),
});

export type SendMessageFormData = z.infer<typeof sendMessageSchema>;
