import type { Conversation } from "../entities/conversation.entity";
import type { Message, NewMessage } from "../entities/message.entity";

export interface ChatRepository {
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(message: NewMessage): Promise<Message>;
  createConversation(adoptionId: string): Promise<Conversation>;
  getConversationByAdoptionId(adoptionId: string): Promise<Conversation | null>;
}
