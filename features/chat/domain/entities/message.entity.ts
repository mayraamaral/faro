export const MESSAGE_MAX_LENGTH = 2000;
export const MESSAGE_MIN_LENGTH = 1;

import type { UserRole } from "@/features/pets/domain/entities/current-user.entity";

export type MessageSenderType = UserRole;

export type NewMessage = {
  conversationId: string;
  senderType: MessageSenderType;
  userId: string;
  adopterProfileId: string | null;
  listerProfileId: string | null;
  content: string;
};

export type Message = NewMessage & {
  id: string;
  createdAt: string;
};

export class MessageEntity {
  private constructor(
    public readonly content: string,
    public readonly conversationId: string,
    public readonly senderType: MessageSenderType,
    public readonly userId: string,
    public readonly adopterProfileId: string | null,
    public readonly listerProfileId: string | null
  ) {}

  static create(props: {
    content: string;
    conversationId: string;
    senderType: MessageSenderType;
    userId: string;
    adopterProfileId: string | null;
    listerProfileId: string | null;
  }): MessageEntity {
    const trimmedContent = props.content.trim();

    if (trimmedContent.length < MESSAGE_MIN_LENGTH) {
      throw new Error("Message content must not be empty.");
    }

    if (trimmedContent.length > MESSAGE_MAX_LENGTH) {
      throw new Error(
        `Message content must be at most ${MESSAGE_MAX_LENGTH} characters.`
      );
    }

    if (!props.conversationId) {
      throw new Error("Message must belong to a conversation.");
    }

    if (!props.userId) {
      throw new Error("Message must have a userId.");
    }

    if (props.senderType === "ADOPTER") {
      if (!props.adopterProfileId) {
        throw new Error("Adopter message must reference an adopter profile.");
      }

      if (props.listerProfileId !== null) {
        throw new Error("Adopter message must not reference a lister profile.");
      }
    } else {
      if (!props.listerProfileId) {
        throw new Error("Lister message must reference a lister profile.");
      }

      if (props.adopterProfileId !== null) {
        throw new Error("Lister message must not reference an adopter profile.");
      }
    }

    return new MessageEntity(
      trimmedContent,
      props.conversationId,
      props.senderType,
      props.userId,
      props.adopterProfileId,
      props.listerProfileId
    );
  }

  toNew(): NewMessage {
    return {
      conversationId: this.conversationId,
      senderType: this.senderType,
      userId: this.userId,
      adopterProfileId: this.adopterProfileId,
      listerProfileId: this.listerProfileId,
      content: this.content,
    };
  }
}
