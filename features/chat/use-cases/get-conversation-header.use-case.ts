import type { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";

import type { ChatRepository } from "../domain/repositories/chat.repository";

export class GetConversationHeaderUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(
    conversationId: string,
    viewer: CurrentUserEntity
  ): Promise<{ counterpartyName: string }> {
    if (!conversationId) {
      throw new Error("Conversation id is required.");
    }
    return this.chatRepository.getConversationHeader(conversationId, viewer);
  }
}
