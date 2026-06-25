import type { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";

import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";

export class GetConversationsForAnimalUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(
    animalId: string,
    viewer: CurrentUserEntity,
  ): Promise<ConversationListItem[]> {
    return this.chatRepository.getConversationsForAnimal(animalId, viewer);
  }
}
