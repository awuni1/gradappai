import { supabase } from '@/integrations/supabase/client';

export const seedTestUsers = async () => {
  try {
    console.log('Seeding test users...');
    
    // First check if we already have some users
    const { data: existingUsers, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .limit(3);

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('Found existing users:', existingUsers);
      return existingUsers;
    }

    console.log('No users found, creating test users...');

    // Generate some test users
    const testUsers = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        display_name: 'Joel Martinez',
        full_name: 'Joel Martinez',
        field_of_study: 'Computer Science',
        academic_level: 'PhD',
        profile_visibility: 'public'
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        display_name: 'Sarah Johnson',
        full_name: 'Sarah Elizabeth Johnson',
        field_of_study: 'Data Science',
        academic_level: 'Masters',
        profile_visibility: 'public'
      },
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        display_name: 'Michael Chen',
        full_name: 'Michael Chen',
        field_of_study: 'Machine Learning',
        academic_level: 'PhD',
        profile_visibility: 'public'
      },
      {
        user_id: '44444444-4444-4444-4444-444444444444',
        display_name: 'Emily Rodriguez',
        full_name: 'Emily Rodriguez',
        field_of_study: 'Artificial Intelligence',
        academic_level: 'Masters',
        profile_visibility: 'public'
      }
    ];

    const { data: insertedUsers, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testUsers)
      .select();

    if (insertError) {
      console.error('Error inserting test users:', insertError);
      return;
    }

    console.log('Successfully created test users:', insertedUsers);
    return insertedUsers;
  } catch (error) {
    console.error('Error in seedTestUsers:', error);
  }
};