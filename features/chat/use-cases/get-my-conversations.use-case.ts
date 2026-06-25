import type { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";

import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";

export class GetMyConversationsUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(viewer: CurrentUserEntity): Promise<ConversationListItem[]> {
    return this.chatRepository.getMyConversations(viewer);
  }
}
