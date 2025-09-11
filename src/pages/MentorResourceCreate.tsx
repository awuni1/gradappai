import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ArrowLeft, 
  Upload, 
  Save, 
  Eye, 
  Users, 
  Lock, 
  Globe, 
  UserCheck,
  X,
  Plus,
  AlertCircle,
  BookOpen,
  Video,
  Presentation,
  CheckSquare,
  FileImage,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface MentorResource {
  id?: string;
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
  language: string;
  prerequisites: string[];
  learning_outcomes: string[];
  estimated_time_minutes: number;
  is_featured: boolean;
}

const MentorResourceCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mentees, setMentees] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newLearningOutcome, setNewLearningOutcome] = useState('');
  
  const [formData, setFormData] = useState<MentorResource>({
    title: '',
    description: '',
    category: 'guide',
    subcategory: '',
    file_url: '',
    file_type: '',
    file_size: 0,
    thumbnail_url: '',
    access_level: 'mentees_only',
    specific_mentee_ids: [],
    tags: [],
    language: 'en',
    prerequisites: [],
    learning_outcomes: [],
    estimated_time_minutes: 30,
    is_featured: false
  });

  const categories = [
    { value: 'template', label: 'Template', icon: FileText },
    { value: 'guide', label: 'Guide', icon: BookOpen },
    { value: 'example', label: 'Example', icon: Eye },
    { value: 'checklist', label: 'Checklist', icon: CheckSquare },
    { value: 'presentation', label: 'Presentation', icon: Presentation },
    { value: 'worksheet', label: 'Worksheet', icon: FileImage },
    { value: 'other', label: 'Other', icon: Lightbulb }
  ];

  const subcategories = {
    template: ['Personal Statement', 'CV/Resume', 'Cover Letter', 'Research Proposal', 'Email'],
    guide: ['Application Process', 'Research Methods', 'Writing Tips', 'Interview Prep', 'Networking'],
    example: ['Successful Essays', 'Strong CVs', 'Research Proposals', 'Cover Letters', 'Portfolios'],
    checklist: ['Application Requirements', 'Document Review', 'Interview Prep', 'Deadline Tracking'],
    presentation: ['How-to Slides', 'Process Overview', 'Best Practices', 'Case Studies'],
    worksheet: ['Self-Assessment', 'Goal Setting', 'Skill Building', 'Progress Tracking'],
    other: ['Video Content', 'Audio Resources', 'External Links', 'Mixed Media']
  };

  useEffect(() => {
    checkMentorAuth();
    loadMentees();
  }, []);

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

  const loadMentees = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {return;}

      const { data: relationships } = await supabase
        .from('mentorship_relationships')
        .select(`
          mentee_id,
          mentee_profile:user_profiles!mentee_id(display_name, profile_image_url)
        `)
        .eq('mentor_id', authUser.id)
        .eq('status', 'active');

      if (relationships) {
        setMentees(relationships);
      }
    } catch (error) {
      console.error('Error loading mentees:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {return;}

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mentor-resources')
        .upload(fileName, file);

      if (uploadError) {throw uploadError;}

      const { data: { publicUrl } } = supabase.storage
        .from('mentor-resources')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      }));

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.file_url) {
      toast.error('Please fill in all required fields and upload a file');
      return;
    }

    setSaving(true);
    try {
      const resourceData = {
        ...formData,
        mentor_id: user.id,
        published_at: publish ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('mentor_resources')
        .insert([resourceData]);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      toast.success(publish ? 'Resource published successfully!' : 'Resource saved as draft!');
      navigate('/mentor/dashboard');
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim() && !formData.prerequisites.includes(newPrerequisite.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()]
      }));
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (prereqToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(prereq => prereq !== prereqToRemove)
    }));
  };

  const addLearningOutcome = () => {
    if (newLearningOutcome.trim() && !formData.learning_outcomes.includes(newLearningOutcome.trim())) {
      setFormData(prev => ({
        ...prev,
        learning_outcomes: [...prev.learning_outcomes, newLearningOutcome.trim()]
      }));
      setNewLearningOutcome('');
    }
  };

  const removeLearningOutcome = (outcomeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      learning_outcomes: prev.learning_outcomes.filter(outcome => outcome !== outcomeToRemove)
    }));
  };

  const toggleMenteeAccess = (menteeId: string) => {
    setFormData(prev => ({
      ...prev,
      specific_mentee_ids: prev.specific_mentee_ids.includes(menteeId)
        ? prev.specific_mentee_ids.filter(id => id !== menteeId)
        : [...prev.specific_mentee_ids, menteeId]
    }));
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Loading resource creator..."
            position="center"
            className="h-screen"
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                <FileText className="h-8 w-8 text-purple-600" />
                Create Resource
              </h1>
              <p className="text-gray-600 mt-2">Create and share educational resources with your mentees</p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Resource Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, descriptive title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this resource covers and how it helps mentees"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select 
                    value={formData.subcategory} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories[formData.category as keyof typeof subcategories]?.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="time">Estimated Time (minutes)</Label>
                <Input
                  id="time"
                  type="number"
                  value={formData.estimated_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) || 0 }))}
                  placeholder="30"
                  min="1"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Resource File *</Label>
                <div className="mt-2">
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        handleFileUpload(file);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png"
                    className="hidden"
                  />
                  <Label
                    htmlFor="file"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, PPT, XLS, TXT, JPG, PNG (max 100MB)
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
              
              {formData.file_url && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    File uploaded successfully! Ready to save your resource.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="access">Who can access this resource?</Label>
                <Select value={formData.access_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, access_level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public - Anyone can view
                      </div>
                    </SelectItem>
                    <SelectItem value="mentees_only">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        My Mentees Only
                      </div>
                    </SelectItem>
                    <SelectItem value="specific_mentees">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Specific Mentees
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private - Only Me
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.access_level === 'specific_mentees' && (
                <div>
                  <Label>Select Specific Mentees</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {mentees.length > 0 ? (
                      mentees.map((mentee) => (
                        <div key={mentee.mentee_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={mentee.mentee_id}
                            checked={formData.specific_mentee_ids.includes(mentee.mentee_id)}
                            onCheckedChange={() => toggleMenteeAccess(mentee.mentee_id)}
                          />
                          <Label htmlFor={mentee.mentee_id} className="text-sm">
                            {mentee.mentee_profile?.display_name || 'Unknown Mentee'}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No active mentees found</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tags">Add Tags (help with discovery)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prerequisites">What knowledge/skills are needed to use this resource?</Label>
                <div className="flex gap-2">
                  <Input
                    id="prerequisites"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="e.g., Basic understanding of research methods"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <Button type="button" onClick={addPrerequisite} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {formData.prerequisites.length > 0 && (
                <div className="space-y-2">
                  {formData.prerequisites.map((prereq, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1">{prereq}</span>
                      <X
                        className="h-4 w-4 cursor-pointer hover:text-red-500"
                        onClick={() => removePrerequisite(prereq)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="outcomes">What will mentees learn or achieve?</Label>
                <div className="flex gap-2">
                  <Input
                    id="outcomes"
                    value={newLearningOutcome}
                    onChange={(e) => setNewLearningOutcome(e.target.value)}
                    placeholder="e.g., Ability to write compelling personal statements"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningOutcome())}
                  />
                  <Button type="button" onClick={addLearningOutcome} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {formData.learning_outcomes.length > 0 && (
                <div className="space-y-2">
                  {formData.learning_outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1">{outcome}</span>
                      <X
                        className="h-4 w-4 cursor-pointer hover:text-red-500"
                        onClick={() => removeLearningOutcome(outcome)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked as boolean }))}
                />
                <Label htmlFor="featured">Mark as featured resource</Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving || uploading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading || !formData.file_url}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <LoadingSpinner variant="micro" size="xs" className="mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Publish Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorResourceCreate;