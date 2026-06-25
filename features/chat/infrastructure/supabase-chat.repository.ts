import { supabase } from "@/lib/supabase";

import type { Conversation } from "../domain/entities/conversation.entity";
import type { Message, MessageSenderType, NewMessage } from "../domain/entities/message.entity";
import type { ChatRepository } from "../domain/repositories/chat.repository";
import { mapSupabaseChatError } from "./supabase-chat-error-mapper";

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  user_id: string;
  adopter_profile_id: string | null;
  lister_profile_id: string | null;
  content: string;
  created_at: string;
};

type ConversationRow = {
  id: string;
  adoption_id: string;
  created_at: string;
};

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderType: row.sender_type,
  userId: row.user_id,
  adopterProfileId: row.adopter_profile_id,
  listerProfileId: row.lister_profile_id,
  content: row.content,
  createdAt: row.created_at,
});

const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  adoptionId: row.adoption_id,
  createdAt: row.created_at,
});

export class SupabaseChatRepository implements ChatRepository {
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_type, user_id, adopter_profile_id, lister_profile_id, content, created_at"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw mapSupabaseChatError(error, "MESSAGES_FETCH_FAILED");

    return ((data ?? []) as MessageRow[]).map(toMessage);
  }

  async sendMessage(message: NewMessage): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: message.conversationId,
        sender_type: message.senderType,
        user_id: message.userId,
        adopter_profile_id: message.adopterProfileId,
        lister_profile_id: message.listerProfileId,
        content: message.content,
      })
      .select(
        "id, conversation_id, sender_type, user_id, adopter_profile_id, lister_profile_id, content, created_at"
      )
      .single();

    if (error) throw mapSupabaseChatError(error, "MESSAGE_SEND_FAILED");
    if (!data) throw mapSupabaseChatError({ message: "No row returned" }, "MESSAGE_SEND_FAILED");

    return toMessage(data as MessageRow);
  }

  async createConversation(adoptionId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from("adoption_conversations")
      .insert({ adoption_id: adoptionId })
      .select("id, adoption_id, created_at")
      .single();

    if (error) throw mapSupabaseChatError(error, "CONVERSATION_CREATE_FAILED");
    if (!data) {
      throw mapSupabaseChatError(
        { message: "No row returned" },
        "CONVERSATION_CREATE_FAILED"
      );
    }

    return toConversation(data as ConversationRow);
  }

  async getConversationByAdoptionId(adoptionId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from("adoption_conversations")
      .select("id, adoption_id, created_at")
      .eq("adoption_id", adoptionId)
      .maybeSingle();

    if (error) throw mapSupabaseChatError(error, "CONVERSATION_NOT_FOUND");
    if (!data) return null;

    return toConversation(data as ConversationRow);
  }
}
