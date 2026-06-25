export type ConversationListItem = {
  id: string;
  adoptionId: string;
  counterpartyName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};

export class ConversationListItemEntity {
  private constructor(
    public readonly id: string,
    public readonly adoptionId: string,
    public readonly counterpartyName: string,
    public readonly lastMessagePreview: string | null,
    public readonly lastMessageAt: string | null,
    public readonly createdAt: string
  ) {}

  static create(props: {
    id: string;
    adoptionId: string;
    counterpartyName: string;
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
    createdAt: string;
  }): ConversationListItemEntity {
    if (!props.id) throw new Error("Conversation list item must have an id.");
    if (!props.adoptionId) throw new Error("Conversation list item must have an adoptionId.");
    if (!props.counterpartyName) {
      throw new Error("Conversation list item must have a counterpartyName.");
    }
    if (!props.createdAt) throw new Error("Conversation list item must have a createdAt.");

    return new ConversationListItemEntity(
      props.id,
      props.adoptionId,
      props.counterpartyName,
      props.lastMessagePreview,
      props.lastMessageAt,
      props.createdAt
    );
  }
}
