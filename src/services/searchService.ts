// Advanced Search Service
// Comprehensive search functionality with filters, fuzzy matching, and analytics

import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  // General filters
  query?: string;
  category?: string[];
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  
  // University-specific filters
  location?: string[];
  ranking?: {
    min?: number;
    max?: number;
  };
  tuitionRange?: {
    min?: number;
    max?: number;
  };
  programType?: string[];
  researchAreas?: string[];
  
  // User-specific filters
  userType?: 'student' | 'mentor' | 'all';
  experience?: string[];
  availability?: boolean;
  
  // Content filters
  contentType?: string[];
  difficulty?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  
  // Advanced options
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface SearchResult<T = any> {
  items: T[];
  totalCount: number;
  facets: SearchFacets;
  suggestions: string[];
  searchTime: number;
  page: {
    current: number;
    size: number;
    total: number;
  };
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  locations: { name: string; count: number }[];
  programTypes: { name: string; count: number }[];
}

export interface SearchQuery {
  text: string;
  filters: SearchFilters;
  userId?: string;
  sessionId?: string;
}

class AdvancedSearchService {
  private searchHistory = new Map<string, SearchQuery[]>();
  private popularSearches = new Map<string, number>();
  private searchSuggestions = new Set<string>();

  // Fuzzy search implementation
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private fuzzyMatch(query: string, target: string, threshold = 0.6): boolean {
    const distance = this.calculateLevenshteinDistance(query.toLowerCase(), target.toLowerCase());
    const maxLength = Math.max(query.length, target.length);
    const similarity = (maxLength - distance) / maxLength;
    return similarity >= threshold;
  }

