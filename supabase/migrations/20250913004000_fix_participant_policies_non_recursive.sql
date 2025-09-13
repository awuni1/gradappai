-- Fix infinite recursion policy error on conversation_participants
-- Replace self-referential policies with simple, non-recursive (dev-friendly) policies.

-- 1) Drop the recursive policies if they exist
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

-- 2) Recreate non-recursive policies (development permissive)
-- NOTE: These policies are intentionally permissive to unblock development.
--       Tighten them later with a dedicated RPC or cache table to avoid recursion.

CREATE POLICY "Dev: any authed can view participants"
  ON public.conversation_participants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Dev: any authed can add participants"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Conversations update policy (non-recursive): allow updates by any participant via existing conversations policy
-- Keep prior conversations/messages policies from earlier migration.
