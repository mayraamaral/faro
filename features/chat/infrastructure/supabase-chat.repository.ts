import { supabase } from "@/lib/supabase";
import type { CurrentUserEntity } from "@/features/pets/domain/entities/current-user.entity";

import type { Conversation } from "../domain/entities/conversation.entity";
import type { ConversationListItem } from "../domain/entities/conversation-list-item.entity";
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

type ListerProfileEmbedded = {
  id: string;
  user_id: string;
  lister_type: "INDIVIDUAL" | "SHELTER";
  name: string | null;
  trade_name: string | null;
};

type AdopterProfileEmbedded = {
  id: string;
  user_id: string;
  name: string;
};

type ConversationWithAdoptionRow = ConversationRow & {
  adoptions:
    | {
        id: string;
        status: string;
        adopter_profile_id: string | null;
        adopter_profile: AdopterProfileEmbedded | null;
        animals:
          | {
              id: string;
              lister_profile_id: string;
              lister_profile: ListerProfileEmbedded | null;
            }
          | null;
      }
    | null;
};

const getAdoption = (row: ConversationWithAdoptionRow) => row.adoptions ?? null;
const getAnimal = (
  adoption: NonNullable<ConversationWithAdoptionRow["adoptions"]> | null
) => adoption?.animals ?? null;
const getAdopterProfile = (
  adoption: NonNullable<ConversationWithAdoptionRow["adoptions"]> | null
) => adoption?.adopter_profile ?? null;
const getListerProfile = (
  animal: NonNullable<
    NonNullable<ConversationWithAdoptionRow["adoptions"]>["animals"]
  > | null
) => animal?.lister_profile ?? null;

type LastMessageRow = {
  conversation_id: string;
  content: string;
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

const resolveListerName = (profile: ListerProfileEmbedded | null): string => {
  if (!profile) return "Tutor";
  if (profile.lister_type === "SHELTER") {
    return profile.trade_name ?? profile.name ?? "Abrigo";
  }
  return profile.name ?? "Tutor";
};

const resolveAdopterName = (profile: AdopterProfileEmbedded | null): string => {
  return profile?.name ?? "Adotante";
};

const resolveCounterpartyName = (
  row: ConversationWithAdoptionRow,
  viewer: CurrentUserEntity
): string => {
  const adoption = getAdoption(row);
  if (!adoption) return viewer.isAdopter ? "Tutor" : "Adotante";

  if (viewer.isAdopter) {
    return resolveListerName(getListerProfile(getAnimal(adoption)));
  }
  return resolveAdopterName(getAdopterProfile(adoption));
};

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

  async getMyConversations(viewer: CurrentUserEntity): Promise<ConversationListItem[]> {
    return this.loadConversations(viewer, null);
  }

  async getConversationsForAnimal(
    animalId: string,
    viewer: CurrentUserEntity,
  ): Promise<ConversationListItem[]> {
    return this.loadConversations(viewer, animalId);
  }

  private async loadConversations(
    viewer: CurrentUserEntity,
    animalId: string | null,
  ): Promise<ConversationListItem[]> {
    const { data, error } = await supabase
      .from("adoption_conversations")
      .select(
        `
        id,
        adoption_id,
        created_at,
        adoptions:adoption_id (
          id,
          adopter_profile_id,
          adopter_profile:adopter_profile_id (
            id,
            user_id,
            name
          ),
          animals:animal_id (
            id,
            lister_profile_id,
            lister_profile:lister_profile_id (
              id,
              user_id,
              lister_type,
              name,
              trade_name
            )
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw mapSupabaseChatError(error, "MESSAGES_FETCH_FAILED");

    const rows = (data ?? []) as unknown as ConversationWithAdoptionRow[];
    const filtered = rows.filter((row) => {
      const adoption = getAdoption(row);
      if (!adoption) return false;
      const animal = getAnimal(adoption);
      if (animalId && animal?.id !== animalId) return false;
      if (viewer.isAdopter) {
        return getAdopterProfile(adoption)?.user_id === viewer.userId;
      }
      return getListerProfile(animal)?.user_id === viewer.userId;
    });

    if (filtered.length === 0) return [];

    const conversationIds = filtered.map((row) => row.id);
    const { data: lastMessages, error: lastError } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (lastError) throw mapSupabaseChatError(lastError, "MESSAGES_FETCH_FAILED");

    const latestByConversation = new Map<string, LastMessageRow>();
    for (const message of (lastMessages ?? []) as LastMessageRow[]) {
      if (!latestByConversation.has(message.conversation_id)) {
        latestByConversation.set(message.conversation_id, message);
      }
    }

    return filtered.map((row) => {
      const last = latestByConversation.get(row.id) ?? null;
      return {
        id: row.id,
        adoptionId: row.adoption_id,
        counterpartyName: resolveCounterpartyName(row, viewer),
        lastMessagePreview: last?.content ?? null,
        lastMessageAt: last?.created_at ?? null,
        createdAt: row.created_at,
      };
    });
  }

  async getConversationHeader(
    conversationId: string,
    viewer: CurrentUserEntity
  ): Promise<{
    counterpartyName: string;
    adoptionId: string;
    adoptionStatus: string;
  }> {
    const { data, error } = await supabase
      .from("adoption_conversations")
      .select(
        `
        id,
        adoption_id,
        created_at,
        adoptions:adoption_id (
          id,
          status,
          adopter_profile_id,
          adopter_profile:adopter_profile_id (
            id,
            user_id,
            name
          ),
          animals:animal_id (
            id,
            lister_profile_id,
            lister_profile:lister_profile_id (
              id,
              user_id,
              lister_type,
              name,
              trade_name
            )
          )
        )
      `
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (error) throw mapSupabaseChatError(error, "CONVERSATION_NOT_FOUND");
    if (!data) {
      throw mapSupabaseChatError({ message: "Not found" }, "CONVERSATION_NOT_FOUND");
    }

    const row = data as unknown as ConversationWithAdoptionRow;
    const adoption = getAdoption(row);
    if (!adoption) {
      throw mapSupabaseChatError(
        { message: "Adoption missing" },
        "CONVERSATION_NOT_FOUND",
      );
    }

    return {
      counterpartyName: resolveCounterpartyName(row, viewer),
      adoptionId: adoption.id,
      adoptionStatus: adoption.status,
    };
  }
}
