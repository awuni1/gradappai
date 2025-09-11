import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Clock,
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { videoCallService, VideoCallConfig, MeetingSession } from '@/services/videoCallService';
import { User } from '@supabase/supabase-js';

interface VideoCallInterfaceProps {
  user: User;
  sessionId?: string;
  config?: VideoCallConfig;
  onCallEnd?: () => void;
  className?: string;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  user,
  sessionId,
  config,
  onCallEnd,
  className = ''
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<MeetingSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const callStartTime = useRef<Date | null>(null);

  useEffect(() => {
    // Load session data if sessionId provided
    if (sessionId) {
      loadSessionData();
    }

    return () => {
      handleEndCall();
    };
  }, [sessionId]);

  useEffect(() => {
    // Update call duration every second
    let interval: NodeJS.Timeout | null = null;
    
    if (isConnected && callStartTime.current) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime.current!.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }

    return () => {
      if (interval) {clearInterval(interval);}
    };
  }, [isConnected]);

  const loadSessionData = async () => {
    if (!sessionId) {return;}
    
    try {
      const session = await videoCallService.getMentoringSession(sessionId);
      if (session) {
        setSessionData(session);
        
        // Check if user can join this session
        const canJoin = await videoCallService.canUserJoinSession(sessionId, user.id);
        if (!canJoin) {
          toast.error('You are not authorized to join this session');
          
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      toast.error('Failed to load session information');
    }
  };

  const handleJoinCall = async () => {
    setIsLoading(true);
    
    try {
      // Initialize Zoom SDK if not already done
      const initialized = await videoCallService.initializeZoomSDK();
      if (!initialized) {
        throw new Error('Failed to initialize video SDK');
      }

      // Generate or use provided config
      const callConfig: VideoCallConfig = config || {
        topic: sessionData?.session_type || 'GradNet Session',
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        signature: videoCallService.generateZoomSignature(
          sessionData?.zoom_meeting_id || 'default-session',
          user.id
        ),
        sessionKey: sessionData?.zoom_meeting_id || 'default-session',
        userIdentity: user.id
      };

      // Join the session
      const joined = await videoCallService.joinSession(callConfig);
      if (joined) {
        setIsConnected(true);
        callStartTime.current = new Date();
        
        // Update session status if we have a session
        if (sessionId) {
          await videoCallService.updateSessionStatus(sessionId, 'in_progress');
        }

        // Set up video and audio event listeners
        setupMediaEventListeners();
      }
    } catch (error) {
      console.error('Error joining call:', error);
      toast.error('Failed to join video call');
    } finally {
      setIsLoading(false);
    }
  };

  const setupMediaEventListeners = () => {
    const client = videoCallService.getClient();
    if (!client) {return;}

    // Listen for participant events
    client.on('user-added', (payload) => {
      console.log('User added:', payload);
      setParticipants(prev => [...prev, payload]);
    });

    client.on('user-removed', (payload) => {
      console.log('User removed:', payload);
      setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
    });

    // Listen for media events
    client.on('video-active-change', (payload) => {
      console.log('Video status changed:', payload);
      if (payload.userId === user.id) {
        setIsVideoOn(payload.action === 'Start');
      }
    });

    client.on('audio-change', (payload) => {
      console.log('Audio status changed:', payload);
      if (payload.userId === user.id) {
        setIsAudioOn(payload.action === 'Start');
      }
    });
  };

  const handleToggleVideo = async () => {
    try {
      if (isVideoOn) {
        await videoCallService.stopVideo();
        setIsVideoOn(false);
      } else {
        await videoCallService.startVideo();
        setIsVideoOn(true);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast.error('Failed to toggle camera');
    }
  };

  const handleToggleAudio = async () => {
    try {
      if (isAudioOn) {
        await videoCallService.stopAudio();
        setIsAudioOn(false);
      } else {
        await videoCallService.startAudio();
        setIsAudioOn(true);
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      toast.error('Failed to toggle microphone');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await videoCallService.stopScreenShare();
        setIsScreenSharing(false);
        toast.info('Screen sharing stopped');
      } else {
        await videoCallService.startScreenShare();
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  const handleEndCall = async () => {
    try {
      await videoCallService.leaveSession();
      setIsConnected(false);
      setIsVideoOn(false);
      setIsAudioOn(false);
      setIsScreenSharing(false);
      callStartTime.current = null;
      setCallDuration(0);
      
      // Update session status
      if (sessionId) {
        await videoCallService.updateSessionStatus(sessionId, 'completed', {
          session_notes: `Call duration: ${formatDuration(callDuration)}`
        });
      }

      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Video className="h-5 w-5" />
            Video Call
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionData && (
            <div className="text-center space-y-2">
              <Badge variant="outline">{sessionData.session_type}</Badge>
              <p className="text-sm text-gray-600">
                Scheduled: {new Date(sessionData.scheduled_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Duration: {sessionData.duration_minutes} minutes
              </p>
            </div>
          )}
          
          <div className="text-center">
            <Button
              onClick={handleJoinCall}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Join Video Call
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-900 text-white relative ${className}`}>
      {/* Video Container */}
      <div ref={videoContainerRef} className="w-full h-full relative">
        {/* Main video area */}
        <div className="w-full h-full bg-black flex items-center justify-center">
          {isVideoOn ? (
            <div className="w-full h-full">
              {/* Video streams will be rendered here */}
              <div className="text-center text-white">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p>Video Active</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <VideoOff className="h-12 w-12 mx-auto mb-2" />
              <p>Camera is off</p>
            </div>
          )}
        </div>

        {/* Participants sidebar */}
        {participants.length > 0 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Participants ({participants.length + 1})</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">You</span>
              </div>
              {participants.map((participant) => (
                <div key={participant.userId} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {participant.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call duration */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-1">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {formatDuration(callDuration)}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
        <div className="flex justify-center items-center gap-4">
          {/* Audio Toggle */}
          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="sm"
            onClick={handleToggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="sm"
            onClick={handleToggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleScreenShare}
            className="rounded-full w-12 h-12"
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndCall}
            className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;