import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import VideoCallInterface from '@/components/video/VideoCallInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Video, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SEOHead from '@/components/SEOHead';
import { videoCallService } from '@/services/videoCallService';

const VideoCall: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, []);

  const checkAuthAndLoadUser = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error('Authentication error');
      }

      if (!session?.user) {
        setError('Please sign in to join the video call');
        setIsAuthenticated(false);
        return;
      }

      setUser(session.user);
      setIsAuthenticated(true);

      // Validate session access if sessionId provided
      if (sessionId) {
        await validateSessionAccess(session.user.id);
      }

    } catch (error) {
      console.error('Error checking authentication:', error);
      setError('Failed to authenticate user');
    } finally {
      setLoading(false);
    }
  };

  const validateSessionAccess = async (userId: string) => {
    try {
      // Use videoCallService directly (now imported statically)
      
      const canJoin = await videoCallService.canUserJoinSession(sessionId!, userId);
      if (!canJoin) {
        setError('You are not authorized to join this session');
        return;
      }

      // Check if session exists and is scheduled
      const session = await videoCallService.getMentoringSession(sessionId!);
      if (!session) {
        setError('Session not found');
        return;
      }

      const now = new Date();
      const scheduledTime = new Date(session.scheduled_at);
      const sessionEnd = new Date(scheduledTime.getTime() + session.duration_minutes * 60000);

      if (now < scheduledTime) {
        const timeUntil = Math.ceil((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
        setError(`Session starts in ${timeUntil} minutes`);
        return;
      }

      if (now > sessionEnd) {
        setError('This session has ended');
        
      }

    } catch (error) {
      console.error('Error validating session access:', error);
      setError('Failed to validate session access');
    }
  };

  const handleSignIn = () => {
    // Redirect to auth page with return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    navigate(`/auth?redirect=${returnUrl}`);
  };

  const handleCallEnd = () => {
    toast.success('Video call ended');
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <LoadingSpinner size="md" message="Loading video call..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Video className="h-5 w-5" />
              Join Video Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to join the video call.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                onClick={handleSignIn}
                className="w-full bg-gradapp-primary hover:bg-gradapp-accent"
              >
                Sign In to Join Call
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Unable to Join Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Video Call"
        description="Join video calls with mentors and fellow students"
        keywords="video call, mentoring session, online meeting, graduate mentorship"
      />
      <div className="min-h-screen bg-gray-900">
      {user && (
        <VideoCallInterface
          user={user}
          sessionId={sessionId}
          onCallEnd={handleCallEnd}
          className="h-screen"
        />
      )}
      </div>
    </>
  );
};

export default VideoCall;