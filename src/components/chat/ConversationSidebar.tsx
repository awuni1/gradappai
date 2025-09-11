import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Brain,
  FileText,
  Clock,
  Star
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  cv_file_path?: string;
  cv_analysis?: any;
  is_active: boolean;
  conversation_type?: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  loading: boolean;
  isMobile?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  loading,
  isMobile = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {return 'Just now';}
    if (diffInMinutes < 60) {return `${diffInMinutes}m ago`;}
    if (diffInMinutes < 1440) {return `${Math.floor(diffInMinutes / 60)}h ago`;}
    if (diffInMinutes < 10080) {return `${Math.floor(diffInMinutes / 1440)}d ago`;}
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.cv_analysis) {return <FileText className="h-4 w-4 text-blue-600" />;}
    if (conversation.conversation_type === 'cv_analysis') {return <Brain className="h-4 w-4 text-purple-600" />;}
    return <MessageSquare className="h-4 w-4 text-gray-600" />;
  };

  const getConversationBadge = (conversation: Conversation) => {
    if (conversation.cv_analysis) {
      return <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">CV</Badge>;
    }
    if (conversation.conversation_type === 'cv_analysis') {
      return <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">Analysis</Badge>;
    }
    return null;
  };

  if (isMobile) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <Button size="sm" onClick={onNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversations Dropdown/List */}
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedConversationId === conversation.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getConversationIcon(conversation)}
                      <span className="font-medium text-sm truncate flex-1">
                        {conversation.title}
                      </span>
                      {getConversationBadge(conversation)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button size="sm" onClick={onNewConversation} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    selectedConversationId === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Title and Icon */}
                    <div className="flex items-start gap-2">
                      {getConversationIcon(conversation)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {conversation.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(conversation.updated_at)}
                          </span>
                          {getConversationBadge(conversation)}
                        </div>
                      </div>
                    </div>

                    {/* Preview - could show last message */}
                    {conversation.cv_analysis && (
                      <p className="text-xs text-gray-600 truncate">
                        CV analysis completed
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="font-medium text-gray-600 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start your first university search conversation
                </p>
                <Button size="sm" onClick={onNewConversation} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};