  // Build search query with filters
  private buildSearchQuery(table: string, filters: SearchFilters) {
    let query = supabase.from(table).select('*', { count: 'exact' });

    // Text search
    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,tags.ilike.%${filters.query}%`);
    }

    // Category filters
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }

    // Date range filters
    if (filters.dateRange) {
      query = query.gte('created_at', filters.dateRange.from.toISOString())
                  .lte('created_at', filters.dateRange.to.toISOString());
    }

    // Location filters
    if (filters.location?.length) {
      query = query.in('location', filters.location);
    }

    // Ranking filters
    if (filters.ranking) {
      if (filters.ranking.min !== undefined) {
        query = query.gte('ranking', filters.ranking.min);
      }
      if (filters.ranking.max !== undefined) {
        query = query.lte('ranking', filters.ranking.max);
      }
    }

    // Tuition range filters
    if (filters.tuitionRange) {
      if (filters.tuitionRange.min !== undefined) {
        query = query.gte('tuition', filters.tuitionRange.min);
      }
      if (filters.tuitionRange.max !== undefined) {
        query = query.lte('tuition', filters.tuitionRange.max);
      }
    }

    // Program type filters
    if (filters.programType?.length) {
      query = query.in('program_type', filters.programType);
    }

    // Content type filters
    if (filters.contentType?.length) {
      query = query.in('content_type', filters.contentType);
    }

    // Archived filter
    if (!filters.includeArchived) {
      query = query.neq('status', 'archived');
    }

    // Sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    } else {
      // Default relevance sorting
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    return query;
  }

  // Generate search facets
  private async generateFacets(table: string, baseFilters: SearchFilters): Promise<SearchFacets> {
    const facets: SearchFacets = {
      categories: [],
      tags: [],
      locations: [],
      programTypes: []
    };

    try {
      // Categories facet
      const { data: categories } = await supabase
        .from(table)
        .select('category')
        .not('category', 'is', null);
      
      if (categories) {
        const categoryCount = categories.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        facets.categories = Object.entries(categoryCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      }

      // Similar logic for other facets...
      // Tags facet
      const { data: tags } = await supabase
        .from(table)
        .select('tags')
        .not('tags', 'is', null);

      if (tags) {
        const allTags: string[] = [];
        tags.forEach(item => {
          if (Array.isArray(item.tags)) {
            allTags.push(...item.tags);
          } else if (typeof item.tags === 'string') {
            allTags.push(...item.tags.split(',').map(t => t.trim()));
          }
        });

        const tagCount = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        facets.tags = Object.entries(tagCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20); // Top 20 tags
      }

    } catch (error) {
      console.error('Error generating facets:', error);
    }

    return facets;
  }

  // Generate search suggestions
  private generateSuggestions(query: string, data: any[]): string[] {
    if (!query || query.length < 2) {return [];}

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    data.forEach(item => {
      // Check name field
      if (item.name && item.name.toLowerCase().includes(queryLower)) {
        suggestions.add(item.name);
      }

      // Check description field
      if (item.description) {
        const words = item.description.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.includes(queryLower) && word.length > 3) {
            suggestions.add(word);
          }
        });
      }

      // Check tags
      if (item.tags) {
        const tags = Array.isArray(item.tags) ? item.tags : item.tags.split(',');
        tags.forEach((tag: string) => {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag.includes(queryLower)) {
            suggestions.add(tag.trim());
          }
        });
      }
    });

    return Array.from(suggestions)
      .slice(0, 5)
      .sort((a, b) => {
        // Prioritize exact matches and shorter suggestions
        const aExact = a.toLowerCase() === queryLower;
        const bExact = b.toLowerCase() === queryLower;
        if (aExact && !bExact) {return -1;}
        if (!aExact && bExact) {return 1;}
        return a.length - b.length;
      });
  }

  // Track search analytics
  private trackSearch(query: SearchQuery): void {
    if (query.text && query.text.length > 1) {
      // Update popular searches
      const currentCount = this.popularSearches.get(query.text) || 0;
      this.popularSearches.set(query.text, currentCount + 1);

      // Update search history
      if (query.userId) {
        const userHistory = this.searchHistory.get(query.userId) || [];
        userHistory.push({
          ...query,
          filters: { ...query.filters, searchTime: Date.now() }
        });
        
        // Keep only last 50 searches per user
        if (userHistory.length > 50) {
          userHistory.splice(0, userHistory.length - 50);
        }
        
        this.searchHistory.set(query.userId, userHistory);
      }

      // Add to suggestions
      this.searchSuggestions.add(query.text);
    }
  }

  // Main search method
  public async searchUniversities(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildSearchQuery('university_programs', filters);
      const { data, error, count } = await query;

      if (error) {throw error;}

      const facets = await this.generateFacets('university_programs', filters);
      const suggestions = this.generateSuggestions(filters.query || '', data || []);

      const result: SearchResult = {
        items: data || [],
        totalCount: count || 0,
        facets,
        suggestions,
        searchTime: Date.now() - startTime,
        page: {
          current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
          size: filters.limit || 20,
          total: Math.ceil((count || 0) / (filters.limit || 20))
        }
      };

      // Track analytics
      this.trackSearch({
        text: filters.query || '',
        filters,
        userId: filters.userId,
        sessionId: filters.sessionId
      });

      return result;
    } catch (error) {
      console.error('University search error:', error);
      throw error;
    }
  }

  // Search mentors
  public async searchMentors(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildSearchQuery('user_profiles', {
        ...filters,
        userType: 'mentor'
      });
      
      const { data, error, count } = await query;
      if (error) {throw error;}

      const facets = await this.generateFacets('user_profiles', filters);
      const suggestions = this.generateSuggestions(filters.query || '', data || []);

      return {
        items: data || [],
        totalCount: count || 0,
        facets,
        suggestions,
        searchTime: Date.now() - startTime,
        page: {
          current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
          size: filters.limit || 20,
          total: Math.ceil((count || 0) / (filters.limit || 20))
        }
      };
    } catch (error) {
      console.error('Mentor search error:', error);
      throw error;
    }
  }

  // Search posts/content
  public async searchContent(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildSearchQuery('posts', filters);
      const { data, error, count } = await query;

      if (error) {throw error;}

      const facets = await this.generateFacets('posts', filters);
      const suggestions = this.generateSuggestions(filters.query || '', data || []);

      return {
        items: data || [],
        totalCount: count || 0,
        facets,
        suggestions,
        searchTime: Date.now() - startTime,
        page: {
          current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
          size: filters.limit || 20,
          total: Math.ceil((count || 0) / (filters.limit || 20))
        }
      };
    } catch (error) {
      console.error('Content search error:', error);
      throw error;
    }
  }

  // Global search across multiple tables
  public async globalSearch(query: string, filters: Partial<SearchFilters> = {}): Promise<{
    universities: SearchResult;
    mentors: SearchResult;
    content: SearchResult;
  }> {
    const searchFilters: SearchFilters = {
      ...filters,
      query,
      limit: filters.limit || 5
    };

    const [universities, mentors, content] = await Promise.all([
      this.searchUniversities(searchFilters),
      this.searchMentors(searchFilters),
      this.searchContent(searchFilters)
    ]);

    return { universities, mentors, content };
  }

  // Get search history for a user
  public getUserSearchHistory(userId: string): SearchQuery[] {
    return this.searchHistory.get(userId) || [];
  }

  // Get popular searches
  public getPopularSearches(limit = 10): { term: string; count: number }[] {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  // Get search suggestions based on partial input
  public getSearchSuggestions(partial: string, limit = 5): string[] {
    const partialLower = partial.toLowerCase();
    return Array.from(this.searchSuggestions)
      .filter(suggestion => suggestion.toLowerCase().includes(partialLower))
      .slice(0, limit)
      .sort((a, b) => {
        // Prioritize suggestions that start with the partial
        const aStarts = a.toLowerCase().startsWith(partialLower);
        const bStarts = b.toLowerCase().startsWith(partialLower);
        if (aStarts && !bStarts) {return -1;}
        if (!aStarts && bStarts) {return 1;}
        return a.length - b.length;
      });
  }

  // Advanced search with AI-powered query understanding
  public async intelligentSearch(naturalQuery: string, context: any = {}): Promise<SearchResult> {
    // Parse natural language query into structured filters
    const filters = this.parseNaturalLanguageQuery(naturalQuery, context);
    
    // Determine the most appropriate search method
    if (filters.category?.includes('university') || naturalQuery.includes('university') || naturalQuery.includes('college')) {
      return this.searchUniversities(filters);
    } else if (filters.userType === 'mentor' || naturalQuery.includes('mentor') || naturalQuery.includes('advisor')) {
      return this.searchMentors(filters);
    } 
      return this.searchContent(filters);
    
  }

  // Parse natural language into search filters
  private parseNaturalLanguageQuery(query: string, context: any): SearchFilters {
    const filters: SearchFilters = { query };
    const queryLower = query.toLowerCase();

    // Extract location
    const locationKeywords = ['in', 'at', 'near', 'around'];
    locationKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}\\s+([a-zA-Z\\s,]+)`, 'i');
      const match = queryLower.match(regex);
      if (match) {
        filters.location = [match[1].trim()];
      }
    });

    // Extract program type
    if (queryLower.includes('phd') || queryLower.includes('doctorate')) {
      filters.programType = ['PhD'];
    } else if (queryLower.includes('masters') || queryLower.includes('msc') || queryLower.includes('ma')) {
      filters.programType = ['Masters'];
    }

    // Extract ranking preferences
    const rankingMatch = queryLower.match(/top\s+(\d+)/);
    if (rankingMatch) {
      filters.ranking = { max: parseInt(rankingMatch[1]) };
    }

    // Extract research areas
    const researchKeywords = ['research', 'studying', 'specializing in'];
    researchKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        const parts = queryLower.split(keyword);
        if (parts.length > 1) {
          const researchArea = parts[1].trim().split(/\s+/).slice(0, 3).join(' ');
          filters.researchAreas = [researchArea];
        }
      }
    });

    return filters;
  }
}

// Export singleton instance
export const searchService = new AdvancedSearchService();

// React hook for search functionality
export const useAdvancedSearch = () => {
  return {
    searchUniversities: searchService.searchUniversities.bind(searchService),
    searchMentors: searchService.searchMentors.bind(searchService),
    searchContent: searchService.searchContent.bind(searchService),
    globalSearch: searchService.globalSearch.bind(searchService),
    intelligentSearch: searchService.intelligentSearch.bind(searchService),
    getUserSearchHistory: searchService.getUserSearchHistory.bind(searchService),
    getPopularSearches: searchService.getPopularSearches.bind(searchService),
    getSearchSuggestions: searchService.getSearchSuggestions.bind(searchService)
  };
};