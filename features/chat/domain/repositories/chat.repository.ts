import type { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";

import type { Conversation } from "../entities/conversation.entity";
import type { ConversationListItem } from "../entities/conversation-list-item.entity";
import type { Message, NewMessage } from "../entities/message.entity";

export interface ChatRepository {
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(message: NewMessage): Promise<Message>;
  createConversation(adoptionId: string): Promise<Conversation>;
  getConversationByAdoptionId(adoptionId: string): Promise<Conversation | null>;
  getMyConversations(viewer: CurrentUserEntity): Promise<ConversationListItem[]>;
  getConversationsForAnimal(
    animalId: string,
    viewer: CurrentUserEntity,
  ): Promise<ConversationListItem[]>;
  getConversationHeader(
    conversationId: string,
    viewer: CurrentUserEntity
  ): Promise<{ counterpartyName: string }>;
}
