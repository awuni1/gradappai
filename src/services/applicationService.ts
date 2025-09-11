
import { supabase } from "@/integrations/supabase/client";

export interface Application {
  id: string;
  university: string;
  program: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'interview' | 'accepted' | 'rejected';
  progress: number;
  requirements?: ApplicationRequirement[];
  notes?: string;
  user_id?: string;
}

export interface ApplicationRequirement {
  id: string;
  name: string;
  completed: boolean;
  due_date?: string;
  application_id: string;
}

export const applicationService = {
  getUserApplications: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Applications table does not exist yet. Please deploy the application tracking schema.');
          return { data: [], error: null };
        }
        console.error('Error fetching applications:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserApplications:', error);
      return { data: [], error: null };
    }
  },
  
  getApplicationRequirements: async (applicationId: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      const { data, error } = await supabase
        .from('application_requirements')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Application requirements table does not exist yet.');
          return { data: [], error: null };
        }
        console.error('Error fetching requirements:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getApplicationRequirements:', error);
      return { data: [], error: null };
    }
  },
  
  createApplication: async (application: Partial<Application>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...application,
          user_id: user.user.id,
          progress: 0,
          status: 'not_started'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Applications table does not exist yet.');
          return { data: null, error: 'Database not ready' };
        }
        console.error('Error creating application:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createApplication:', error);
      return { data: null, error: 'Failed to create application' };
    }
  },
  
  updateApplication: async (id: string, updates: Partial<Application>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Applications table does not exist yet.');
          return { data: null, error: 'Database not ready' };
        }
        console.error('Error updating application:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateApplication:', error);
      return { data: null, error: 'Failed to update application' };
    }
  }
};

export default applicationService;
