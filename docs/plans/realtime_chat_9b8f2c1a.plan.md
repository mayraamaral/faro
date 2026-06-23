---
name: Realtime Chat
overview: Implement a basic real-time messaging system between adopters and listers. Uses an `adoption_conversations` table linked to `adoptions`, and a `messages` table for individual messages. Uses Supabase Realtime and adheres to Clean Architecture.
todos:
  - id: prerequisite-adoptions-table
    content: Ensure `public.adoptions` migration is applied (see adoption_table_modeling_78c0dbfd.plan.md). If not, implement it first before proceeding with this plan.
    status: pending
  - id: create-conversations-and-messages-tables
    content: Create migration for `public.adoption_conversations` and `public.messages` tables with proper FK constraints, CHECK constraints for sender identity, content validation, indexes, and RLS policies.
    status: pending
  - id: setup-realtime-replication
    content: Enable Supabase Realtime replication on the `public.messages` table via migration.
    status: pending
  - id: create-chat-domain
    content: Create `MessageEntity`, `ConversationEntity`, `ChatRepository` interface, and domain errors in `features/chat/domain`. MessageEntity validates non-empty/non-whitespace trimmed content with a max length.
    status: pending
  - id: create-chat-infra
    content: Implement `SupabaseChatRepository` in `features/chat/infrastructure` handling inserts and querying historical messages ordered by created_at.
    status: pending
  - id: create-chat-use-cases
    content: Create `SendMessageUseCase` and `GetMessagesUseCase` in `features/chat/use-cases`. SendMessageUseCase constructs MessageEntity (which validates content), then delegates to the repository.
    status: pending
  - id: create-chat-schema
    content: Create Zod schema `features/chat/schemas/send-message.schema.ts` with content trimmed, min 1, max 2000 chars. Export schema and inferred type.
    status: pending
  - id: create-chat-hooks
    content: Create `useMessages(conversationId)` hook that fetches history and subscribes to Supabase Realtime inserts, handling AppState (unsubscribe on background, resubscribe + fetch missing history on foreground).
    status: pending
  - id: create-chat-ui
    content: Create Chat Screen `app/(app)/chat/[conversation_id].tsx` and feature components in `features/chat/components`. Must handle loading, empty, error, and active states, keyboard avoidance, safe-area, and current user vs other participant bubble styling.
    status: pending
isProject: false
---

# Realtime Chat Plan

## Scope and confirmed decisions

- **Goal**: Allow adopters and listers to chat in the context of a specific adoption process.
- **Data Model**: `adoption_conversations` (1-to-1 with `adoptions`) → `messages` (many).
- **Pre-requisite**: The `adoptions` table (and its migration) must exist before any chat migration runs. This plan does **not** create `adoptions`.
- **Features**: Basic messaging — text content, timestamp, sender identity. No read receipts or typing indicators.
- **Realtime**: Supabase Realtime `postgres_changes` subscription on `public.messages` inserts.

## Decisions

| Decision | Rationale |
|---|---|
| `adoption_conversations` 1-to-1 with `adoptions` | One canonical conversation per adoption. Avoids orphan conversations and keeps RLS simple. |
| Sender identity via two nullable profile columns + CHECK | PostgreSQL cannot enforce a conditional polymorphic FK. Two nullable columns with a CHECK constraint enforces exactly one profile reference per sender_type at the DB level — no trigger needed. |
| `user_id` column alongside profile columns | Provides a direct auth.uid() anchor for RLS without joins through profile tables. |
| Supabase `postgres_changes` (not Broadcast) | Persisted messages — history is needed. Broadcast would lose messages for offline users. |
| AppState foreground refetch on top of realtime | Expo Go on physical device kills the WebSocket in background; a foreground refetch covers the gap without a custom reconnect strategy. |
| Content max length 2000 chars at both app and DB layer | Prevents unbounded storage. Enforced in Zod schema and `CHECK (char_length(content) BETWEEN 1 AND 2000)`. |

## Target Data Model

### 1. `public.adoption_conversations`

```sql
CREATE TABLE public.adoption_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adoption_id UUID NOT NULL UNIQUE REFERENCES public.adoptions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adoption_conversations_adoption_id
  ON public.adoption_conversations (adoption_id);

ALTER TABLE public.adoption_conversations ENABLE ROW LEVEL SECURITY;
```

### 2. `public.messages`

```sql
CREATE TABLE public.messages (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id          UUID NOT NULL REFERENCES public.adoption_conversations(id) ON DELETE CASCADE,
  sender_type              user_role NOT NULL,                     -- 'ADOPTER' | 'LISTER'
  user_id                  UUID NOT NULL REFERENCES public.users(id),
  adopter_profile_id       UUID NULL REFERENCES public.adopter_profiles(id),
  lister_profile_id        UUID NULL REFERENCES public.lister_profiles(id),
  content                  TEXT NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_sender_type_profile CHECK (
    (sender_type = 'ADOPTER' AND adopter_profile_id IS NOT NULL AND lister_profile_id IS NULL)
    OR
    (sender_type = 'LISTER' AND lister_profile_id IS NOT NULL AND adopter_profile_id IS NULL)
  ),
  CONSTRAINT chk_content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at);

CREATE INDEX idx_messages_user_id
  ON public.messages (user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
```

