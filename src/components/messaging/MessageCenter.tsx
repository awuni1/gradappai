import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import {
  Send,
  Search,
  Plus,
  Phone,
  Video,
  MoreHorizontal,
  Archive,
  Trash2,
  Edit,
  Reply,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  Users,
  MessageCircle,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { communicationService, type Conversation, type Message } from '../../services/communicationService';
import { notificationService } from '../../services/notificationService';
import { toast } from 'sonner';

interface MessageCenterProps {
  user: User | null;
}

export default function MessageCenter({ user }: MessageCenterProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation && user) {
      loadMessages(activeConversation.id);
      
      // Subscribe to real-time updates for this conversation
      const subscription = communicationService.subscribeToConversation(
        activeConversation.id,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        },
        (updatedMessage) => {
          setMessages(prev => prev.map(m => 
            m.id === updatedMessage.id ? updatedMessage : m
          ));
        },
        (deletedMessageId) => {
          setMessages(prev => prev.filter(m => m.id !== deletedMessageId));
        }
      );

      return () => {
        communicationService.unsubscribeFromConversation(activeConversation.id);
      };
    }
  }, [activeConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) {return;}

    try {
      setLoading(true);
      const { data } = await communicationService.getUserConversations(user.id, {
        limit: 50
      });
      setConversations(data);
      
      // Auto-select first conversation if none selected
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) {return;}

    try {
      const { data } = await communicationService.getConversationMessages(
        conversationId,
        user.id,
        { limit: 50 }
      );
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) {return;}

    try {
      setSending(true);
      
      const { data: message } = await communicationService.sendMessage(
        activeConversation.id,
        user.id,
        newMessage,
        'text',
        undefined,
        replyToMessage?.id
      );

      if (message) {
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        setReplyToMessage(null);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
  };

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.title) {return conversation.title;}
    
    if (conversation.conversation_type === 'direct' && conversation.participants_info) {
      return conversation.participants_info[0]?.display_name || 'Unknown User';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    if (conversation.avatar_url) {return conversation.avatar_url;}
    
    if (conversation.conversation_type === 'direct' && conversation.participants_info) {
      return conversation.participants_info[0]?.profile_image_url;
    }
    
    return undefined;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationTitle(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Please sign in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Direct messaging is coming soon! For now, you can connect with users through the GradNet platform.
                  </p>
                  <Button onClick={() => setShowNewConversation(false)}>
                    Got it
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={getConversationAvatar(conversation)} />
                        <AvatarFallback>
                          {conversation.conversation_type === 'group' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            getConversationTitle(conversation).charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.last_message ? 
                            formatMessageTime(conversation.last_message.created_at) : 
                            formatMessageTime(conversation.created_at)
                          }
                        </span>
                      </div>
                      
                      {conversation.last_message && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.last_message.sender_id === user.id ? 'You: ' : ''}
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={getConversationAvatar(activeConversation)} />
                    <AvatarFallback>
                      {activeConversation.conversation_type === 'group' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        getConversationTitle(activeConversation).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{getConversationTitle(activeConversation)}</h3>
                    <p className="text-sm text-gray-500">
                      {activeConversation.conversation_type === 'direct' ? 'Direct Message' : 'Group Chat'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user.id;
                    const showSender = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                          {showSender && !isOwnMessage && (
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={message.sender?.profile_image_url} />
                                <AvatarFallback className="text-xs">
                                  {(message.sender?.display_name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-700">
                                {message.sender?.display_name || 'Unknown User'}
                              </span>
                            </div>
                          )}
                          
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.reply_to_message_id && (
                              <div className="mb-2 p-2 bg-black/10 rounded text-sm opacity-75">
                                <p className="text-xs">Replying to:</p>
                                <p className="truncate">Original message content...</p>
                              </div>
                            )}
                            
                            <p className="text-sm">{message.content}</p>
                            
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatMessageTime(message.created_at)}
                                {message.is_edited && ' (edited)'}
                              </span>
                              
                              {isOwnMessage && (
                                <div className="flex items-center space-x-1">
                                  {message.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                  ) : (
                                    <Check className="h-3 w-3 text-blue-200" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {replyToMessage && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Replying to {replyToMessage.sender?.display_name}</p>
                      <p className="text-sm truncate">{replyToMessage.content}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyToMessage(null)}>
                      ×
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 relative">
                  <Textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="min-h-[40px] max-h-32 resize-none pr-12"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="absolute right-2 bottom-2"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}