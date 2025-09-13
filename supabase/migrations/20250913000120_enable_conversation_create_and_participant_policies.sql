-- Enable users to create conversations and add/view participants
-- This migration adds RLS policies required by the messaging UI

-- Conversations: allow INSERT by any authenticated user (no created_by dependency)
DROP POLICY IF EXISTS "Users can create conversations they own" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Note: We rely on existing policy "Users can view conversations they participate in"
-- to view conversations. No extra SELECT policy referencing created_by.

-- Conversations: allow UPDATE (e.g., last_message_at) if the user participates
CREATE POLICY "Users can update conversations they participate in" ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to their conversations" ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    -- Allow adding yourself
    user_id = auth.uid()
    OR
    -- Or if you're already a participant in that conversation, you can add others
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

-- Messages: allow sending messages if the user participates in the conversation
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );
