export type Conversation = {
  id: string;
  adoptionId: string;
  createdAt: string;
};

export class ConversationEntity {
  private constructor(
    public readonly id: string,
    public readonly adoptionId: string,
    public readonly createdAt: string
  ) {}

  static create(props: { id: string; adoptionId: string; createdAt: string }): ConversationEntity {
    if (!props.id) {
      throw new Error("Conversation must have an id.");
    }

    if (!props.adoptionId) {
      throw new Error("Conversation must be linked to an adoption.");
    }

    if (!props.createdAt) {
      throw new Error("Conversation must have a createdAt timestamp.");
    }

    return new ConversationEntity(props.id, props.adoptionId, props.createdAt);
  }
}
