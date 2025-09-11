import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock, 
  MessageCircle, 
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { connectionRequestService, ConnectionRequest } from '@/services/connectionRequestService';
import ProfileAvatar from '@/components/ui/ProfileAvatar';

interface ConnectionRequestsProps {
  user: User;
}

const ConnectionRequests: React.FC<ConnectionRequestsProps> = ({ user }) => {
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [responseMessages, setResponseMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConnectionRequests();
  }, [user.id]);

  const loadConnectionRequests = async () => {
    try {
      setLoading(true);
      const result = await connectionRequestService.getConnectionRequests(user.id);
      
      if (result.success && result.data) {
        setIncomingRequests(result.data.incoming);
        setOutgoingRequests(result.data.outgoing);
      } else {
        console.error('Failed to load connection requests:', result.error);
        toast.error('Failed to load connection requests');
      }
    } catch (error) {
      console.error('Error loading connection requests:', error);
      toast.error('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setProcessingRequest(requestId);
      
      const result = await connectionRequestService.respondToConnectionRequest(user.id, {
        requestId,
        status,
        responseMessage: responseMessages[requestId]
      });

      if (result.success) {
        // Remove the request from incoming requests
        setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
        setResponseMessages(prev => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
        });
        
        toast.success(`Connection request ${status}!`, {
          description: status === 'accepted' 
            ? 'You are now connected and can start messaging.'
            : 'The request has been declined.'
        });
      } else {
        toast.error(`Failed to ${status} request`, {
          description: result.error
        });
      }
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      toast.error(`Failed to ${status} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      
      const result = await connectionRequestService.cancelConnectionRequest(user.id, requestId);

      if (result.success) {
        // Remove the request from outgoing requests
        setOutgoingRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success('Connection request cancelled');
      } else {
        toast.error('Failed to cancel request', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {return 'Just now';}
    if (diffInHours < 24) {return `${diffInHours}h ago`;}
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {return `${diffInDays}d ago`;}
    return date.toLocaleDateString();
  };

  const renderRequestCard = (request: ConnectionRequest, type: 'incoming' | 'outgoing') => {
    const profile = type === 'incoming' ? request.initiator_profile : request.recipient_profile;
    const isProcessing = processingRequest === request.id;
    const isExpired = new Date(request.expires_at) < new Date();

    return (
      <Card key={request.id} className={`transition-all duration-200 ${isExpired ? 'opacity-60' : 'hover:shadow-md'}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Profile Avatar */}
            <ProfileAvatar
              userId={profile?.user_id}
              displayName={profile?.display_name}
              src={profile?.profile_image_url}
              size="lg"
            />

            {/* Request Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {profile?.display_name || 'Unknown User'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{profile?.field_of_study || 'Not specified'}</span>
                    {profile?.academic_level && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{profile.academic_level}</span>
                      </>
                    )}
                  </div>
                  {profile?.current_institution && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.current_institution}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={
                    request.status === 'pending' ? 'default' :
                    request.status === 'accepted' ? 'success' :
                    request.status === 'declined' ? 'destructive' : 'secondary'
                  }>
                    {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {request.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {request.status === 'declined' && <XCircle className="w-3 h-3 mr-1" />}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  {isExpired && (
                    <Badge variant="outline" className="text-orange-600">
                      Expired
                    </Badge>
                  )}
                </div>
              </div>

              {/* Message */}
              {request.message && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{request.message}</p>
                </div>
              )}

              {/* Response Message */}
              {request.response_message && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-medium">Response:</p>
                  <p className="text-sm text-blue-600">{request.response_message}</p>
                </div>
              )}

              {/* Request Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Sent {formatTimeAgo(request.requested_at)}</span>
                </div>
                {request.responded_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Responded {formatTimeAgo(request.responded_at)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="capitalize">{request.initiator_type} request</span>
                </div>
              </div>

              {/* Actions */}
              {type === 'incoming' && request.status === 'pending' && !isExpired && (
                <div className="space-y-3">
                  {/* Response Message Input */}
                  <Textarea
                    placeholder="Add an optional message with your response..."
                    value={responseMessages[request.id] || ''}
                    onChange={(e) => setResponseMessages(prev => ({
                      ...prev,
                      [request.id]: e.target.value
                    }))}
                    className="text-sm"
                    rows={2}
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRespondToRequest(request.id, 'accepted')}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespondToRequest(request.id, 'declined')}
                      disabled={isProcessing}
                      variant="destructive"
                      size="sm"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {type === 'outgoing' && request.status === 'pending' && !isExpired && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Cancel Request
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gradapp-primary" />
          <p className="text-gray-600">Loading connection requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Connection Requests</h2>
          <p className="text-gray-600">Manage your mentorship connection requests</p>
        </div>
        <Button onClick={loadConnectionRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Incoming Requests */}
        <TabsContent value="incoming" className="space-y-4">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming requests</h3>
                <p className="text-gray-600">
                  You don't have any pending connection requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map(request => renderRequestCard(request, 'incoming'))}
            </div>
          )}
        </TabsContent>

        {/* Outgoing Requests */}
        <TabsContent value="outgoing" className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
                <p className="text-gray-600">
                  You haven't sent any connection requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map(request => renderRequestCard(request, 'outgoing'))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionRequests;