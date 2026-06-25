import type { Conversation } from "../domain/entities/conversation.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";

export class CreateConversationUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(adoptionId: string): Promise<Conversation> {
    if (!adoptionId) {
      throw new Error("Adoption id is required.");
    }

    const existing = await this.chatRepository.getConversationByAdoptionId(adoptionId);
    if (existing) {
      return existing;
    }

    return this.chatRepository.createConversation(adoptionId);
  }
}
