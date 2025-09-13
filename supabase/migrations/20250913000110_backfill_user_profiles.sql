-- Backfill missing user_profiles from auth.users so names and avatars resolve in chat UIs

DO $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, display_name, email, profile_picture_url, profile_visibility, search_visibility, created_at, updated_at)
  SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as full_name,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as display_name,
    u.email,
    COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as profile_picture_url,
    'public'::visibility_level,
    true,
    now(),
    now()
  FROM auth.users u
  LEFT JOIN public.user_profiles p ON p.user_id = u.id
  WHERE p.user_id IS NULL;
EXCEPTION WHEN others THEN
  -- Ignore if auth schema isn't accessible in this environment
  NULL;
END $$;