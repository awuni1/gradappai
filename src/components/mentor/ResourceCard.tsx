import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Eye, 
  Download, 
  Star, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Share2, 
  Globe, 
  Users, 
  Lock,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { MentorResource } from '@/services/mentorResourceService';
import { mentorResourceService } from '@/services/mentorResourceService';

interface ResourceCardProps {
  resource: MentorResource;
  viewMode: 'grid' | 'list';
  onUpdate?: () => void;
  onSelect?: (resourceId: string, selected: boolean) => void;
  isSelected?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  viewMode,
  onUpdate,
  onSelect,
  isSelected = false
}) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public': return <Globe className="h-4 w-4 text-green-600" />;
      case 'mentees_only': return <Users className="h-4 w-4 text-blue-600" />;
      case 'specific_mentees': return <Users className="h-4 w-4 text-purple-600" />;
      case 'private': return <Lock className="h-4 w-4 text-gray-600" />;
      default: return <Lock className="h-4 w-4 text-gray-600" />;
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
      case 'checklist': return <CheckCircle className="h-4 w-4" />;
      case 'presentation': return <TrendingUp className="h-4 w-4" />;
      case 'worksheet': return <FileText className="h-4 w-4" />;
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

  const handleView = async () => {
    await mentorResourceService.incrementViewCount(resource.id);
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    }
  };

  const handleDownload = async () => {
    await mentorResourceService.incrementDownloadCount(resource.id);
    if (resource.file_url) {
      const link = document.createElement('a');
      link.href = resource.file_url;
      link.download = resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    }
  };

  const handleEdit = () => {
    navigate(`/mentor/resources/edit/${resource.id}`);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await mentorResourceService.duplicateResource(resource.id);
      if (result.error) {
        toast.error('Failed to duplicate resource');
      } else {
        toast.success('Resource duplicated successfully');
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to duplicate resource');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await mentorResourceService.deleteResource(resource.id);
      if (result.error) {
        toast.error('Failed to delete resource');
      } else {
        toast.success('Resource deleted successfully');
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/resources/${resource.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  const handleTogglePublication = async () => {
    const isPublished = resource.published_at !== null;
    try {
      const result = await mentorResourceService.toggleResourcePublication(
        resource.id,
        !isPublished
      );
      if (result.error) {
        toast.error(`Failed to ${isPublished ? 'unpublish' : 'publish'} resource`);
      } else {
        toast.success(`Resource ${isPublished ? 'unpublished' : 'published'} successfully`);
        onUpdate?.();
      }
    } catch (error) {
      toast.error(`Failed to ${isPublished ? 'unpublish' : 'publish'} resource`);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(resource.id, e.target.checked)}
                  className="rounded border-gray-300"
                />
              )}
              
              <div className="flex items-center gap-3">
                {getCategoryIcon(resource.category)}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{resource.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {resource.category}
                </Badge>
                <Badge 
                  variant={resource.published_at ? "default" : "outline"}
                  className="text-xs"
                >
                  {resource.published_at ? 'Published' : 'Draft'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                {getAccessLevelIcon(resource.access_level)}
                <span className="hidden sm:inline">{getAccessLevelLabel(resource.access_level)}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{resource.download_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{resource.view_count}</span>
                </div>
              </div>
              
              <span className="text-xs">{formatFileSize(resource.file_size)}</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTogglePublication}>
                    {resource.published_at ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {resource.published_at ? 'Unpublish' : 'Publish'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(resource.id, e.target.checked)}
                className="rounded border-gray-300"
              />
            )}
            
            <div className="flex items-center gap-3 min-w-0">
              {getCategoryIcon(resource.category)}
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                  {resource.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {resource.category}
                  </Badge>
                  <Badge 
                    variant={resource.published_at ? "default" : "outline"}
                    className="text-xs"
                  >
                    {resource.published_at ? 'Published' : 'Draft'}
                  </Badge>
                  {resource.is_featured && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePublication}>
                {resource.published_at ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                {resource.published_at ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {resource.description}
        </p>
        
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            {getAccessLevelIcon(resource.access_level)}
            <span>{getAccessLevelLabel(resource.access_level)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{resource.download_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{resource.view_count}</span>
          </div>
          {resource.estimated_time_minutes > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{resource.estimated_time_minutes}m</span>
            </div>
          )}
        </div>
        
        {resource.total_ratings > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {renderStars(resource.average_rating)}
            </div>
            <span className="text-sm text-gray-600">
              {resource.average_rating.toFixed(1)} ({resource.total_ratings})
            </span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {resource.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{resource.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{formatFileSize(resource.file_size)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(resource.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{resource.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Category:</p>
                  <p className="text-gray-600">{resource.category}</p>
                </div>
                <div>
                  <p className="font-medium">Access Level:</p>
                  <p className="text-gray-600">{getAccessLevelLabel(resource.access_level)}</p>
                </div>
                <div>
                  <p className="font-medium">File Size:</p>
                  <p className="text-gray-600">{formatFileSize(resource.file_size)}</p>
                </div>
                <div>
                  <p className="font-medium">Estimated Time:</p>
                  <p className="text-gray-600">{resource.estimated_time_minutes} minutes</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Description:</p>
                <p className="text-gray-600">{resource.description}</p>
              </div>
              
              {resource.prerequisites.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Prerequisites:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {resource.prerequisites.map((prereq, index) => (
                      <li key={index}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {resource.learning_outcomes.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Learning Outcomes:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {resource.learning_outcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleView} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Open Resource
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;