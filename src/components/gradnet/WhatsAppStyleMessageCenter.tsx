import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  MessageCircle, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  Pin,
  CheckCheck,
  Check,
  Clock,
  Circle,
  Plus,
  Filter,
  Download,
  Eye,
  UserPlus,
  Mic,
  Image as ImageIcon,
  Camera,
  FileText,
  ArrowLeft,
  Settings,
  Users,
  VolumeX,
  Volume2,
  Reply,
  Forward,
  Copy,
  X,
  ChevronDown
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { messagingService, Conversation, Message, MessageInput } from '@/services/messagingService';
import { videoCallService } from '@/services/videoCallService';
import { CONSTANTS } from '@/constants';
import './whatsapp-styles.css';

interface WhatsAppStyleMessageCenterProps {
  user: User;
}

const WhatsAppStyleMessageCenter: React.FC<WhatsAppStyleMessageCenterProps> = ({ user }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [profileCache, setProfileCache] = useState<Map<string, any>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  // WhatsApp-style emojis
  const whatsappEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
    '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
    '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👈', '👉', '👆',
    '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦵',
    '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌'
  ];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimized auto-scroll to bottom - only when user is near bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        if (isNearBottom || messages.length <= 1) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations
  useEffect(() => {
    if (user.id) {
      loadConversations();
      
      // Subscribe to conversation list updates
      messagingService.subscribeToConversations(user.id, (updatedConversations) => {
        setConversations(updatedConversations);
      });
    }

    return () => {
      messagingService.unsubscribeAll();
    };
  }, [user.id]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      
      // Subscribe to real-time updates for this conversation
      messagingService.subscribeToConversation(
        selectedConversation,
        (newMessage) => {
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {return prev;}
            return [...prev, newMessage];
          });
          
          if (newMessage.sender_id !== user.id) {
            messagingService.markMessagesAsRead(selectedConversation, user.id);
          }
        },
        (updatedMessage) => {
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      );

      // On mobile, hide conversation list when chat is selected
      if (isMobileView) {
        setShowConversationList(false);
      }
    }

    return () => {
      if (selectedConversation) {
        messagingService.unsubscribeFromConversation(selectedConversation);
      }
    };
  }, [selectedConversation, user.id, isMobileView]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await messagingService.getConversations(user.id);
      console.log('Raw conversations loaded:', convs);
      
      // First, set conversations with placeholder names for immediate display
      const placeholderConvs = convs.map(conv => ({
        ...conv,
        title: conv.conversation_type === 'group' 
          ? conv.title || 'Group Chat'
          : 'Loading...',
        recipientName: conv.conversation_type === 'group' 
          ? conv.title || 'Group Chat'
          : 'Loading...',
        otherParticipantId: conv.conversation_type === 'direct' 
          ? conv.participants.find(p => p !== user.id)
          : undefined
      }));
      
      setConversations(placeholderConvs);
      setLoading(false); // Show UI immediately
      
      // Then load profiles in batch
      await loadProfilesForConversations(placeholderConvs);
      
      if (placeholderConvs.length > 0 && !selectedConversation) {
        setSelectedConversation(placeholderConvs[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  // Optimized batch profile loading
  const loadProfilesForConversations = async (convs: Conversation[]) => {
    if (loadingProfiles) {return;} // Prevent concurrent profile loading
    
    setLoadingProfiles(true);
    try {
      // Get all unique participant IDs that need profiles
      const participantIds = convs
        .filter(conv => conv.conversation_type === 'direct')
        .map(conv => conv.participants.find(p => p !== user.id))
        .filter((id): id is string => Boolean(id) && !profileCache.has(id));

      if (participantIds.length === 0) {
        // All profiles are cached, just update conversations
        updateConversationsWithCachedProfiles(convs);
        setLoadingProfiles(false);
        return;
      }

      console.log('Loading profiles for IDs:', participantIds);

      // Batch load from user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, full_name, profile_picture_url')
        .in('user_id', participantIds);

      console.log('Loaded profiles from user_profiles:', profiles);

      // Update cache with loaded profiles
      const newCache = new Map(profileCache);
      profiles?.forEach(profile => {
        newCache.set(profile.user_id, profile);
      });

      // For missing profiles, try to get basic info from auth
      const missingIds = participantIds.filter(id => 
        !profiles?.some(p => p.user_id === id)
      );

      if (missingIds.length > 0) {
        console.log('Loading fallback data for missing profiles:', missingIds);
        
        // Create fallback profiles for missing users
        for (const id of missingIds) {
          const fallbackProfile = {
            user_id: id,
            display_name: `User ${id.slice(0, 8)}`,
            full_name: null,
            profile_picture_url: null
          };
          newCache.set(id, fallbackProfile);
        }
      }

      setProfileCache(newCache);
      
      // Update conversations with loaded profiles
      updateConversationsWithCachedProfiles(convs, newCache);
      
    } catch (error) {
      console.error('Error loading profiles:', error);
      
      // Create fallback profiles for all missing IDs
      const newCache = new Map(profileCache);
      convs.forEach(conv => {
        if (conv.conversation_type === 'direct') {
          const otherParticipantId = conv.participants.find(p => p !== user.id);
          if (otherParticipantId && !newCache.has(otherParticipantId)) {
            newCache.set(otherParticipantId, {
              user_id: otherParticipantId,
              display_name: `User ${otherParticipantId.slice(0, 8)}`,
              full_name: null,
              profile_picture_url: null
            });
          }
        }
      });
      setProfileCache(newCache);
      updateConversationsWithCachedProfiles(convs, newCache);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const updateConversationsWithCachedProfiles = (convs: Conversation[], cache = profileCache) => {
    const enhancedConvs = convs.map(conv => {
      if (conv.conversation_type === 'direct') {
        const otherParticipantId = conv.participants.find(p => p !== user.id);
        
        if (otherParticipantId) {
          const profile = cache.get(otherParticipantId);
          const recipientName = profile?.display_name || profile?.full_name || `User ${otherParticipantId.slice(0, 8)}`;
          
          return {
            ...conv,
            title: recipientName,
            participantProfile: profile,
            recipientName: recipientName,
            otherParticipantId
          };
        }
      }
      
      // For group conversations
      const groupTitle = conv.title || `Group Chat (${conv.participants.length} members)`;
      return {
        ...conv,
        title: groupTitle,
        recipientName: groupTitle
      };
    });

    console.log('Enhanced conversations with profiles:', enhancedConvs);
    setConversations(enhancedConvs);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      
      const msgs = await messagingService.getMessages(conversationId);
      setMessages(msgs);
      
      // Mark messages as read in background
      messagingService.markMessagesAsRead(conversationId, user.id).catch(console.error);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user.id) {return;}
    
    setSending(true);
    try {
      const messageData: MessageInput = {
        conversation_id: selectedConversation,
        content: newMessage,
        message_type: 'text',
        reply_to_message_id: replyToMessage?.id
      };
      
      const sentMessage = await messagingService.sendMessage(messageData, user.id);
      if (sentMessage) {
        setNewMessage('');
        setReplyToMessage(null);
        setMessages(prev => [...prev, sentMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleBackToConversations = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleLongPress = (messageId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMessages(new Set([messageId]));
    }
  };

  const handleMessageSelect = (messageId: string) => {
    if (selectionMode) {
      const newSelection = new Set(selectedMessages);
      if (newSelection.has(messageId)) {
        newSelection.delete(messageId);
      } else {
        newSelection.add(messageId);
      }
      
      setSelectedMessages(newSelection);
      
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleFileUpload = async (file: File, type: 'file' | 'image') => {
    if (!selectedConversation) {return;}

    try {
      toast.loading('Uploading...');
      
      const fileUrl = await messagingService.uploadMessageFile(file, selectedConversation, user.id);
      
      if (fileUrl) {
        const messageData: MessageInput = {
          conversation_id: selectedConversation,
          content: type === 'image' ? '📷 Photo' : `📎 ${file.name}`,
          message_type: type,
          attachments: {
            fileName: file.name,
            fileUrl: fileUrl,
            fileSize: file.size,
            fileType: file.type
          }
        };
        
        const sentMessage = await messagingService.sendMessage(messageData, user.id);
        if (sentMessage) {
          toast.dismiss();
          toast.success('File sent!');
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.dismiss();
      toast.error('Failed to upload file');
    }
  };

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Optimized user search with debouncing and caching
  const [searchCache, setSearchCache] = useState<Map<string, any[]>>(new Map());
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchUsers = async (query: string) => {
    setSearchUsers(query);
    
    if (!query || query.trim().length < 2) {
      setFoundUsers([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      setFoundUsers(searchCache.get(cacheKey) || []);
      return;
    }

    // Debounce search
    const newTimeout = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        // Single optimized query with ILIKE for partial matching
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, full_name, profile_picture_url, field_of_study, academic_level')
          .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,field_of_study.ilike.%${query}%`)
          .neq('user_id', user.id)
          .limit(20); // Increased limit for better UX

        console.log('User search results:', profiles);
        
        const users = profiles || [];
        
        // Cache the results
        const newCache = new Map(searchCache);
        newCache.set(cacheKey, users);
        setSearchCache(newCache);
        
        setFoundUsers(users);
      } catch (error) {
        console.error('Error searching users:', error);
        setFoundUsers([]);
        toast.error('Failed to search users');
      } finally {
        setSearchingUsers(false);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(newTimeout);
  };

  const handleStartConversation = async (targetUserId: string, targetUserName: string) => {
    try {
      console.log('Starting conversation with:', targetUserId, targetUserName);
      
      // Optimistically close dialog and show loading
      setShowNewConversation(false);
      setSearchUsers('');
      setFoundUsers([]);
      
      // Show loading state
      toast.loading('Starting conversation...');
      
      const conversationId = await messagingService.startConversationWithUser(user.id, targetUserId);
      console.log('Conversation created/found:', conversationId);
      
      if (conversationId) {
        // Add to profile cache
        const newCache = new Map(profileCache);
        if (!newCache.has(targetUserId)) {
          newCache.set(targetUserId, {
            user_id: targetUserId,
            display_name: targetUserName,
            full_name: targetUserName,
            profile_picture_url: null
          });
          setProfileCache(newCache);
        }
        
        // Optimistically add conversation to list
        const newConversation: Conversation = {
          id: conversationId,
          participants: [user.id, targetUserId],
          conversation_type: 'direct',
          is_archived: false,
          created_by: user.id,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          title: targetUserName,
          recipientName: targetUserName,
          otherParticipantId: targetUserId,
          participantProfile: newCache.get(targetUserId),
          last_message_content: '',
          unread_count: 0
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(conversationId);
        setMessages([]);
        
        toast.dismiss();
        toast.success(`Started conversation with ${targetUserName}`);
        
        // Load messages in background
        loadMessages(conversationId).catch(console.error);
      } else {
        toast.dismiss();
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.dismiss();
      toast.error('Failed to start conversation');
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } 
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.last_message_content) {return 'No messages yet';}
    
    if (conv.last_message_content.startsWith('📷')) {return '📷 Photo';}
    if (conv.last_message_content.startsWith('📎')) {return '📎 File';}
    if (conv.last_message_content.startsWith('🎤')) {return '🎤 Voice message';}
    
    return conv.last_message_content.length > 30 
      ? conv.last_message_content.substring(0, 30) + '...'
      : conv.last_message_content;
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className={`flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden ${
      isMobileView ? 'flex-col' : ''
    }`}>
      
      {/* Conversations List - WhatsApp Style */}
      <div className={`${
        isMobileView 
          ? showConversationList ? 'flex' : 'hidden'
          : 'flex w-1/3'
      } flex-col bg-white border-r border-gray-200`}>
        
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-white text-[#008069]">
                {user.user_metadata?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">Chats</h2>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={() => setShowNewConversation(true)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>New Group</DropdownMenuItem>
                <DropdownMenuItem>Starred Messages</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white rounded-full border-gray-300"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" message="Loading chats..." />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedConversation === conv.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.participantProfile?.profile_picture_url} />
                    <AvatarFallback className="bg-gray-300 text-gray-600">
                      {(conv.recipientName || conv.title || 'C').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator */}
                  {conv.otherParticipantId && onlineUsers.has(conv.otherParticipantId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {loadingProfiles && conv.recipientName === 'Loading...' ? (
                        <>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </>
                      ) : (
                        conv.recipientName || conv.title || 'Unknown Contact'
                      )}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conv.last_message_at ? formatMessageTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {getLastMessagePreview(conv)}
                    </p>
                    
                    {conv.unread_count > 0 && (
                      <Badge className="bg-[#008069] text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center ml-2">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-600 mb-2">No chats yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start a conversation with your mentors and peers
              </p>
              <Button 
                onClick={() => setShowNewConversation(true)}
                className="bg-[#008069] hover:bg-[#006b5b]"
              >
                Start New Chat
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - WhatsApp Style */}
      <div className={`${
        isMobileView 
          ? showConversationList ? 'hidden' : 'flex'
          : 'flex flex-1'
      } flex-col`}>
        
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#f0f2f5] border-b border-gray-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBackToConversations}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConv.participantProfile?.profile_picture_url} />
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {(selectedConv.recipientName || selectedConv.title || 'C').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConv.recipientName || selectedConv.title || 'Unknown Contact'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedConv.otherParticipantId && onlineUsers.has(selectedConv.otherParticipantId) 
                      ? 'Online' 
                      : 'Last seen recently'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {/* Handle video call */}}
                >
                  <Video className="h-5 w-5 text-gray-600" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {/* Handle phone call */}}
                >
                  <Phone className="h-5 w-5 text-gray-600" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Contact Info</DropdownMenuItem>
                    <DropdownMenuItem>Select Messages</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete Chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Selection Mode Header */}
            {selectionMode && (
              <div className="bg-[#008069] text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedMessages(new Set());
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <span>{selectedMessages.size} selected</span>
                </div>
                
                <div className="flex gap-2">
                  {selectedMessages.size === 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const messageId = Array.from(selectedMessages)[0];
                        const message = messages.find(m => m.id === messageId);
                        if (message) {handleReply(message);}
                      }}
                    >
                      <Reply className="h-5 w-5" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20"
                  >
                    <Forward className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area with WhatsApp Background */}
            <div className="flex-1 overflow-hidden relative whatsapp-bg">
              <ScrollArea className="h-full p-4">
                <div className="space-y-2">
                  {/* Reply Preview */}
                  {replyToMessage && (
                    <div className="bg-white/90 rounded-lg p-3 mb-4 border-l-4 border-[#008069]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#008069]">
                          Replying to {replyToMessage.sender_id === user.id ? 'yourself' : (replyToMessage.sender?.display_name || 'Unknown')}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReplyToMessage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {replyToMessage.content}
                      </p>
                    </div>
                  )}

                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isMyMessage = message.sender_id === user.id;
                      const showDateSeparator = index === 0 || 
                        new Date(message.created_at).toDateString() !== 
                        new Date(messages[index - 1].created_at).toDateString();
                      
                      return (
                        <div key={message.id}>
                          {/* Date Separator */}
                          {showDateSeparator && (
                            <div className="flex justify-center my-4">
                              <div className="bg-white/80 px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm">
                                {new Date(message.created_at).toLocaleDateString([], { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          )}

                          {/* Message */}
                          <div
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-2`}
                            onClick={() => handleMessageSelect(message.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleLongPress(message.id);
                            }}
                          >
                            <div 
                              className={`max-w-[70%] group cursor-pointer ${
                                selectedMessages.has(message.id) ? 'ring-2 ring-[#008069]' : ''
                              }`}
                            >
                              {/* Reply Reference */}
                              {message.reply_to_message_id && (
                                <div className={`mb-2 p-2 rounded-t-lg border-l-4 text-xs ${
                                  isMyMessage 
                                    ? 'bg-[#dcf8c6] border-green-600' 
                                    : 'bg-white border-gray-400'
                                }`}>
                                  <p className="text-gray-600">
                                    Replying to previous message
                                  </p>
                                </div>
                              )}

                              <div
                                className={`px-3 py-2 rounded-lg shadow-sm relative ${
                                  isMyMessage
                                    ? 'bg-[#dcf8c6] text-gray-900'
                                    : 'bg-white text-gray-900'
                                } ${
                                  message.reply_to_message_id ? 'rounded-t-none' : ''
                                }`}
                              >
                                {/* Message Content */}
                                {message.message_type === 'file' && message.attachments ? (
                                  <div className="space-y-2">
                                    {message.attachments.fileType?.startsWith('image/') ? (
                                      <div className="rounded-lg overflow-hidden max-w-[250px]">
                                        <img 
                                          src={message.attachments.fileUrl} 
                                          alt={message.attachments.fileName}
                                          className="w-full h-auto"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{message.attachments.fileName}</p>
                                          <p className="text-xs text-gray-500">
                                            {(message.attachments.fileSize / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => window.open(message.attachments.fileUrl, '_blank')}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                )}

                                {/* Message Footer */}
                                <div className={`flex items-center gap-1 mt-1 ${
                                  isMyMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className="text-xs text-gray-500">
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                  
                                  {isMyMessage && (
                                    <div className="text-gray-500">
                                      {message.read_by?.length > 1 ? (
                                        <CheckCheck className="h-3 w-3 text-blue-500" />
                                      ) : (
                                        <CheckCheck className="h-3 w-3" />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* WhatsApp-style tail */}
                                <div className={isMyMessage ? 'message-tail-right' : 'message-tail-left'} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : loadingMessages ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="md" message="Loading messages..." />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No messages yet. Say hello! 👋</p>
                    </div>
                  )}
                  
                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start mb-2">
                      <div className="bg-white px-3 py-2 rounded-lg shadow-sm max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input - WhatsApp Style */}
            <div className="bg-[#f0f2f5] p-3">
              <div className="flex items-end gap-2">
                {/* Attachment Button */}
                <Popover open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 hover:bg-gray-200 rounded-full p-2"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="ghost" 
                        className="flex flex-col gap-2 h-auto p-3"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-xs">Photos</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="flex flex-col gap-2 h-auto p-3"
                        onClick={() => {/* Handle camera */}}
                      >
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                          <Camera className="h-4 w-4 text-pink-600" />
                        </div>
                        <span className="text-xs">Camera</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="flex flex-col gap-2 h-auto p-3"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-xs">Document</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="flex flex-col gap-2 h-auto p-3"
                        onClick={() => {/* Handle voice recording */}}
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Mic className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-xs">Audio</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <div className="bg-white rounded-full flex items-center px-4 py-2 shadow-sm">
                    <Textarea
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 border-none resize-none bg-transparent focus:ring-0 text-sm min-h-[20px] max-h-[100px] p-0"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 hover:bg-gray-100 rounded-full p-1 ml-2"
                        >
                          <Smile className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                          {whatsappEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              className="text-xl hover:bg-gray-100 p-2 rounded transition-colors"
                              onClick={() => {
                                setNewMessage(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Send/Voice Button */}
                {newMessage.trim() ? (
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sending}
                    className="bg-[#008069] hover:bg-[#006b5b] rounded-full p-3 min-w-[48px] h-12"
                  >
                    {sending ? (
                      <LoadingSpinner variant="micro" size="xs" />
                    ) : (
                      <Send className="h-5 w-5 text-white" />
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="ghost"
                    className="text-gray-600 hover:bg-gray-200 rounded-full p-3 min-w-[48px] h-12"
                    onMouseDown={() => {/* Start recording */}}
                    onMouseUp={() => {/* Stop recording */}}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              aria-label="Upload file"
              title="Upload file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {handleFileUpload(file, 'file');}
              }}
            />
            
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload image"
              title="Upload image"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {handleFileUpload(file, 'image');}
              }}
            />
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                <svg viewBox="0 0 303 172" className="w-full h-full">
                  <defs>
                    <linearGradient id="a" x1="50%" x2="50%" y1="100%" y2="0%">
                      <stop offset="0%" stopColor="#1fa671"></stop>
                      <stop offset="100%" stopColor="#26d366"></stop>
                    </linearGradient>
                  </defs>
                  <path fill="url(#a)" d="M96.678 20.441s-32.54-2.083-32.54 23.059 28.39 30.318 32.54 30.318c-16.202 8.334-23.976 24.979-23.976 24.979s7.774 33.262 40.314 33.262 40.314-33.262 40.314-33.262-7.774-16.645-23.976-24.979c4.15 0 32.54-5.176 32.54-30.318s-32.54-23.059-32.54-23.059L96.678 20.441z" opacity=".6"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-600 mb-2">GradNet Web</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Send and receive messages without keeping your phone online. 
                Use GradNet on up to 4 linked devices and 1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search for users..."
                value={searchUsers}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchingUsers && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="md" message="Searching..." />
              </div>
            )}
            
            {foundUsers.length > 0 && (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {foundUsers.map((foundUser) => (
                    <div
                      key={foundUser.user_id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleStartConversation(foundUser.user_id, foundUser.display_name)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={foundUser.profile_picture_url} />
                        <AvatarFallback>
                          {foundUser.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{foundUser.display_name}</h4>
                        <p className="text-xs text-gray-600">
                          {foundUser.field_of_study || 'Graduate Student'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppStyleMessageCenter;
