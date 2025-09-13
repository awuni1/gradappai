-- Fix messaging RLS policies for remote Supabase database
-- This script fixes issues with conversation creation, viewing, and messaging

-- Enable RLS on all messaging tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.user_profiles;

-- Create conversation SELECT policy
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- Create conversation INSERT policy
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create conversation UPDATE policy (fixed to use existing columns)
CREATE POLICY "Users can update conversations they participate in" ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- Create message SELECT policy
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Create message INSERT policy
CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Create message UPDATE policy (for editing own messages)
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Create conversation_participants SELECT policy
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

-- Create conversation_participants INSERT policy (fixed to use existing columns)
CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Create user_profiles SELECT policy for messaging
CREATE POLICY "Users can view profiles for messaging" ON public.user_profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      profile_visibility = 'public' OR
      user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
