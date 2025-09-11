import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  Star,
  Users,
  Calendar,
  Award,
  Building,
  TrendingUp,
  BookOpen,
  DollarSign
} from 'lucide-react';

export interface FacultyFilters {
  searchTerm: string;
  matchScoreRange: [number, number];
  researchAreas: string[];
  departments: string[];
  tiers: string[];
  availability: {
    acceptingStudents?: boolean;
    fundingAvailable?: boolean;
  };
  contactStatus: string[];
  publicationCount: {
    min?: number;
    max?: number;
  };
  sortBy: 'match_score' | 'name' | 'recent_publications' | 'department' | 'last_updated';
  sortOrder: 'asc' | 'desc';
  showBookmarkedOnly: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  filters: Partial<FacultyFilters>;
}

interface AdvancedFacultyFiltersProps {
  filters: FacultyFilters;
  onFiltersChange: (filters: FacultyFilters) => void;
  availableResearchAreas: string[];
  availableDepartments: string[];
  facultyCount: number;
  totalCount: number;
  presets?: FilterPreset[];
  onSavePreset?: (preset: Omit<FilterPreset, 'id'>) => void;
  showAdvanced?: boolean;
}

const defaultPresets: FilterPreset[] = [
  {
    id: 'highly_compatible',
    name: 'Highly Compatible',
    description: 'Faculty with 80%+ match scores',
    icon: Star,
    filters: {
      matchScoreRange: [80, 100],
      tiers: ['ideal', 'suitable']
    }
  },
  {
    id: 'accepting_students',
    name: 'Accepting Students',
    description: 'Faculty currently accepting new students',
    icon: Users,
    filters: {
      availability: { acceptingStudents: true }
    }
  },
  {
    id: 'well_funded',
    name: 'Well Funded',
    description: 'Faculty with available funding',
    icon: DollarSign,
    filters: {
      availability: { fundingAvailable: true }
    }
  },
  {
    id: 'recently_active',
    name: 'Recently Active',
    description: 'Faculty with recent publications',
    icon: BookOpen,
    filters: {
      publicationCount: { min: 3 },
      sortBy: 'recent_publications',
      sortOrder: 'desc'
    }
  }
];

