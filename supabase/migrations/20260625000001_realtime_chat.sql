-- ============================================================
-- Realtime Chat
-- Tables:
--   * public.adoption_conversations (1-to-1 with public.adoptions)
--   * public.messages (many per conversation)
-- RLS: adopters can read/insert via adopter_profiles.user_id;
--      listers via lister_profiles.user_id. Anti-spoofing enforced
--      via WITH CHECK on user_id, sender_type, and profile ownership.
-- Realtime: publication supabase_realtime includes public.messages.
-- ============================================================

-- 1. CREATE TABLE public.adoption_conversations
CREATE TABLE public.adoption_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adoption_id UUID NOT NULL UNIQUE REFERENCES public.adoptions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE TABLE public.messages
CREATE TABLE public.messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id     UUID NOT NULL REFERENCES public.adoption_conversations(id) ON DELETE CASCADE,
  sender_type         public.user_role NOT NULL,
  user_id             UUID NOT NULL REFERENCES public.users(id),
  adopter_profile_id  UUID NULL REFERENCES public.adopter_profiles(id),
  lister_profile_id   UUID NULL REFERENCES public.lister_profiles(id),
  content             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_messages_sender_type_profile CHECK (
    (sender_type = 'ADOPTER' AND adopter_profile_id IS NOT NULL AND lister_profile_id IS NULL)
    OR
    (sender_type = 'LISTER' AND lister_profile_id IS NOT NULL AND adopter_profile_id IS NULL)
  ),
  CONSTRAINT chk_messages_content_length CHECK (
    char_length(btrim(content)) BETWEEN 1 AND 2000
  )
);

-- 3. CREATE INDEX
CREATE INDEX idx_adoption_conversations_adoption_id
  ON public.adoption_conversations (adoption_id);

CREATE INDEX idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at);

CREATE INDEX idx_messages_user_id
  ON public.messages (user_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.adoption_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICY

-- 5.1. adoption_conversations: adopters can SELECT
CREATE POLICY "Adopters can view their adoption conversations"
  ON public.adoption_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adoptions a
      JOIN public.adopter_profiles ap ON ap.id = a.adopter_profile_id
      WHERE a.id = adoption_conversations.adoption_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

-- 5.2. adoption_conversations: listers can SELECT
CREATE POLICY "Listers can view their adoption conversations"
  ON public.adoption_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adoptions a
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp ON lp.id = an.lister_profile_id
      WHERE a.id = adoption_conversations.adoption_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );

-- 5.3. adoption_conversations: adopters can INSERT (one conversation per adoption)
CREATE POLICY "Adopters can create conversations for their adoptions"
  ON public.adoption_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.adoptions a
      JOIN public.adopter_profiles ap ON ap.id = a.adopter_profile_id
      WHERE a.id = adoption_conversations.adoption_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

-- 5.4. adoption_conversations: listers can INSERT
CREATE POLICY "Listers can create conversations for their adoptions"
  ON public.adoption_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.adoptions a
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp ON lp.id = an.lister_profile_id
      WHERE a.id = adoption_conversations.adoption_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );

-- 5.5. messages: adopters can SELECT
CREATE POLICY "Adopters can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.adopter_profiles ap ON ap.id = a.adopter_profile_id
      WHERE ac.id = messages.conversation_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

-- 5.6. messages: listers can SELECT
CREATE POLICY "Listers can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp ON lp.id = an.lister_profile_id
      WHERE ac.id = messages.conversation_id
        AND lp.user_id = (SELECT auth.uid())
    )
  );

-- 5.7. messages: adopters can INSERT (anti-spoofing)
CREATE POLICY "Adopters can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND sender_type = 'ADOPTER'
    AND adopter_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.adopter_profiles ap
      WHERE ap.id = messages.adopter_profile_id
        AND ap.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.adopter_profiles ap ON ap.id = a.adopter_profile_id
      WHERE ac.id = messages.conversation_id
        AND ap.user_id = (SELECT auth.uid())
    )
  );

-- 5.8. messages: listers can INSERT (anti-spoofing)
CREATE POLICY "Listers can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND sender_type = 'LISTER'
    AND lister_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.lister_profiles lp
      WHERE lp.id = messages.lister_profile_id
        AND lp.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.adoption_conversations ac
      JOIN public.adoptions a ON a.id = ac.adoption_id
      JOIN public.animals an ON an.id = a.animal_id
      JOIN public.lister_profiles lp2 ON lp2.id = an.lister_profile_id
      WHERE ac.id = messages.conversation_id
        AND lp2.user_id = (SELECT auth.uid())
    )
  );

-- 6. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
