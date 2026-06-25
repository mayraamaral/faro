import type { Message } from "../domain/entities/message.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";

export class GetMessagesUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(conversationId: string): Promise<Message[]> {
    if (!conversationId) {
      throw new Error("Conversation id is required.");
    }

    return this.chatRepository.getMessages(conversationId);
  }
}
