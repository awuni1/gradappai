import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Share2, 
  Edit, 
  Trash2,
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Loader2,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Target,
  Award,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

interface MentorDocumentLibraryProps {
  user: User;
}

interface MentorDocument {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  access_level: 'public' | 'connections' | 'mentees' | 'private';
  tags: string[];
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const MentorDocumentLibrary: React.FC<MentorDocumentLibraryProps> = ({ user }) => {
  const [documents, setDocuments] = useState<MentorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all-categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    access_level: 'connections' as const,
    tags: [] as string[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analytics, setAnalytics] = useState({
    totalDownloads: 0,
    totalViews: 0,
    mostPopular: '',
    recentActivity: 0
  });

  const categories = [
    { id: 'application-templates', label: 'Application Templates', icon: FileText },
    { id: 'cv-resume', label: 'CV & Resume Examples', icon: Briefcase },
    { id: 'interview-prep', label: 'Interview Preparation', icon: Users },
    { id: 'research-guides', label: 'Research Guides', icon: BookOpen },
    { id: 'program-specific', label: 'Program-Specific Resources', icon: GraduationCap },
    { id: 'general-advice', label: 'General Advice', icon: Target },
    { id: 'success-stories', label: 'Success Stories', icon: Award }
  ];

  useEffect(() => {
    loadDocuments();
    loadAnalytics();
  }, [user.id, selectedCategory, searchTerm]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedCategory && selectedCategory !== 'all-categories') {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {throw error;}

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: docs } = await supabase
        .from('documents')
        .select('download_count, view_count, title')
        .eq('owner_id', user.id);

      if (docs) {
        const totalDownloads = docs.reduce((sum, doc) => sum + doc.download_count, 0);
        const totalViews = docs.reduce((sum, doc) => sum + doc.view_count, 0);
        const mostPopular = docs.reduce((prev, current) => 
          (prev.download_count > current.download_count) ? prev : current
        )?.title || 'None';

        setAnalytics({
          totalDownloads,
          totalViews,
          mostPopular,
          recentActivity: docs.length
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadData(prev => ({ ...prev, title: file.name.split('.')[0] }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title || !uploadData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) {throw uploadError;}

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: uploadData.title,
          description: uploadData.description,
          file_path: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category: uploadData.category,
          access_level: uploadData.access_level,
          tags: uploadData.tags,
          owner_id: user.id
        });

      if (insertError) {throw insertError;}

      toast.success('Document uploaded successfully!');
      setShowUploadDialog(false);
      setUploadData({
        title: '',
        description: '',
        category: '',
        access_level: 'connections',
        tags: []
      });
      setSelectedFile(null);
      loadDocuments();
      loadAnalytics();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {throw deleteError;}

      // Delete from storage
      const fileName = filePath.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('documents')
          .remove([`${user.id}/${fileName}`]);
      }

      toast.success('Document deleted successfully');
      loadDocuments();
      loadAnalytics();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleShareDocument = async (documentId: string, title: string) => {
    const shareUrl = `${window.location.origin}/document/${documentId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success(`Share link copied for "${title}"`);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) {return '0 Bytes';}
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {return '📄';}
    if (fileType.includes('word') || fileType.includes('document')) {return '📝';}
    if (fileType.includes('presentation')) {return '📊';}
    if (fileType.includes('spreadsheet')) {return '📈';}
    return '📎';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-gradapp-primary" />
              Mentor Resource Library
            </CardTitle>
            <p className="text-gray-600">
              Share your knowledge and resources with mentees and the community.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradapp-primary">{analytics.totalDownloads}</div>
                <div className="text-sm text-gray-600">Total Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalViews}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{documents.length}</div>
                <div className="text-sm text-gray-600">Resources Shared</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">File</label>
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Resource title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={uploadData.category} 
                      onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Access Level</label>
                    <Select 
                      value={uploadData.access_level} 
                      onValueChange={(value: any) => setUploadData(prev => ({ ...prev, access_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can access</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                        <SelectItem value="mentees">My Mentees Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the resource..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploading || !selectedFile}
                      className="bg-gradapp-primary hover:bg-gradapp-accent"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
          <span className="ml-2 text-gray-600">Loading resources...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => {
            const CategoryIcon = getCategoryIcon(doc.category);
            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradapp-primary/10 rounded-lg flex items-center justify-center">
                        <CategoryIcon className="h-5 w-5 text-gradapp-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-1">
                          {doc.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {categories.find(c => c.id === doc.category)?.label || doc.category}
                        </p>
                      </div>
                    </div>
                    <Badge variant={doc.access_level === 'public' ? 'default' : 'secondary'}>
                      {doc.access_level}
                    </Badge>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {doc.download_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {doc.view_count}
                    </span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {doc.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.file_path, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareDocument(doc.id, doc.title)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {documents.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No resources yet</h3>
            <p className="text-gray-500 mb-6">
              Start building your resource library to help mentees succeed.
            </p>
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload First Resource
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MentorDocumentLibrary;