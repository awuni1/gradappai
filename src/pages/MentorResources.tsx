import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  Star,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  SortAsc,
  SortDesc,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import ResourceCard from '@/components/mentor/ResourceCard';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import SEOHead from '@/components/SEOHead';

interface MentorResource {
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

interface ResourceStats {
  totalResources: number;
  publishedResources: number;
  draftResources: number;
  totalDownloads: number;
  totalViews: number;
  averageRating: number;
}

const MentorResources: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [resources, setResources] = useState<MentorResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<MentorResource[]>([]);
  const [stats, setStats] = useState<ResourceStats>({
    totalResources: 0,
    publishedResources: 0,
    draftResources: 0,
    totalDownloads: 0,
    totalViews: 0,
    averageRating: 0
  });
  
  // Filters and UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'template', label: 'Template' },
    { value: 'guide', label: 'Guide' },
    { value: 'example', label: 'Example' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'worksheet', label: 'Worksheet' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    checkMentorAuth();
    loadResources();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterAndSortResources();
  }, [resources, searchTerm, categoryFilter, statusFilter, accessFilter, sortBy]);

  const checkMentorAuth = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        navigate('/auth');
        return;
      }

      // Check if user has mentor role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();

      if (!userRole || userRole.role !== 'mentor') {
        toast.error('Access denied. Mentor privileges required.');
        navigate('/dashboard');
        return;
      }

      setUser(authUser);
    } catch (error) {
      console.error('Mentor auth check failed:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {return;}

      const { data, error } = await supabase
        .from('mentor_resources')
        .select('*')
        .eq('mentor_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setResources(data);
        calculateStats(data);
      } else {
        // Show mock data if table doesn't exist
        const mockResources: MentorResource[] = [
          {
            id: '1',
            mentor_id: authUser.id,
            title: 'Personal Statement Writing Guide',
            description: 'Comprehensive guide for writing compelling personal statements for graduate school applications.',
            category: 'guide',
            subcategory: 'Writing Tips',
            file_url: '/mock/personal-statement-guide.pdf',
            file_type: 'application/pdf',
            file_size: 2048000,
            thumbnail_url: '',
            access_level: 'mentees_only',
            specific_mentee_ids: [],
            tags: ['writing', 'personal statement', 'graduate school'],
            download_count: 45,
            view_count: 123,
            average_rating: 4.7,
            total_ratings: 12,
            is_featured: true,
            language: 'en',
            prerequisites: ['Basic understanding of graduate applications'],
            learning_outcomes: ['Write compelling personal statements', 'Understand what admissions committees look for'],
            estimated_time_minutes: 60,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            mentor_id: authUser.id,
            title: 'CV Template for PhD Applications',
            description: 'Professional CV template specifically designed for PhD program applications.',
            category: 'template',
            subcategory: 'CV/Resume',
            file_url: '/mock/phd-cv-template.docx',
            file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            file_size: 1024000,
            thumbnail_url: '',
            access_level: 'public',
            specific_mentee_ids: [],
            tags: ['cv', 'template', 'phd', 'academic'],
            download_count: 78,
            view_count: 156,
            average_rating: 4.5,
            total_ratings: 8,
            is_featured: false,
            language: 'en',
            prerequisites: [],
            learning_outcomes: ['Create professional academic CV', 'Understand CV structure for PhD applications'],
            estimated_time_minutes: 30,
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            mentor_id: authUser.id,
            title: 'Research Proposal Draft',
            description: 'Work-in-progress research proposal for computer science PhD program.',
            category: 'example',
            subcategory: 'Research Proposals',
            file_url: '/mock/research-proposal-draft.pdf',
            file_type: 'application/pdf',
            file_size: 3072000,
            thumbnail_url: '',
            access_level: 'private',
            specific_mentee_ids: [],
            tags: ['research', 'proposal', 'computer science', 'draft'],
            download_count: 0,
            view_count: 5,
            average_rating: 0,
            total_ratings: 0,
            is_featured: false,
            language: 'en',
            prerequisites: ['Background in computer science'],
            learning_outcomes: ['Understand research proposal structure'],
            estimated_time_minutes: 45,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            published_at: null // Draft
          }
        ];
        setResources(mockResources);
        calculateStats(mockResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load resources');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) {return;}

    const subscription = supabase
      .channel(`mentor_resources_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_resources',
        filter: `mentor_id=eq.${user.id}`
      }, (payload) => {
        console.log('Real-time update:', payload);
        loadResources(); // Reload resources on any change
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const calculateStats = (resourceList: MentorResource[]) => {
    const totalResources = resourceList.length;
    const publishedResources = resourceList.filter(r => r.published_at !== null).length;
    const draftResources = totalResources - publishedResources;
    const totalDownloads = resourceList.reduce((sum, r) => sum + r.download_count, 0);
    const totalViews = resourceList.reduce((sum, r) => sum + r.view_count, 0);
    const ratedResources = resourceList.filter(r => r.total_ratings > 0);
    const averageRating = ratedResources.length > 0 
      ? ratedResources.reduce((sum, r) => sum + r.average_rating, 0) / ratedResources.length 
      : 0;

    setStats({
      totalResources,
      publishedResources,
      draftResources,
      totalDownloads,
      totalViews,
      averageRating
    });
  };

  const filterAndSortResources = () => {
    let filtered = [...resources];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(resource => resource.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        filtered = filtered.filter(resource => resource.published_at !== null);
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter(resource => resource.published_at === null);
      }
    }

    // Apply access level filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(resource => resource.access_level === accessFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'downloads':
          return b.download_count - a.download_count;
        case 'views':
          return b.view_count - a.view_count;
        case 'rating':
          return b.average_rating - a.average_rating;
        default:
          return 0;
      }
    });

    setFilteredResources(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAccessFilter('all');
    setSortBy('newest');
  };

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'mentees_only': return <Users className="h-4 w-4" />;
      case 'specific_mentees': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getAccessLevelLabel = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public': return 'Public';
      case 'mentees_only': return 'My Mentees';
      case 'specific_mentees': return 'Specific Mentees';
      case 'private': return 'Private';
      default: return 'Private';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'template': return <FileText className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'example': return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Loading your resources..."
            position="center"
            className="h-screen"
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Mentor Resources"
        description="Manage and share your educational resources with mentees"
      />
      <AuthenticatedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/mentor/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                My Resources
              </h1>
              <p className="text-gray-600 mt-2">Manage and share your educational resources with mentees</p>
            </div>
            
            <Button
              onClick={() => navigate('/mentor/resources/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Resource
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResources}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{stats.publishedResources}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.draftResources}</p>
                </div>
                <XCircle className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalDownloads}</p>
                </div>
                <Download className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-indigo-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="relative flex-1 min-w-64">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={accessFilter} onValueChange={setAccessFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="mentees_only">My Mentees</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                {filteredResources.length} of {resources.length} resources
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid/List */}
        {filteredResources.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                viewMode={viewMode}
                onUpdate={loadResources}
                onSelect={(resourceId, selected) => {
                  if (selected) {
                    setSelectedResources(prev => [...prev, resourceId]);
                  } else {
                    setSelectedResources(prev => prev.filter(id => id !== resourceId));
                  }
                }}
                isSelected={selectedResources.includes(resource.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No resources found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || accessFilter !== 'all'
                  ? 'Try adjusting your filters to see more resources.'
                  : 'Create your first resource to get started!'}
              </p>
              {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && accessFilter === 'all' && (
                <Button onClick={() => navigate('/mentor/resources/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Resource
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coming Soon Overlay */}
        <ComingSoonOverlay
          feature="Resource Management"
          description="The mentor resource sharing platform is currently being enhanced. Soon you'll be able to upload, organize, and share educational materials with your mentees efficiently."
          expectedDate="Q2 2025"
          features={[
            "Upload and organize teaching materials",
            "Create interactive learning modules",
            "Share resources with specific mentees",
            "Track resource usage and engagement",
            "Collaborative document editing",
            "Resource library and categorization"
          ]}
          onNotifyMe={() => {
            toast.success("We'll notify you when resource management features are ready!");
          }}
          className="absolute inset-0 rounded-lg"
        />
      </div>
    </div>
  );
};

export default MentorResources;