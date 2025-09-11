import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  Send,
  Download,
  Upload,
  Calendar,
  User,
  Star,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentReview {
  id: string;
  document_id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'returned_for_revision';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  document_type: string;
  feedback: string;
  feedback_summary: string;
  annotated_file_url: string;
  revision_count: number;
  review_started_at: string;
  review_completed_at: string;
  due_date: string;
  time_spent_minutes: number;
  rating: number;
  created_at: string;
  updated_at: string;
  document: {
    title: string;
    file_path: string;
    file_type: string;
    file_size: number;
  };
  mentee_profile: {
    display_name: string;
    profile_image_url: string;
    field_of_study: string;
  };
}

const MentorDocumentReviews: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<DocumentReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<DocumentReview | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    checkMentorAuth();
    loadDocumentReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, statusFilter, priorityFilter]);

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

  const loadDocumentReviews = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {return;}

      const { data, error } = await supabase
        .from('document_reviews')
        .select(`
          *,
          document:documents(title, file_path, file_type, file_size),
          mentee_profile:user_profiles!mentee_id(display_name, profile_image_url, field_of_study)
        `)
        .eq('mentor_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading document reviews:', error);
        setReviews([]);
        if (error.code === 'PGRST116') {
          // Table doesn't exist
          toast.error('Database setup incomplete', {
            description: 'Document review system requires database setup. Please contact support.',
          });
        } else {
          toast.error('Failed to load document reviews', {
            description: 'Please try refreshing the page.'
          });
        }
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error loading document reviews:', error);
      toast.error('Failed to load document reviews');
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.mentee_profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(review => review.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(review => review.priority === priorityFilter);
    }

    setFilteredReviews(filtered);
  };

  const handleStartReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('document_reviews')
        .update({
          status: 'in_progress',
          review_started_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      toast.success('Review started successfully!');
      loadDocumentReviews();
    } catch (error) {
      console.error('Error starting review:', error);
      toast.error('Failed to start review');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReview || !feedback.trim()) {return;}

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('document_reviews')
        .update({
          feedback: feedback,
          feedback_summary: feedbackSummary,
          status: reviewStatus,
          review_completed_at: reviewStatus === 'completed' ? new Date().toISOString() : null,
          time_spent_minutes: selectedReview.time_spent_minutes + 30 // Add estimated time
        })
        .eq('id', selectedReview.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      toast.success('Feedback submitted successfully!');
      setSelectedReview(null);
      setFeedback('');
      setFeedbackSummary('');
      setReviewStatus('');
      loadDocumentReviews();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openReviewDialog = (review: DocumentReview) => {
    setSelectedReview(review);
    setFeedback(review.feedback || '');
    setFeedbackSummary(review.feedback_summary || '');
    setReviewStatus(review.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'returned_for_revision': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Eye className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'returned_for_revision': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Loading document reviews..."
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                <FileText className="h-8 w-8 text-orange-600" />
                Document Reviews
              </h1>
              <p className="text-gray-600 mt-2">Review and provide feedback on your mentees' documents</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Pending Reviews</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reviews.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reviews.filter(r => r.status === 'in_progress').length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reviews.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">High Priority</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {reviews.filter(r => r.priority === 'high' || r.priority === 'urgent').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="returned_for_revision">Returned for Revision</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.mentee_profile.profile_image_url} />
                        <AvatarFallback>
                          {review.mentee_profile.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{review.document.title}</h3>
                          <Badge className={getStatusColor(review.status)}>
                            {getStatusIcon(review.status)}
                            <span className="ml-1 capitalize">{review.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(review.priority)}>
                            {review.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{review.mentee_profile.display_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span className="capitalize">{review.document_type.replace('_', ' ')}</span>
                          </div>
                          {review.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {new Date(review.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {review.feedback_summary && (
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                            {review.feedback_summary}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(review.document.file_path, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {review.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartReview(review.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Review
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewDialog(review)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {review.feedback ? 'Edit Feedback' : 'Add Feedback'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review: {selectedReview?.document.title}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Review Status</label>
                              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="returned_for_revision">Return for Revision</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Summary (for student)</label>
                              <Input
                                placeholder="Brief summary of your review..."
                                value={feedbackSummary}
                                onChange={(e) => setFeedbackSummary(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Detailed Feedback</label>
                              <Textarea
                                placeholder="Provide detailed feedback on the document..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={6}
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Annotated Version
                              </Button>
                              <Button
                                onClick={handleSubmitFeedback}
                                disabled={!feedback.trim() || submittingFeedback}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {submittingFeedback ? (
                                  <LoadingSpinner variant="micro" size="xs" className="mr-2" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Submit Feedback
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No document reviews found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'When your mentees submit documents for review, they will appear here.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDocumentReviews;