import React from 'react';
import { CalendarIcon, MapPin, GraduationCap, DollarSign, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { SearchFilters as SearchFiltersType } from '@/services/searchService';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
  searchType: 'all' | 'universities' | 'mentors' | 'content';
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  searchType
}) => {
  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({ [key]: value });
  };

  const handleArrayFilterChange = (key: keyof SearchFiltersType, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    onFiltersChange({ [key]: newArray });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: [],
      tags: [],
      location: [],
      programType: [],
      researchAreas: [],
      userType: undefined,
      experience: [],
      contentType: [],
      difficulty: [],
      ranking: undefined,
      tuitionRange: undefined,
      duration: undefined,
      dateRange: undefined,
      availability: undefined,
      includeArchived: false
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Search Filters</h3>
        <Button variant="outline" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      {/* General Filters */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {getCategoryOptions(searchType).map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={(filters.category || []).includes(category)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('category', category, checked as boolean)
                  }
                />
                <Label htmlFor={`category-${category}`} className="text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            Date Range
          </Label>
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
          />
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sort By</Label>
            <Select
              value={filters.sortBy || 'relevance'}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                {searchType === 'universities' && (
                  <>
                    <SelectItem value="ranking">Ranking</SelectItem>
                    <SelectItem value="tuition">Tuition</SelectItem>
                  </>
                )}
                {searchType === 'mentors' && (
                  <SelectItem value="experience">Experience</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Order</Label>
            <Select
              value={filters.sortOrder || 'desc'}
              onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* University-specific Filters */}
      {(searchType === 'universities' || searchType === 'all') && (
        <div className="space-y-4">
          <h4 className="font-medium text-base">University Filters</h4>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Other'].map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={(filters.location || []).includes(location)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('location', location, checked as boolean)
                    }
                  />
                  <Label htmlFor={`location-${location}`} className="text-sm">
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Program Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              Program Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {['Masters', 'PhD', 'Certificate', 'Diploma'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`program-${type}`}
                    checked={(filters.programType || []).includes(type)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('programType', type, checked as boolean)
                    }
                  />
                  <Label htmlFor={`program-${type}`} className="text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Star className="h-4 w-4" />
              Ranking Range
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.ranking?.min || 1, filters.ranking?.max || 500]}
                onValueChange={([min, max]) => 
                  handleFilterChange('ranking', { min, max })
                }
                max={500}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Top {filters.ranking?.min || 1}</span>
                <span>Top {filters.ranking?.max || 500}</span>
              </div>
            </div>
          </div>

          {/* Tuition Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Tuition Range (USD)
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.tuitionRange?.min || 0, filters.tuitionRange?.max || 100000]}
                onValueChange={([min, max]) => 
                  handleFilterChange('tuitionRange', { min, max })
                }
                max={100000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${(filters.tuitionRange?.min || 0).toLocaleString()}</span>
                <span>${(filters.tuitionRange?.max || 100000).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Research Areas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Research Areas</Label>
            <div className="grid grid-cols-1 gap-2">
              {getResearchAreas().map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`research-${area}`}
                    checked={(filters.researchAreas || []).includes(area)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('researchAreas', area, checked as boolean)
                    }
                  />
                  <Label htmlFor={`research-${area}`} className="text-sm">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mentor-specific Filters */}
      {(searchType === 'mentors' || searchType === 'all') && (
        <div className="space-y-4">
          <h4 className="font-medium text-base">Mentor Filters</h4>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Experience Level</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Entry Level', 'Mid Level', 'Senior Level', 'Executive'].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`experience-${level}`}
                    checked={(filters.experience || []).includes(level)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('experience', level, checked as boolean)
                    }
                  />
                  <Label htmlFor={`experience-${level}`} className="text-sm">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability"
                checked={filters.availability || false}
                onCheckedChange={(checked) => 
                  handleFilterChange('availability', checked)
                }
              />
              <Label htmlFor="availability" className="text-sm">
                Available for mentoring
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Content-specific Filters */}
      {(searchType === 'content' || searchType === 'all') && (
        <div className="space-y-4">
          <h4 className="font-medium text-base">Content Filters</h4>

          {/* Content Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Content Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Article', 'Video', 'Discussion', 'Resource', 'Guide'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`content-${type}`}
                    checked={(filters.contentType || []).includes(type)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('contentType', type, checked as boolean)
                    }
                  />
                  <Label htmlFor={`content-${type}`} className="text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty</Label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`difficulty-${level}`}
                    checked={(filters.difficulty || []).includes(level)}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('difficulty', level, checked as boolean)
                    }
                  />
                  <Label htmlFor={`difficulty-${level}`} className="text-sm">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Range (for videos/courses) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Duration (minutes)
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.duration?.min || 0, filters.duration?.max || 120]}
                onValueChange={([min, max]) => 
                  handleFilterChange('duration', { min, max })
                }
                max={120}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{filters.duration?.min || 0} min</span>
                <span>{filters.duration?.max || 120} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-base">Advanced Options</h4>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-archived"
              checked={filters.includeArchived || false}
              onCheckedChange={(checked) => 
                handleFilterChange('includeArchived', checked)
              }
            />
            <Label htmlFor="include-archived" className="text-sm">
              Include archived content
            </Label>
          </div>
        </div>

        {/* Results per page */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Results per page</Label>
          <Select
            value={(filters.limit || 20).toString()}
            onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Results per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getCategoryOptions = (searchType: string): string[] => {
  const baseCategories = ['Academic', 'Research', 'Career', 'Networking'];
  
  switch (searchType) {
    case 'universities':
      return [...baseCategories, 'Application', 'Programs', 'Admission'];
    case 'mentors':
      return [...baseCategories, 'Industry', 'Academia', 'Entrepreneurship'];
    case 'content':
      return [...baseCategories, 'Tutorial', 'News', 'Discussion', 'Resource'];
    default:
      return [...baseCategories, 'General'];
  }
};

const getResearchAreas = (): string[] => [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Medicine',
  'Law',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Economics',
  'Political Science',
  'History',
  'Literature',
  'Art & Design',
  'Education',
  'Other'
];

export default SearchFilters;