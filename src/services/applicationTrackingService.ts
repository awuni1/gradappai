import { supabase } from '@/integrations/supabase/client';

export interface Application {
  id: string;
  user_id: string;
  university_id: string;
  program_id?: string;
  university_name: string;
  program_name?: string;
  application_status: 'not_started' | 'in_progress' | 'submitted' | 'under_review' | 'interview_scheduled' | 'decision_pending' | 'accepted' | 'rejected' | 'waitlisted' | 'deferred';
  priority: number;
  application_deadline: string;
  decision_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRequirement {
  id: string;
  application_id: string;
  title: string;
  requirement_type: string;
  description?: string;
  is_required: boolean;
  is_completed: boolean;
  due_date?: string;
  file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationFinance {
  id: string;
  application_id: string;
  expense_type: 'application_fee' | 'test_fee' | 'transcript_fee' | 'other';
  amount: number;
  currency: string;
  paid: boolean;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total_applications: number;
  by_status: Record<string, number>;
  upcoming_deadlines: number;
  total_costs: number;
  paid_costs: number;
}

class ApplicationTrackingService {
  /**
   * Get all applications for a user
   */
  async getUserApplications(userId: string): Promise<Application[]> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .select(`
          id,
          user_id,
          university_id,
          program_id,
          priority,
          application_deadline,
          notes,
          created_at,
          updated_at,
          universities!inner(name),
          university_programs(name)
        `)
        .eq('user_id', userId)
        .order('application_deadline', { ascending: true });

      if (error) {throw error;}
      
      // Transform the data to match our interface
      const applications = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        university_id: item.university_id,
        program_id: item.program_id,
        university_name: item.universities.name,
        program_name: item.university_programs?.name || 'Graduate Program',
        application_status: 'not_started',
        priority: item.priority || 1,
        application_deadline: item.application_deadline,
        decision_date: null,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      return applications;
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  }

  /**
   * Create a new application
   */
  async createApplication(userId: string, applicationData: Omit<Application, 'id' | 'user_id' | 'university_name' | 'program_name' | 'created_at' | 'updated_at'>): Promise<Application | null> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .insert({
          user_id: userId,
          university_id: applicationData.university_id,
          program_id: applicationData.program_id,
          priority: applicationData.priority,
          application_deadline: applicationData.application_deadline,
          notes: applicationData.notes
        })
        .select(`
          id,
          user_id,
          university_id,
          program_id,
          priority,
          application_deadline,
          notes,
          created_at,
          updated_at,
          universities!inner(name),
          university_programs(name)
        `)
        .single();

      if (error) {throw error;}
      
      return {
        id: data.id,
        user_id: data.user_id,
        university_id: data.university_id,
        program_id: data.program_id,
        university_name: data.universities.name,
        program_name: data.university_programs?.name || 'Graduate Program',
        application_status: 'not_started',
        priority: data.priority,
        application_deadline: data.application_deadline,
        decision_date: null,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating application:', error);
      return null;
    }
  }

  /**
   * Update an application
   */
  async updateApplication(applicationId: string, updates: Partial<Application>): Promise<Application | null> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .update({
          priority: updates.priority,
          application_deadline: updates.application_deadline,
          notes: updates.notes
        })
        .eq('id', applicationId)
        .select(`
          id,
          user_id,
          university_id,
          program_id,
          priority,
          application_deadline,
          notes,
          created_at,
          updated_at,
          universities!inner(name),
          university_programs(name)
        `)
        .single();

      if (error) {throw error;}
      