export const AdvancedFacultyFilters: React.FC<AdvancedFacultyFiltersProps> = ({
  filters,
  onFiltersChange,
  availableResearchAreas,
  availableDepartments,
  facultyCount,
  totalCount,
  presets = defaultPresets,
  onSavePreset,
  showAdvanced = false
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.searchTerm) {count++;}
    if (filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100) {count++;}
    if (filters.researchAreas.length > 0) {count++;}
    if (filters.departments.length > 0) {count++;}
    if (filters.tiers.length > 0) {count++;}
    if (filters.availability.acceptingStudents !== undefined) {count++;}
    if (filters.availability.fundingAvailable !== undefined) {count++;}
    if (filters.contactStatus.length > 0) {count++;}
    if (filters.publicationCount.min || filters.publicationCount.max) {count++;}
    if (filters.showBookmarkedOnly) {count++;}
    
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilters = (newFilters: Partial<FacultyFilters>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      matchScoreRange: [0, 100],
      researchAreas: [],
      departments: [],
      tiers: [],
      availability: {},
      contactStatus: [],
      publicationCount: {},
      sortBy: 'match_score',
      sortOrder: 'desc',
      showBookmarkedOnly: false
    });
  };

  const applyPreset = (preset: FilterPreset) => {
    const newFilters = { ...filters, ...preset.filters };
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (array: string[], value: string, key: keyof FacultyFilters) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    updateFilters({ [key]: newArray });
  };

  const handleMatchScoreChange = (values: number[]) => {
    updateFilters({ matchScoreRange: [values[0], values[1]] as [number, number] });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search faculty, research areas, publications..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value as any })}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match_score">Match Score</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="recent_publications">Publications</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="last_updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="px-3"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{facultyCount}</span> of <span className="font-medium">{totalCount}</span> faculty
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bookmarked-only"
                checked={filters.showBookmarkedOnly}
                onCheckedChange={(checked) => updateFilters({ showBookmarkedOnly: Boolean(checked) })}
              />
              <label htmlFor="bookmarked-only" className="text-sm text-gray-600 cursor-pointer">
                Bookmarked only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Presets */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const IconComponent = preset.icon;
            return (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-3 w-3" />
                {preset.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Advanced Filters</CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Match Score Range */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Match Score: {filters.matchScoreRange[0]}% - {filters.matchScoreRange[1]}%
              </label>
              <Slider
                value={filters.matchScoreRange}
                onValueChange={handleMatchScoreChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Research Areas */}
            <div>
              <label className="text-sm font-medium mb-3 block">Research Areas</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableResearchAreas.map((area) => (
                  <Button
                    key={area}
                    variant={filters.researchAreas.includes(area) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter(filters.researchAreas, area, 'researchAreas')}
                    className="text-xs"
                  >
                    {area}
                  </Button>
                ))}
              </div>
              {filters.researchAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.researchAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => toggleArrayFilter(filters.researchAreas, area, 'researchAreas')}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Departments */}
            <div>
              <label className="text-sm font-medium mb-3 block">Departments</label>
              <div className="flex flex-wrap gap-2">
                {availableDepartments.map((dept) => (
                  <Button
                    key={dept}
                    variant={filters.departments.includes(dept) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter(filters.departments, dept, 'departments')}
                    className="text-xs"
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </div>

            {/* Match Tiers */}
            <div>
              <label className="text-sm font-medium mb-3 block">Match Tiers</label>
              <div className="flex gap-2">
                {['ideal', 'suitable', 'possible'].map((tier) => (
                  <Button
                    key={tier}
                    variant={filters.tiers.includes(tier) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter(filters.tiers, tier, 'tiers')}
                    className="capitalize"
                  >
                    {tier === 'ideal' ? 'Ideal Match' : tier === 'suitable' ? 'Good Match' : 'Possible Match'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Availability Filters */}
            <div>
              <label className="text-sm font-medium mb-3 block">Availability</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accepting-students"
                    checked={filters.availability.acceptingStudents === true}
                    onCheckedChange={(checked) => 
                      updateFilters({
                        availability: {
                          ...filters.availability,
                          acceptingStudents: checked ? true : undefined
                        }
                      })
                    }
                  />
                  <label htmlFor="accepting-students" className="text-sm">
                    Currently accepting students
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="funding-available"
                    checked={filters.availability.fundingAvailable === true}
                    onCheckedChange={(checked) => 
                      updateFilters({
                        availability: {
                          ...filters.availability,
                          fundingAvailable: checked ? true : undefined
                        }
                      })
                    }
                  />
                  <label htmlFor="funding-available" className="text-sm">
                    Has funding available
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Status */}
            <div>
              <label className="text-sm font-medium mb-3 block">Contact Status</label>
              <div className="flex flex-wrap gap-2">
                {['not_contacted', 'interested', 'contacted', 'responded', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={filters.contactStatus.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter(filters.contactStatus, status, 'contactStatus')}
                    className="text-xs capitalize"
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Publication Count */}
            <div>
              <label className="text-sm font-medium mb-3 block">Publication Count</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.publicationCount.min || ''}
                  onChange={(e) => updateFilters({
                    publicationCount: {
                      ...filters.publicationCount,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.publicationCount.max || ''}
                  onChange={(e) => updateFilters({
                    publicationCount: {
                      ...filters.publicationCount,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">publications</span>
              </div>
            </div>

            {/* Save Preset */}
            {onSavePreset && activeFiltersCount > 0 && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt('Enter a name for this filter preset:');
                    if (name) {
                      onSavePreset({
                        name,
                        description: `Custom filter with ${activeFiltersCount} criteria`,
                        icon: Filter,
                        filters
                      });
                    }
                  }}
                >
                  Save Current Filters as Preset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFacultyFilters;