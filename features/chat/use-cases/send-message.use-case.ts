import { MessageEntity } from "../domain/entities/message.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";
import type { SendMessageFormData } from "../schemas/send-message.schema";

export type SendMessageParams = SendMessageFormData & {
  conversationId: string;
  senderType: "ADOPTER" | "LISTER";
  userId: string;
  adopterProfileId: string | null;
  listerProfileId: string | null;
};

export class SendMessageUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(params: SendMessageParams) {
    const entity = MessageEntity.create({
      content: params.content,
      conversationId: params.conversationId,
      senderType: params.senderType,
      userId: params.userId,
      adopterProfileId: params.adopterProfileId,
      listerProfileId: params.listerProfileId,
    });

    return this.chatRepository.sendMessage(entity.toNew());
  }
}
