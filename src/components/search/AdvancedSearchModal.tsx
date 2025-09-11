import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAdvancedSearch, SearchFilters, SearchResult } from '@/services/searchService';
import SearchFiltersComponent from './SearchFilters';

interface AdvancedSearchModalProps {
  children: React.ReactNode;
  initialQuery?: string;
  searchType?: 'all' | 'universities' | 'mentors' | 'content';
  onResultSelect?: (result: any) => void;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  children,
  initialQuery = '',
  searchType = 'all',
  onResultSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'search' | 'filters'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    searchUniversities,
    searchMentors,
    searchContent,
    globalSearch,
    intelligentSearch,
    getPopularSearches,
    getSearchSuggestions
  } = useAdvancedSearch();

  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  });

  // Load suggestions and popular searches
  useEffect(() => {
    if (query.length > 1) {
      const suggestions = getSearchSuggestions(query, 5);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, getSearchSuggestions]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim()) {return;}

      setIsLoading(true);
      try {
        let searchResults;
        
        if (searchType === 'all') {
          searchResults = await globalSearch(searchQuery, searchFilters);
        } else if (searchType === 'universities') {
          searchResults = await searchUniversities({ ...searchFilters, query: searchQuery });
        } else if (searchType === 'mentors') {
          searchResults = await searchMentors({ ...searchFilters, query: searchQuery });
        } else {
          searchResults = await searchContent({ ...searchFilters, query: searchQuery });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [searchType, searchUniversities, searchMentors, searchContent, globalSearch]
  );

  // Handle search
  const handleSearch = () => {
    setShowSuggestions(false);
    debouncedSearch(query, filters);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    debouncedSearch(suggestion, filters);
  };

  // Handle filter changes
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (query.trim()) {
      debouncedSearch(query, updatedFilters);
    }
  };

  // Popular searches
  const popularSearches = getPopularSearches(8);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for universities, mentors, or content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2"
                autoFocus
              />
              <Button
                onClick={handleSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                Search
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Searches */}
          {!query && popularSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Popular searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSuggestionClick(search.term)}
                  >
                    {search.term} ({search.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'filters')} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Results</TabsTrigger>
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 overflow-y-auto">
              <SearchResults 
                results={results} 
                isLoading={isLoading} 
                searchType={searchType}
                onResultSelect={onResultSelect}
              />
            </TabsContent>

            <TabsContent value="filters" className="flex-1 overflow-y-auto">
              <SearchFiltersComponent 
                filters={filters} 
                onFiltersChange={updateFilters}
                searchType={searchType}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Search Results Component
interface SearchResultsProps {
  results: any;
  isLoading: boolean;
  searchType: string;
  onResultSelect?: (result: any) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  isLoading, 
  searchType, 
  onResultSelect 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center text-gray-500 py-8">
        Enter a search query to see results
      </div>
    );
  }

  if (searchType === 'all') {
    return (
      <div className="space-y-6">
        {results.universities?.items?.length > 0 && (
          <SearchSection 
            title="Universities" 
            items={results.universities.items}
            totalCount={results.universities.totalCount}
            onResultSelect={onResultSelect}
          />
        )}
        {results.mentors?.items?.length > 0 && (
          <SearchSection 
            title="Mentors" 
            items={results.mentors.items}
            totalCount={results.mentors.totalCount}
            onResultSelect={onResultSelect}
          />
        )}
        {results.content?.items?.length > 0 && (
          <SearchSection 
            title="Content" 
            items={results.content.items}
            totalCount={results.content.totalCount}
            onResultSelect={onResultSelect}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {results.totalCount} results ({results.searchTime}ms)
        </span>
      </div>
      
      <div className="space-y-3">
        {results.items?.map((item: any, index: number) => (
          <SearchResultCard 
            key={index} 
            item={item} 
            searchType={searchType}
            onClick={() => onResultSelect?.(item)}
          />
        ))}
      </div>

      {results.items?.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No results found. Try adjusting your search terms or filters.
        </div>
      )}
    </div>
  );
};

// Search Section Component
interface SearchSectionProps {
  title: string;
  items: any[];
  totalCount: number;
  onResultSelect?: (result: any) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  title,
  items,
  totalCount,
  onResultSelect
}) => (
  <div>
    <h3 className="font-semibold mb-2">
      {title} ({totalCount})
    </h3>
    <div className="space-y-2">
      {items.slice(0, 3).map((item, index) => (
        <SearchResultCard 
          key={index} 
          item={item} 
          searchType={title.toLowerCase()}
          onClick={() => onResultSelect?.(item)}
        />
      ))}
    </div>
  </div>
);

// Search Result Card Component
interface SearchResultCardProps {
  item: any;
  searchType: string;
  onClick?: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ 
  item, 
  searchType,
  onClick 
}) => (
  <div 
    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-sm">
          {item.name || item.title || item.university_name}
        </h4>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {item.description || item.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {item.location && (
            <Badge variant="outline" className="text-xs">
              {item.location}
            </Badge>
          )}
          {item.program_type && (
            <Badge variant="outline" className="text-xs">
              {item.program_type}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default AdvancedSearchModal;