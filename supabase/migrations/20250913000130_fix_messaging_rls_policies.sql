-- Fix messaging RLS policies to ensure proper functionality
-- This migration fixes issues with conversation creation, viewing, and messaging

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create comprehensive conversation SELECT policy
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT
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

-- Create conversation_participants SELECT policy (already exists but ensuring it's correct)
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for messages (for editing)
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Add DELETE policy for messages (for deleting own messages)
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Ensure user_profiles are readable for messaging (needed for user search)
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view basic profile info for messaging" ON public.user_profiles
  FOR SELECT
  USING (
    profile_visibility = 'public' OR 
    auth.uid() IS NOT NULL  -- Any authenticated user can see basic info
  );

-- Create a policy to allow viewing all user profiles for search (minimal data only)
DROP POLICY IF EXISTS "Users can search other profiles" ON public.user_profiles;
CREATE POLICY "Users can search other profiles" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);  -- Allow authenticated users to search

-- Add conversation management policies for group chats
CREATE POLICY "Group admins can update conversation details" ON public.conversations
  FOR UPDATE
  USING (
    group_admin = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid() 
        AND cp.role = 'admin'
    )
  );

-- Allow participants to remove themselves from conversations
CREATE POLICY "Users can leave conversations" ON public.conversation_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- Allow participants to update their own participation settings
CREATE POLICY "Users can update their participation settings" ON public.conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid());

-- Ensure conversations can be deleted by admins
CREATE POLICY "Admins can delete conversations" ON public.conversations
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    group_admin = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid() 
        AND cp.role = 'admin'
    )
  );