      return {
        id: data.id,
        user_id: data.user_id,
        university_id: data.university_id,
        program_id: data.program_id,
        university_name: data.universities.name,
        program_name: data.university_programs?.name || 'Graduate Program',
        application_status: 'not_started',
        priority: data.priority,
        application_deadline: data.application_deadline,
        decision_date: null,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating application:', error);
      return null;
    }
  }

  /**
   * Delete an application
   */
  async deleteApplication(applicationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('selected_universities')
        .delete()
        .eq('id', applicationId);

      if (error) {throw error;}
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  }

  /**
   * Get requirements for an application
   */
  async getApplicationRequirements(selectedUniversityId: string): Promise<ApplicationRequirement[]> {
    try {
      const { data, error } = await supabase
        .from('application_requirements')
        .select('*')
        .eq('application_id', selectedUniversityId)
        .order('is_required', { ascending: false });

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error fetching requirements:', error);
      return [];
    }
  }

  /**
   * Create a requirement for an application
   */
  async createRequirement(selectedUniversityId: string, requirementData: Omit<ApplicationRequirement, 'id' | 'application_id' | 'created_at' | 'updated_at'>): Promise<ApplicationRequirement | null> {
    try {
      const { data, error } = await supabase
        .from('application_requirements')
        .insert({
          application_id: selectedUniversityId,
          ...requirementData
        })
        .select()
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {
      console.error('Error creating requirement:', error);
      return null;
    }
  }

  /**
   * Update a requirement
   */
  async updateRequirement(requirementId: string, updates: Partial<ApplicationRequirement>): Promise<ApplicationRequirement | null> {
    try {
      const { data, error } = await supabase
        .from('application_requirements')
        .update(updates)
        .eq('id', requirementId)
        .select()
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {
      console.error('Error updating requirement:', error);
      return null;
    }
  }

  /**
   * Get financial information for an application from selected_universities
   */
  async getApplicationFinances(selectedUniversityId: string): Promise<ApplicationFinance[]> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .select('id, tuition_offered, financial_aid_offered, scholarship_offered, created_at, updated_at')
        .eq('id', selectedUniversityId)
        .single();

      if (error) {throw error;}
      
      // Convert to finance format
      const finances: ApplicationFinance[] = [];
      if (data.tuition_offered) {
        finances.push({
          id: `${data.id}-tuition`,
          application_id: data.id,
          expense_type: 'application_fee',
          amount: data.tuition_offered,
          currency: 'USD',
          paid: false,
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      }
      if (data.financial_aid_offered) {
        finances.push({
          id: `${data.id}-aid`,
          application_id: data.id,
          expense_type: 'other',
          amount: data.financial_aid_offered,
          currency: 'USD',
          paid: false,
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      }
      if (data.scholarship_offered) {
        finances.push({
          id: `${data.id}-scholarship`,
          application_id: data.id,
          expense_type: 'other',
          amount: data.scholarship_offered,
          currency: 'USD',
          paid: false,
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      }
      
      return finances;
    } catch (error) {
      console.error('Error fetching finances:', error);
      return [];
    }
  }

  /**
   * Update financial information in selected_universities
   */
  async createFinance(selectedUniversityId: string, financeData: Omit<ApplicationFinance, 'id' | 'application_id' | 'created_at' | 'updated_at'>): Promise<ApplicationFinance | null> {
    try {
      const updateData: any = {};
      
      // Map finance data to selected_universities fields
      if (financeData.expense_type === 'application_fee' || financeData.expense_type === 'other') {
        updateData.tuition_offered = financeData.amount;
      }
      
      const { data, error } = await supabase
        .from('selected_universities')
        .update(updateData)
        .eq('id', selectedUniversityId)
        .select('id, created_at, updated_at')
        .single();

      if (error) {throw error;}
      
      return {
        id: `${data.id}-${financeData.expense_type}`,
        application_id: applicationId,
        expense_type: financeData.expense_type,
        amount: financeData.amount,
        currency: financeData.currency,
        paid: financeData.paid,
        payment_date: financeData.payment_date,
        notes: financeData.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating finance record:', error);
      return null;
    }
  }

  /**
   * Get application statistics for a user
   */
  async getApplicationStats(userId: string): Promise<ApplicationStats> {
    try {
      const applications = await this.getUserApplications(userId);
      
      const stats: ApplicationStats = {
        total_applications: applications.length,
        by_status: {},
        upcoming_deadlines: 0,
        total_costs: 0,
        paid_costs: 0
      };

      // Calculate stats from applications
      applications.forEach(app => {
        stats.by_status[app.application_status] = (stats.by_status[app.application_status] || 0) + 1;
        
        // Count upcoming deadlines (within 30 days)
        const deadline = new Date(app.application_deadline);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        if (deadline <= thirtyDaysFromNow && deadline >= now) {
          stats.upcoming_deadlines++;
        }
      });

      // Get financial stats
      for (const app of applications) {
        const finances = await this.getApplicationFinances(app.id);
        finances.forEach(finance => {
          stats.total_costs += finance.amount;
          if (finance.paid) {
            stats.paid_costs += finance.amount;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        total_applications: 0,
        by_status: {},
        upcoming_deadlines: 0,
        total_costs: 0,
        paid_costs: 0
      };
    }
  }

  /**
   * Get all requirements for a user across all applications
   */
  async getAllUserRequirements(userId: string): Promise<ApplicationRequirement[]> {
    try {
      // Get all selected_universities for this user first
      const { data: userApps, error: appsError } = await supabase
        .from('selected_universities')
        .select('id')
        .eq('user_id', userId);

      if (appsError) {throw appsError;}
      
      if (!userApps || userApps.length === 0) {
        return [];
      }

      // Then get requirements for those applications
      const appIds = userApps.map(app => app.id);
      const { data, error } = await supabase
        .from('application_requirements')
        .select('*')
        .in('application_id', appIds)
        .order('due_date', { ascending: true });

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error fetching all requirements:', error);
      return [];
    }
  }

  /**
   * Get all finances for a user across all applications
   */
  async getAllUserFinances(userId: string): Promise<ApplicationFinance[]> {
    try {
      const applications = await this.getUserApplications(userId);
      const allFinances: ApplicationFinance[] = [];
      
      for (const app of applications) {
        const finances = await this.getApplicationFinances(app.id);
        allFinances.push(...finances);
      }
      
      return allFinances.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching all finances:', error);
      return [];
    }
  }
}

export const applicationTrackingService = new ApplicationTrackingService();
export default applicationTrackingService;