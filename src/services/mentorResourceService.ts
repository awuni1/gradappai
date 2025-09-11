import { supabase } from '@/integrations/supabase/client';

export interface MentorResource {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url: string;
  access_level: 'public' | 'mentees_only' | 'specific_mentees' | 'private';
  specific_mentee_ids: string[];
  tags: string[];
  download_count: number;
  view_count: number;
  average_rating: number;
  total_ratings: number;
  is_featured: boolean;
  language: string;
  prerequisites: string[];
  learning_outcomes: string[];
  estimated_time_minutes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  status?: 'all' | 'published' | 'draft';
  access_level?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface ResourceSort {
  field: 'created_at' | 'updated_at' | 'title' | 'download_count' | 'view_count' | 'average_rating';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ResourceStats {
  totalResources: number;
  publishedResources: number;
  draftResources: number;
  totalDownloads: number;
  totalViews: number;
  averageRating: number;
  popularCategories: { category: string; count: number }[];
  recentActivity: { date: string; downloads: number; views: number }[];
}

class MentorResourceService {
  /**
   * Get all resources for a mentor with filtering, sorting, and pagination
   */
  async getAllResources(
    mentorId: string,
    filters?: ResourceFilters,
    sort?: ResourceSort,
    pagination?: PaginationOptions
  ): Promise<{ data: MentorResource[]; count: number; error?: string }> {
    try {
      let query = supabase
        .from('mentor_resources')
        .select('*', { count: 'exact' })
        .eq('mentor_id', mentorId);

      // Apply filters
      if (filters) {
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
        }
        
        if (filters.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        
        if (filters.status) {
          if (filters.status === 'published') {
            query = query.not('published_at', 'is', null);
          } else if (filters.status === 'draft') {
            query = query.is('published_at', null);
          }
        }
        
        if (filters.access_level && filters.access_level !== 'all') {
          query = query.eq('access_level', filters.access_level);
        }
        
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (pagination) {
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit - 1;
        query = query.range(start, end);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching resources:', error);
      return { data: [], count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get a single resource by ID
   */
  async getResourceById(resourceId: string): Promise<{ data: MentorResource | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mentor_resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error fetching resource:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a resource
   */
  async updateResource(
    resourceId: string,
    updates: Partial<MentorResource>
  ): Promise<{ data: MentorResource | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mentor_resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error updating resource:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete a resource and its associated file
   */
  async deleteResource(resourceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the resource to find the file URL
      const { data: resource } = await this.getResourceById(resourceId);
      
      if (resource?.file_url) {
        // Extract file path from URL and delete from storage
        const filePath = resource.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('mentor-resources')
            .remove([`${resource.mentor_id}/${filePath}`]);
        }
      }

      // Delete the database record
      const { error } = await supabase
        .from('mentor_resources')
        .delete()
        .eq('id', resourceId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting resource:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Duplicate a resource
   */
  async duplicateResource(resourceId: string): Promise<{ data: MentorResource | null; error?: string }> {
    try {
      const { data: original } = await this.getResourceById(resourceId);
      
      if (!original) {
        throw new Error('Resource not found');
      }

      // Create a copy with new ID and updated title
      const duplicate = {
        ...original,
        id: undefined, // Let database generate new ID
        title: `${original.title} (Copy)`,
        published_at: null, // Start as draft
        download_count: 0,
        view_count: 0,
        average_rating: 0,
        total_ratings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('mentor_resources')
        .insert([duplicate])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error duplicating resource:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Increment view count for a resource
   */
  async incrementViewCount(resourceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_resource_views', {
        resource_id: resourceId
      });

      if (error) {
        // Fallback to manual increment if RPC doesn't exist
        const { data: resource } = await this.getResourceById(resourceId);
        if (resource) {
          await this.updateResource(resourceId, {
            view_count: resource.view_count + 1
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Increment download count for a resource
   */
  async incrementDownloadCount(resourceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_resource_downloads', {
        resource_id: resourceId
      });

      if (error) {
        // Fallback to manual increment if RPC doesn't exist
        const { data: resource } = await this.getResourceById(resourceId);
        if (resource) {
          await this.updateResource(resourceId, {
            download_count: resource.download_count + 1
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get resource analytics and statistics
   */
  async getResourceStats(mentorId: string): Promise<{ data: ResourceStats | null; error?: string }> {
    try {
      const { data: resources, error } = await supabase
        .from('mentor_resources')
        .select('*')
        .eq('mentor_id', mentorId);

      if (error) {
        throw error;
      }

      if (!resources) {
        return { data: null };
      }

      // Calculate statistics
      const totalResources = resources.length;
      const publishedResources = resources.filter(r => r.published_at !== null).length;
      const draftResources = totalResources - publishedResources;
      const totalDownloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0);
      const totalViews = resources.reduce((sum, r) => sum + (r.view_count || 0), 0);
      
      const ratedResources = resources.filter(r => r.total_ratings > 0);
      const averageRating = ratedResources.length > 0 
        ? ratedResources.reduce((sum, r) => sum + r.average_rating, 0) / ratedResources.length 
        : 0;

      // Popular categories
      const categoryCount: Record<string, number> = {};
      resources.forEach(r => {
        categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
      });
      
      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentResources = resources.filter(r => 
        new Date(r.created_at) >= thirtyDaysAgo
      );

      const recentActivity = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayResources = recentResources.filter(r =>
          r.created_at.startsWith(dateStr)
        );
        
        return {
          date: dateStr,
          downloads: dayResources.reduce((sum, r) => sum + r.download_count, 0),
          views: dayResources.reduce((sum, r) => sum + r.view_count, 0)
        };
      }).reverse();

      const stats: ResourceStats = {
        totalResources,
        publishedResources,
        draftResources,
        totalDownloads,
        totalViews,
        averageRating,
        popularCategories,
        recentActivity
      };

      return { data: stats };
    } catch (error) {
      console.error('Error fetching resource stats:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Publish or unpublish a resource
   */
  async toggleResourcePublication(
    resourceId: string, 
    publish: boolean
  ): Promise<{ data: MentorResource | null; error?: string }> {
    try {
      const updates: Partial<MentorResource> = {
        published_at: publish ? new Date().toISOString() : null
      };

      return await this.updateResource(resourceId, updates);
    } catch (error) {
      console.error('Error toggling resource publication:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Bulk operations on multiple resources
   */
  async bulkUpdateResources(
    resourceIds: string[],
    updates: Partial<MentorResource>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mentor_resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', resourceIds);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error bulk updating resources:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Bulk delete multiple resources
   */
  async bulkDeleteResources(resourceIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all resources to delete their files
      const { data: resources } = await supabase
        .from('mentor_resources')
        .select('file_url, mentor_id')
        .in('id', resourceIds);

      // Delete associated files from storage
      if (resources) {
        const filesToDelete: string[] = [];
        resources.forEach(resource => {
          if (resource.file_url) {
            const fileName = resource.file_url.split('/').pop();
            if (fileName) {
              filesToDelete.push(`${resource.mentor_id}/${fileName}`);
            }
          }
        });

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('mentor-resources')
            .remove(filesToDelete);
        }
      }

      // Delete database records
      const { error } = await supabase
        .from('mentor_resources')
        .delete()
        .in('id', resourceIds);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting resources:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get resources accessible to a specific user (for mentees)
   */
  async getAccessibleResources(
    userId: string,
    mentorId?: string
  ): Promise<{ data: MentorResource[]; error?: string }> {
    try {
      let query = supabase
        .from('mentor_resources')
        .select('*')
        .not('published_at', 'is', null); // Only published resources

      if (mentorId) {
        query = query.eq('mentor_id', mentorId);
      }

      // Add access level filtering
      query = query.or(`access_level.eq.public,access_level.eq.mentees_only,specific_mentee_ids.cs.{${userId}}`);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching accessible resources:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Set up real-time subscription for resource changes
   */
  subscribeToResourceChanges(
    mentorId: string,
    onUpdate: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`mentor_resources_${mentorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_resources',
        filter: `mentor_id=eq.${mentorId}`
      }, onUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const mentorResourceService = new MentorResourceService();
export default mentorResourceService;