### RLS Policies — `adoption_conversations`

```sql
-- Adopters can view their conversations
CREATE POLICY "Adopters can view their adoption conversations"
  ON public.adoption_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adoptions a
      WHERE a.id = adoption_id
        AND a.adopter_id = (SELECT auth.uid())
    )
  );

-- Listers can view their conversations
CREATE POLICY "Listers can view their adoption conversations"
  ON public.adoption_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adoptions a
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp ON lp.id = an.lister_profile_id
      WHERE a.id = adoption_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );
```

### RLS Policies — `messages`

```sql
-- Adopters can view messages in their conversations
CREATE POLICY "Adopters can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      WHERE ac.id = conversation_id
        AND a.adopter_id = (SELECT auth.uid())
    )
  );

-- Listers can view messages in their conversations
CREATE POLICY "Listers can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp ON lp.id = an.lister_profile_id
      WHERE ac.id = conversation_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );

-- Adopters can insert as themselves (anti-spoofing: user_id, sender_type, and profile ownership validated)
CREATE POLICY "Adopters can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND sender_type = 'ADOPTER'
    AND adopter_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.adopter_profiles ap
      WHERE ap.id = adopter_profile_id
        AND ap.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      WHERE ac.id = conversation_id
        AND a.adopter_id = (SELECT auth.uid())
    )
  );

-- Listers can insert as themselves (anti-spoofing: user_id, sender_type, and profile ownership validated)
CREATE POLICY "Listers can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND sender_type = 'LISTER'
    AND lister_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.lister_profiles lp
      WHERE lp.id = lister_profile_id
        AND lp.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp2 ON lp2.id = an.lister_profile_id
      WHERE ac.id = conversation_id
        AND lp2.user_id = (SELECT auth.uid())
    )
  );
```

## Realtime Considerations

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

- Frontend hook must:
  1. Fetch full history on mount (`GetMessagesUseCase`).
  2. Subscribe to `postgres_changes` `INSERT` on `messages` filtered by `conversation_id`.
  3. On `AppState` change to `background`: unsubscribe and remove channel.
  4. On `AppState` change back to `active`: resubscribe and refetch messages since last known `created_at` to cover the gap.

## App Layer Architecture

Following `features/chat/` with the project's Clean Architecture layers:

```
features/chat/
├── domain/
│   ├── entities/
│   │   ├── message.entity.ts        # private ctor, static create(), validates trimmed content
│   │   └── conversation.entity.ts
│   ├── repositories/
│   │   └── chat.repository.ts       # interface: getMessages(), sendMessage(), createConversation()
│   └── errors/
│       └── chat.errors.ts           # ChatErrorCode union + ChatError class
├── infrastructure/
│   └── supabase-chat.repository.ts  # implements ChatRepository, maps Supabase errors to ChatError
├── use-cases/
│   ├── get-messages.use-case.ts
│   └── send-message.use-case.ts     # constructs MessageEntity (validates content), delegates to repo
├── schemas/
│   └── send-message.schema.ts       # Zod: content z.string().trim().min(1).max(2000)
├── hooks/
│   └── use-messages.ts              # module-level repo + use case singletons; AppState subscription mgmt
└── components/
    └── chat-screen/                 # message list, input bar, bubble variants
```

## UI Screen Specification

Route: `app/(app)/chat/[conversation_id].tsx`

### Required States
| State | Behavior |
|---|---|
| Loading | Show activity indicator while history fetches |
| Empty | Show placeholder ("No messages yet. Say hello!") |
| Error | Show error message with retry action |
| Active | Scrollable message list with input at bottom |

### Message Bubble
- Current user messages: right-aligned, primary brand color background.
- Other participant: left-aligned, neutral background.
- Each bubble shows content and formatted timestamp.
- Accessibility label: `"{sender} at {time}: {content}"`.

### Input Bar
- Send button disabled when content is empty or whitespace-only or while send is pending.
- Keyboard avoidance via `KeyboardAvoidingView`.
- Safe-area handled with `useSafeAreaInsets`.
- Use tokens from `constants/tokens.ts` for colors, spacing, and radius.

## Final Verification Wave

1. **Prerequisite**: Confirm `public.adoptions` migration is applied before running chat migrations.
2. **Schema integrity**: Verify `CHECK` constraint rejects messages with wrong sender_type/profile combination.
3. **RLS**: Confirm an adopter cannot read or write to a conversation they are not a participant in. Confirm a lister cannot send as an adopter and vice-versa.
4. **Realtime**: Verify messages append in real-time without duplicates between two devices/sessions.
5. **AppState**: Verify WebSocket is re-established and missing messages are fetched after backgrounding and foregrounding the app.
6. **Content validation**: Confirm empty and whitespace-only messages are rejected at both the Zod schema and DB CHECK level.
