-- Allow clients to read basic identity fields for other users' profiles
-- so chat UIs can display names and avatars.

-- Notes:
-- - Existing policy only allowed users to SELECT their own profile, which
--   prevented fetching names for chat participants and resulted in placeholders.
-- - This policy permits SELECT when a profile is public or searchable, while
--   still allowing users to read their own unconditionally.

DO $$
BEGIN
  -- Create SELECT policy for public/search-visible profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'Users can view public/search-visible profiles'
  ) THEN
    CREATE POLICY "Users can view public/search-visible profiles" ON public.user_profiles
      FOR SELECT
      USING (
        profile_visibility = 'public' OR
        search_visibility = true OR
        auth.uid() = user_id
      );
  END IF;
END $$;

-- Optional: ensure helpful indexes exist (safe if already created)
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON public.user_profiles(profile_visibility, search_visibility);