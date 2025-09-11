import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown,
  Plus, 
  Search, 
  MessageSquare, 
  Brain,
  FileText,
  Clock
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

interface ConversationDropdownProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  loading: boolean;
}

export const ConversationDropdown: React.FC<ConversationDropdownProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
  
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {return 'Just now';}
    if (diffInMinutes < 60) {return `${diffInMinutes} min ago`;}
    if (diffInMinutes < 1440) {return `${Math.floor(diffInMinutes / 60)} hours ago`;}
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
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

  return (
    <div className="flex items-center justify-between w-full">
      {/* Modern Conversation Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-3 min-w-[420px] justify-start h-14 px-5 hover:bg-slate-100/60 transition-all duration-200 border-0 shadow-none rounded-2xl bg-white/70 backdrop-blur-sm"
          >
            {selectedConversation ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  {getConversationIcon(selectedConversation)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-semibold text-slate-800 block truncate text-sm">
                    {selectedConversation.title}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {formatRelativeTime(selectedConversation.updated_at)}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {getConversationBadge(selectedConversation)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-slate-700 block text-sm">
                    {loading ? 'Loading conversations...' : 'Start New Conversation'}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Upload your CV or ask about universities
                  </span>
                </div>
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-96 max-h-[500px] border-0 shadow-xl rounded-2xl bg-white/95 backdrop-blur-sm">
          {/* Modern Search */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-0 bg-slate-50 rounded-xl focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
          
          {/* New Conversation */}
          <div className="px-4 pb-2">
            <Button 
              onClick={onNewConversation} 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-xl font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New University Search
            </Button>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-4 my-2"></div>

          {/* Modern Conversations List */}
          <div className="max-h-80 overflow-y-auto px-2">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-slate-500 font-medium">Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      onConversationSelect(conversation.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 cursor-pointer rounded-xl transition-all duration-200 hover:bg-slate-50 ${
                      selectedConversationId === conversation.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100' 
                        : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-white shadow-sm">
                        {getConversationIcon(conversation)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate text-slate-800">
                            {conversation.title}
                          </span>
                          {getConversationBadge(conversation)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(conversation.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-slate-400">
                  {searchTerm ? 'Try a different search term' : 'Start a new conversation to begin'}
                </p>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Minimal Action Button */}
      <div className="flex items-center gap-3">
        <Button 
          size="sm" 
          onClick={onNewConversation} 
          className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </div>
    </div>
  );
};