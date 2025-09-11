// import React, { useState, useEffect } from 'react';
// import { User } from '@supabase/supabase-js';
// import { supabase } from '@/integrations/supabase/client';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { 
//   Search, 
//   MessageCircle, 
//   Send, 
//   Paperclip, 
//   Smile, 
//   MoreVertical,
//   Phone,
//   Video,
//   Star,
//   Archive,
//   Trash2,
//   Pin,
//   CheckCheck,
//   Clock,
//   Circle,
//   Plus,
//   Filter,
//   Download,
//   Eye,
//   UserPlus
// } from 'lucide-react';
// import LoadingSpinner from '@/components/ui/LoadingSpinner';
// import { toast } from 'sonner';
// import { messagingService, Conversation, Message, MessageInput } from '@/services/messagingService';
// import { videoCallService } from '@/services/videoCallService';

// interface MessageCenterProps {
//   user: User;
// }

// const MessageCenter: React.FC<MessageCenterProps> = ({ user }) => {
//   const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [showNewConversation, setShowNewConversation] = useState(false);
//   const [searchUsers, setSearchUsers] = useState('');
//   const [foundUsers, setFoundUsers] = useState<any[]>([]);
//   const [searchingUsers, setSearchingUsers] = useState(false);
//   const [searchResults, setSearchResults] = useState<Message[]>([]);
//   const [searching, setSearching] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   useEffect(() => {
//     if (user.id) {
//       loadConversations();
      
//       // Subscribe to conversation list updates
//       messagingService.subscribeToConversations(user.id, (updatedConversations) => {
//         setConversations(updatedConversations);
//       });
//     }

//     return () => {
//       messagingService.unsubscribeAll();
//     };
//   }, [user.id]);

//   useEffect(() => {
//     if (selectedConversation) {
//       loadMessages(selectedConversation);
      
//       // Subscribe to real-time updates for this conversation
//       messagingService.subscribeToConversation(
//         selectedConversation,
//         (newMessage) => {
//           setMessages(prev => [...prev, newMessage]);
//           // Mark as read if not sent by current user
//           if (newMessage.sender_id !== user.id) {
//             messagingService.markMessagesAsRead(selectedConversation, user.id);
//           }
//         },
//         (updatedMessage) => {
//           setMessages(prev => prev.map(msg => 
//             msg.id === updatedMessage.id ? updatedMessage : msg
//           ));
//         }
//       );
//     }

//     return () => {
//       if (selectedConversation) {
//         messagingService.unsubscribeFromConversation(selectedConversation);
//       }
//     };
//   }, [selectedConversation, user.id]);

//   const loadConversations = async () => {
//     setLoading(true);
//     try {
//       const convs = await messagingService.getConversations(user.id);
//       setConversations(convs);
//       if (convs.length > 0 && !selectedConversation) {
//         setSelectedConversation(convs[0].id);
//       }
//     } catch (error) {
//       console.error('Error loading conversations:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadMessages = async (conversationId: string) => {
//     try {
//       const msgs = await messagingService.getMessages(conversationId);
//       setMessages(msgs);
//       // Mark messages as read
//       await messagingService.markMessagesAsRead(conversationId, user.id);
//     } catch (error) {
//       console.error('Error loading messages:', error);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !selectedConversation || !user.id) {return;}
    
//     setSending(true);
//     try {
//       const messageData: MessageInput = {
//         conversation_id: selectedConversation,
//         content: newMessage,
//         message_type: 'text'
//       };
      
//       const sentMessage = await messagingService.sendMessage(messageData, user.id);
//       if (sentMessage) {
//         setNewMessage('');
//         // Message will be automatically added via real-time subscription
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleTyping = (value: string) => {
//     setNewMessage(value);
    
//     // Simple typing indicator (in a real app, you'd send this to other users)
//     if (value.trim() && !isTyping) {
//       setIsTyping(true);
      
//       // Clear typing indicator after 3 seconds of inactivity
//       setTimeout(() => {
//         setIsTyping(false);
//       }, 3000);
//     }
//   };

//   const formatMessageTime = (dateString: string): string => {
//     const date = new Date(dateString);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const handleStartVideoCall = async (callType: 'audio' | 'video') => {
//     if (!selectedConversation || !user.id) {return;}

//     try {
//       // Get the other participant from the conversation
//       const conversation = conversations.find(c => c.id === selectedConversation);
//       if (!conversation) {return;}

//       const otherParticipantId = conversation.participants.find(p => p !== user.id);
//       if (!otherParticipantId) {return;}

//       // Create a video session
//       const scheduledAt = new Date().toISOString();
//       const session = await videoCallService.createMentoringSession(
//         user.id, // Current user as mentor (can be adjusted based on user role)
//         otherParticipantId,
//         scheduledAt,
//         callType === 'video' ? 'video_call' : 'audio_call',
//         60 // 60 minutes duration
//       );

//       if (session) {
//         // Send a system message about the call
//         const callMessage: MessageInput = {
//           conversation_id: selectedConversation,
//           content: `${callType === 'video' ? 'Video' : 'Audio'} call started`,
//           message_type: 'meeting_link'
//         };

//         await messagingService.sendMessage(callMessage, user.id);

//         // Open video call in new window/tab
//         const callUrl = `/video-call/${session.id}`;
//         window.open(callUrl, '_blank', 'width=1200,height=800');
        
//         toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated!`);
//       }
//     } catch (error) {
//       console.error('Error starting video call:', error);
//       toast.error('Failed to start call');
//     }
//   };


//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file || !selectedConversation) {return;}

//     try {
//       toast.loading('Uploading file...');
      
//       // Upload file to Supabase storage
//       const fileUrl = await messagingService.uploadMessageFile(file, selectedConversation, user.id);
      
//       if (fileUrl) {
//         // Send message with file attachment
//         const messageData: MessageInput = {
//           conversation_id: selectedConversation,
//           content: `📎 ${file.name}`,
//           message_type: 'file',
//           attachments: {
//             fileName: file.name,
//             fileUrl: fileUrl,
//             fileSize: file.size,
//             fileType: file.type
//           }
//         };
        
//         const sentMessage = await messagingService.sendMessage(messageData, user.id);
//         if (sentMessage) {
//           toast.dismiss();
//           toast.success('File uploaded and sent!');
//         }
//       } else {
//         toast.dismiss();
//         toast.error('Failed to upload file');
//       }
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       toast.dismiss();
//       toast.error('Failed to upload file');
//     }
    
//     // Reset file input
//     event.target.value = '';
//   };

//   const searchForUsers = async (query: string) => {
//     if (!query.trim()) {
//       setFoundUsers([]);
//       return;
//     }

//     setSearchingUsers(true);
//     try {
//       const { data, error } = await supabase
//         .from('user_profiles')
//         .select('user_id, display_name, profile_image_url, field_of_study, academic_level')
//         .or(`display_name.ilike.%${query}%,field_of_study.ilike.%${query}%`)
//         .neq('user_id', user.id) // Don't include current user
//         .limit(10);

//       if (error) {throw error;}
//       setFoundUsers(data || []);
//     } catch (error) {
//       console.error('Error searching users:', error);
//       toast.error('Failed to search users');
//     } finally {
//       setSearchingUsers(false);
//     }
//   };

//   const startNewConversation = async (targetUserId: string, targetUserName: string) => {
//     try {
//       // Get or create direct conversation
//       const conversationId = await messagingService.getOrCreateDirectConversation(user.id, targetUserId);
      
//       if (conversationId) {
//         // Refresh conversations list
//         await loadConversations();
        
//         // Select the new conversation
//         setSelectedConversation(conversationId);
        
//         // Close the dialog
//         setShowNewConversation(false);
//         setSearchUsers('');
//         setFoundUsers([]);
        
//         toast.success(`Started conversation with ${targetUserName}`);
//       } else {
//         toast.error('Failed to start conversation');
//       }
//     } catch (error) {
//       console.error('Error starting conversation:', error);
//       toast.error('Failed to start conversation');
//     }
//   };

//   const searchMessages = async (query: string) => {
//     if (!query.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     setSearching(true);
//     try {
//       const results = await messagingService.searchMessages(user.id, query, 20);
//       setSearchResults(results);
//     } catch (error) {
//       console.error('Error searching messages:', error);
//       toast.error('Failed to search messages');
//     } finally {
//       setSearching(false);
//     }
//   };

//   const handleSearchTermChange = (value: string) => {
//     setSearchTerm(value);
    
//     // Debounce search to avoid too many API calls
//     const debounceTimer = setTimeout(() => {
//       searchMessages(value);
//     }, 300);

//     return () => clearTimeout(debounceTimer);
//   };

//   const getMessageStatusIcon = (message: any) => {
//     if (message.sender === 'me') {
//       return message.read ? (
//         <CheckCheck className="h-3 w-3 text-blue-500" />
//       ) : (
//         <CheckCheck className="h-3 w-3 text-gray-400" />
//       );
//     }
//     return null;
//   };

//   const selectedConv = conversations.find(c => c.id === selectedConversation);

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      
//       {/* Conversations List */}
//       <div className="lg:col-span-1">
//         <Card className="h-full">
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <MessageCircle className="h-5 w-5" />
//                 Messages
//               </CardTitle>
//               <div className="flex gap-2">
//                 <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
//                   <DialogTrigger asChild>
//                     <Button size="sm" variant="outline">
//                       <Plus className="h-4 w-4" />
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                       <DialogTitle>Start New Conversation</DialogTitle>
//                     </DialogHeader>
//                     <div className="space-y-4">
//                       <div className="relative">
//                         <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
//                         <Input
//                           placeholder="Search for users..."
//                           value={searchUsers}
//                           onChange={(e) => {
//                             setSearchUsers(e.target.value);
//                             searchForUsers(e.target.value);
//                           }}
//                           className="pl-10"
//                         />
//                       </div>
                      
//                       {searchingUsers && (
//                         <div className="flex items-center justify-center py-4">
//                           <LoadingSpinner size="md" message="Searching users..." />
//                         </div>
//                       )}
                      
//                       {foundUsers.length > 0 && (
//                         <ScrollArea className="h-64">
//                           <div className="space-y-2">
//                             {foundUsers.map((foundUser) => (
//                               <div
//                                 key={foundUser.user_id}
//                                 className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
//                                 onClick={() => startNewConversation(foundUser.user_id, foundUser.display_name)}
//                               >
//                                 <Avatar className="w-10 h-10">
//                                   <AvatarImage src={foundUser.profile_image_url} />
//                                   <AvatarFallback>
//                                     {foundUser.display_name?.charAt(0) || 'U'}
//                                   </AvatarFallback>
//                                 </Avatar>
//                                 <div className="flex-1">
//                                   <h4 className="font-medium text-sm">{foundUser.display_name || 'Unknown User'}</h4>
//                                   <p className="text-xs text-gray-600">
//                                     {foundUser.academic_level} {foundUser.field_of_study && `• ${foundUser.field_of_study}`}
//                                   </p>
//                                 </div>
//                                 <MessageCircle className="h-4 w-4 text-gray-400" />
//                               </div>
//                             ))}
//                           </div>
//                         </ScrollArea>
//                       )}
                      
//                       {searchUsers && !searchingUsers && foundUsers.length === 0 && (
//                         <div className="text-center py-4">
//                           <p className="text-sm text-gray-500">No users found</p>
//                         </div>
//                       )}
//                     </div>
//                   </DialogContent>
//                 </Dialog>
//                 <Button size="sm" variant="outline">
//                   <Filter className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
            
//             {/* Search */}
//             <div className="relative">
//               <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
//               <Input
//                 placeholder="Search messages..."
//                 value={searchTerm}
//                 onChange={(e) => handleSearchTermChange(e.target.value)}
//                 className="pl-10"
//               />
//               {searching && (
//                 <div className="absolute right-3 top-3">
//                   <LoadingSpinner variant="micro" size="xs" />
//                 </div>
//               )}
//             </div>
//           </CardHeader>
          
//           <CardContent className="p-0">
//             <ScrollArea className="h-[500px]">
//               {searchTerm && searchResults.length > 0 ? (
//                 <div className="space-y-1">
//                   <div className="px-4 py-2 bg-gray-50 border-b">
//                     <h4 className="text-sm font-medium text-gray-700">
//                       Search Results ({searchResults.length})
//                     </h4>
//                   </div>
//                   {searchResults.map((message) => (
//                     <div
//                       key={message.id}
//                       className="p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50"
//                       onClick={() => {
//                         setSelectedConversation(message.conversation_id);
//                         setSearchTerm('');
//                         setSearchResults([]);
//                       }}
//                     >
//                       <div className="flex gap-3">
//                         <Avatar className="w-8 h-8">
//                           <AvatarImage src={message.sender?.profile_image_url} />
//                           <AvatarFallback className="text-xs">
//                             {message.sender?.display_name?.charAt(0) || 'U'}
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-1">
//                             <span className="text-sm font-medium">
//                               {message.sender?.display_name || 'Unknown User'}
//                             </span>
//                             <span className="text-xs text-gray-500">
//                               {new Date(message.created_at).toLocaleDateString()}
//                             </span>
//                           </div>
//                           <p className="text-sm text-gray-700 line-clamp-2">
//                             {message.content}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : searchTerm && !searching && searchResults.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
//                   <p className="text-sm text-gray-500">No messages found</p>
//                 </div>
//               ) : loading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <LoadingSpinner size="md" message="Loading conversations..." />
//                 </div>
//               ) : (
//                 <div className="space-y-1">
//                   {conversations.length > 0 ? (
//                     conversations.map((conv) => (
//                       <div
//                         key={conv.id}
//                         className={`p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
//                           selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-gradapp-primary' : ''
//                         }`}
//                         onClick={() => setSelectedConversation(conv.id)}
//                       >
//                         <div className="flex gap-3">
//                           <div className="relative">
//                             <Avatar className="w-12 h-12">
//                               <AvatarFallback>
//                                 {conv.participants.filter(p => p !== user.id)[0]?.charAt(0) || 'U'}
//                               </AvatarFallback>
//                             </Avatar>
//                           </div>
                          
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center justify-between mb-1">
//                               <h4 className="font-medium text-sm truncate">
//                                 {conv.title || `Conversation ${conv.id.slice(0, 8)}`}
//                               </h4>
//                             </div>
                            
//                             <p className="text-xs text-gray-600 mb-1">
//                               {conv.conversation_type} • {conv.participants.length} participants
//                             </p>
                            
//                             <p className="text-sm text-gray-600 truncate">
//                               {conv.description || 'No recent messages'}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8">
//                       <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
//                       <h3 className="font-medium text-gray-600 mb-2">No conversations yet</h3>
//                       <p className="text-sm text-gray-500 mb-4">
//                         Start connecting with mentors and peers to begin conversations
//                       </p>
//                       <Button 
//                         variant="outline" 
//                         size="sm"
//                         onClick={() => setShowNewConversation(true)}
//                       >
//                         <UserPlus className="h-4 w-4 mr-2" />
//                         Start New Conversation
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </ScrollArea>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Chat Area */}
//       <div className="lg:col-span-2">
//         {selectedConv ? (
//           <Card className="h-full flex flex-col">
//             {/* Chat Header */}
//             <CardHeader className="border-b">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <Avatar className="w-10 h-10">
//                     <AvatarFallback>
//                       {selectedConv.participants.filter(p => p !== user.id)[0]?.charAt(0) || 'C'}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <h3 className="font-semibold">
//                       {selectedConv.title || `Conversation ${selectedConv.id.slice(0, 8)}`}
//                     </h3>
//                     <div className="flex items-center gap-2">
//                       <p className="text-sm text-gray-600">
//                         {selectedConv.conversation_type} • {selectedConv.participants.length} participants
//                       </p>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="flex gap-2">
//                   <Button 
//                     size="sm" 
//                     variant="outline"
//                     onClick={() => handleStartVideoCall('audio')}
//                     title="Start Audio Call"
//                   >
//                     <Phone className="h-4 w-4" />
//                   </Button>
//                   <Button 
//                     size="sm" 
//                     variant="outline"
//                     onClick={() => handleStartVideoCall('video')}
//                     title="Start Video Call"
//                   >
//                     <Video className="h-4 w-4" />
//                   </Button>
//                   <Button size="sm" variant="outline">
//                     <MoreVertical className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </CardHeader>
            
//             {/* Messages */}
//             <CardContent className="flex-1 p-0">
//               <ScrollArea className="h-[400px] p-4">
//                 <div className="space-y-4">
//                   {messages.length > 0 ? (
//                     messages.map((message) => (
//                     <div
//                       key={message.id}
//                       className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
//                     >
//                       <div className={`max-w-[70%] ${message.sender_id === user.id ? 'order-2' : ''}`}>
//                         <div className="flex items-end gap-2">
//                           {message.sender_id !== user.id && (
//                             <Avatar className="w-6 h-6">
//                               <AvatarImage src={message.sender?.profile_image_url} />
//                               <AvatarFallback className="text-xs">
//                                 {(message.sender?.display_name || 'U').charAt(0).toUpperCase()}
//                               </AvatarFallback>
//                             </Avatar>
//                           )}
                          
//                           <div className="flex-1">
//                             {message.message_type === 'file' && message.attachments ? (
//                               <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
//                                 <div className="flex items-center gap-3">
//                                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                                     <Paperclip className="h-5 w-5 text-blue-600" />
//                                   </div>
//                                   <div className="flex-1">
//                                     <h4 className="font-medium text-sm">{message.attachments.fileName}</h4>
//                                     <p className="text-xs text-gray-500">
//                                       {(message.attachments.fileSize / 1024 / 1024).toFixed(2)} MB
//                                     </p>
//                                   </div>
//                                   <Button 
//                                     size="sm" 
//                                     variant="outline"
//                                     onClick={() => window.open(message.attachments.fileUrl, '_blank')}
//                                   >
//                                     <Download className="h-4 w-4" />
//                                   </Button>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div
//                                 className={`p-3 rounded-lg ${
//                                   message.sender_id === user.id
//                                     ? 'bg-gradapp-primary text-white'
//                                     : 'bg-gray-100 text-gray-900'
//                                 }`}
//                               >
//                                 <p className="text-sm leading-relaxed">{message.content}</p>
//                               </div>
//                             )}
                            
//                             <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
//                               message.sender_id === user.id ? 'justify-end' : ''
//                             }`}>
//                               <span>
//                                 {message.created_at ? formatMessageTime(message.created_at) : (message as any).timestamp}
//                               </span>
//                               {message.sender_id === user.id && (
//                                 <CheckCheck className="h-3 w-3 text-blue-500" />
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8">
//                       <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
//                       <h3 className="font-medium text-gray-600 mb-2">No messages yet</h3>
//                       <p className="text-sm text-gray-500">
//                         Be the first to send a message in this conversation
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </ScrollArea>
//             </CardContent>
            
//             {/* Typing Indicator */}
//             {typingUsers.length > 0 && (
//               <div className="border-t px-4 py-2 bg-gray-50">
//                 <div className="flex items-center gap-2 text-sm text-gray-600">
//                   <div className="flex gap-1">
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
//                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
//                   </div>
//                   <span>Someone is typing...</span>
//                 </div>
//               </div>
//             )}

//             {/* Message Input */}
//             <div className="border-t p-4">
//               <div className="flex gap-2">
//                 <input
//                   type="file"
//                   id="message-file-upload"
//                   className="hidden"
//                   onChange={handleFileUpload}
//                   accept="*/*"
//                 />
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={() => document.getElementById('message-file-upload')?.click()}
//                 >
//                   <Paperclip className="h-4 w-4" />
//                 </Button>
//                 <div className="flex-1 relative">
//                   <Textarea
//                     placeholder="Type your message..."
//                     value={newMessage}
//                     onChange={(e) => handleTyping(e.target.value)}
//                     className="min-h-[44px] max-h-[120px] resize-none pr-20"
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter' && !e.shiftKey) {
//                         e.preventDefault();
//                         handleSendMessage();
//                       }
//                     }}
//                   />
//                   <div className="absolute right-2 bottom-2 flex gap-1">
//                     <Button variant="ghost" size="sm">
//                       <Smile className="h-4 w-4" />
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       onClick={handleSendMessage}
//                       disabled={!newMessage.trim() || sending}
//                       className="bg-gradapp-primary hover:bg-gradapp-accent"
//                     >
//                       {sending ? (
//                         <LoadingSpinner variant="micro" size="xs" />
//                       ) : (
//                         <Send className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         ) : (
//           <Card className="h-full flex items-center justify-center">
//             <div className="text-center">
//               <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversation selected</h3>
//               <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageCenter;





import React, { useState, useEffect } from 'react';
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
  Clock,
  Circle,
  Plus,
  Filter,
  Download,
  Eye,
  UserPlus
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { messagingService, Conversation, Message, MessageInput } from '@/services/messagingService';
import { videoCallService } from '@/services/videoCallService';

interface MessageCenterProps {
  user: User;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ user }) => {
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
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [conversationStatuses, setConversationStatuses] = useState<Map<string, {
    isPinned: boolean;
    isStarred: boolean;
    isArchived: boolean;
  }>>(new Map());

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

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      loadConversationStatus(selectedConversation);
      
      // Subscribe to real-time updates for this conversation
      messagingService.subscribeToConversation(
        selectedConversation,
        (newMessage) => {
          // Prevent duplicate messages - only add if not already in the list
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              return prev; // Don't add duplicate
            }
            return [...prev, newMessage];
          });
          // Mark as read if not sent by current user
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
    }

    return () => {
      if (selectedConversation) {
        messagingService.unsubscribeFromConversation(selectedConversation);
      }
    };
  }, [selectedConversation, user.id]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await messagingService.getConversations(user.id);
      
      // Enhance conversations with participant details
      const enhancedConvs = await Promise.all(
        convs.map(async (conv) => {
          if (conv.conversation_type === 'direct') {
            // Get other participant details for direct conversations
            const otherParticipantId = conv.participants.find(p => p !== user.id);
            if (otherParticipantId) {
              try {
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('display_name, full_name, profile_picture_url')
                  .eq('user_id', otherParticipantId)
                  .single();
                
                if (profile) {
                  const recipientName = profile.display_name || profile.full_name || 'Unknown User';
                  return {
                    ...conv,
                    title: recipientName, // Use recipient's name as conversation title
                    participantProfile: profile,
                    recipientName: recipientName // Store for easier access
                  };
                } 
                  // Fallback when no profile found
                  return {
                    ...conv,
                    title: 'Unknown User',
                    recipientName: 'Unknown User'
                  };
                
              } catch (error) {
                console.warn('Error loading participant profile:', error);
                return {
                  ...conv,
                  title: 'Unknown User',
                  recipientName: 'Unknown User'
                };
              }
            }
          } else {
            // For group conversations, keep original title or create a descriptive one
            return {
              ...conv,
              title: conv.title || `Group Chat (${conv.participants.length} members)`
            };
          }
          return conv;
        })
      );
      
      setConversations(enhancedConvs);
      
      // Load conversation statuses for all conversations
      const statusPromises = enhancedConvs.map(async (conv) => {
        const status = await messagingService.getConversationStatus(conv.id, user.id);
        return { id: conv.id, status };
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap = new Map();
      statuses.forEach(({ id, status }) => {
        statusMap.set(id, status);
      });
      setConversationStatuses(statusMap);
      
      // Sort conversations: pinned first, then by last message date
      const sortedConversations = enhancedConvs.sort((a, b) => {
        const aStatus = statusMap.get(a.id);
        const bStatus = statusMap.get(b.id);
        
        // Pinned conversations come first
        if (aStatus?.isPinned && !bStatus?.isPinned) {return -1;}
        if (!aStatus?.isPinned && bStatus?.isPinned) {return 1;}
        
        // Then sort by last message date
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });
      
      setConversations(sortedConversations);
      
      if (sortedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(sortedConversations[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await messagingService.getMessages(conversationId);
      setMessages(msgs);
      // Mark messages as read
      await messagingService.markMessagesAsRead(conversationId, user.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user.id) {return;}
    
    setSending(true);
    try {
      const messageData: MessageInput = {
        conversation_id: selectedConversation,
        content: newMessage,
        message_type: 'text'
      };
      
      const sentMessage = await messagingService.sendMessage(messageData, user.id);
      if (sentMessage) {
        setNewMessage('');
        // Add message immediately to UI for instant feedback
        setMessages(prev => [...prev, sentMessage]);
        // Real-time subscription will handle updates from other users
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Load conversation status for the current user
  const loadConversationStatus = async (conversationId: string) => {
    try {
      const status = await messagingService.getConversationStatus(conversationId, user.id);
      setConversationStatuses(prev => new Map(prev.set(conversationId, status)));
    } catch (error) {
      console.error('Error loading conversation status:', error);
    }
  };

  // Conversation management handlers
  const handlePinConversation = async () => {
    if (!selectedConversation) {return;}
    
    const currentStatus = conversationStatuses.get(selectedConversation);
    const newPinnedState = !currentStatus?.isPinned;
    
    const success = await messagingService.pinConversation(selectedConversation, user.id, newPinnedState);
    if (success) {
      // Update local status
      const updatedStatus = { ...currentStatus, isPinned: newPinnedState };
      setConversationStatuses(prev => new Map(prev.set(selectedConversation, updatedStatus)));
      // Refresh conversations to update order
      await loadConversations();
    }
  };

  const handleStarConversation = async () => {
    if (!selectedConversation) {return;}
    
    const currentStatus = conversationStatuses.get(selectedConversation);
    const newStarredState = !currentStatus?.isStarred;
    
    const success = await messagingService.starConversation(selectedConversation, user.id, newStarredState);
    if (success) {
      // Update local status
      const updatedStatus = { ...currentStatus, isStarred: newStarredState };
      setConversationStatuses(prev => new Map(prev.set(selectedConversation, updatedStatus)));
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) {return;}
    
    const currentStatus = conversationStatuses.get(selectedConversation);
    const newArchivedState = !currentStatus?.isArchived;
    
    const success = await messagingService.archiveConversation(selectedConversation, user.id, newArchivedState);
    if (success) {
      // Update local status and refresh conversations list
      await loadConversations();
      // If archived, clear selection
      if (newArchivedState) {
        setSelectedConversation(null);
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) {return;}
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this conversation? This action cannot be undone.'
    );
    
    if (!confirmed) {return;}
    
    const success = await messagingService.deleteConversation(selectedConversation, user.id);
    if (success) {
      // Clear selection and refresh conversations
      setSelectedConversation(null);
      await loadConversations();
    }
  };

  // User search functionality
  const handleSearchUsers = async (query: string) => {
    setSearchUsers(query);
    if (!query || query.trim().length < 2) {
      setFoundUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const users = await messagingService.searchUsers(query, user.id);
      setFoundUsers(users);
    } catch (error) {
      console.error('Error searching users:', error);
      setFoundUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartConversation = async (targetUserId: string, targetUserName: string) => {
    try {
      console.log('Starting conversation with:', targetUserId, targetUserName);
      
      const conversationId = await messagingService.startConversationWithUser(user.id, targetUserId);
      console.log('Conversation created/found:', conversationId);
      
      if (conversationId) {
        // Close the dialog first
        setShowNewConversation(false);
        setSearchUsers('');
        setFoundUsers([]);
        
        // Refresh conversations list
        console.log('Refreshing conversations...');
        await loadConversations();
        
        // Select the new conversation
        console.log('Selecting conversation:', conversationId);
        setSelectedConversation(conversationId);
        
        // Load messages for the new conversation
        await loadMessages(conversationId);
        
        toast.success(`Started conversation with ${targetUserName}`);
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Simple typing indicator (in a real app, you'd send this to other users)
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      
      // Clear typing indicator after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😌', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔', '🤨', '😐', '😑', '😶', '😒', '🙄', '😤', '😠', '😡', '🤬', '😕', '😟', '😔', '😞', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😀', '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🖕', '✍️', '🙏', '🦶', '🦵', '👂', '👃', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️', '👷‍♀️', '👷‍♂️', '💂‍♀️', '💂‍♂️', '🕵️‍♀️', '🕵️‍♂️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🦸‍♀️', '🦸‍♂️', '🦹‍♀️', '🦹‍♂️', '🤶', '🎅', '🧙‍♀️', '🧙‍♂️', '🧝‍♀️', '🧝‍♂️', '🧛‍♀️', '🧛‍♂️', '🧟‍♀️', '🧟‍♂️', '🧞‍♀️', '🧞‍♂️', '🧜‍♀️', '🧜‍♂️', '🧚‍♀️', '🧚‍♂️', '👼', '🤰', '🤱', '🙇‍♀️', '🙇‍♂️', '💁‍♀️', '💁‍♂️', '🙅‍♀️', '🙅‍♂️', '🙆‍♀️', '🙆‍♂️', '🙋‍♀️', '🙋‍♂️', '🧏‍♀️', '🧏‍♂️', '🤦‍♀️', '🤦‍♂️', '🤷‍♀️', '🤷‍♂️'];

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartVideoCall = async (callType: 'audio' | 'video') => {
    if (!selectedConversation || !user.id) {return;}

    try {
      // Get the other participant from the conversation
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) {return;}

      const otherParticipantId = conversation.participants.find(p => p !== user.id);
      if (!otherParticipantId) {return;}

      // Create a video session
      const scheduledAt = new Date().toISOString();
      const session = await videoCallService.createMentoringSession(
        user.id, // Current user as mentor (can be adjusted based on user role)
        otherParticipantId,
        scheduledAt,
        callType === 'video' ? 'video_call' : 'audio_call',
        60 // 60 minutes duration
      );

      if (session) {
        // Send a system message about the call
        const callMessage: MessageInput = {
          conversation_id: selectedConversation,
          content: `${callType === 'video' ? 'Video' : 'Audio'} call started`,
          message_type: 'meeting_link'
        };

        await messagingService.sendMessage(callMessage, user.id);

        // Open video call in new window/tab
        const callUrl = `/video-call/${session.id}`;
        window.open(callUrl, '_blank', 'width=1200,height=800');
        
        toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated!`);
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Failed to start call');
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) {return;}

    try {
      toast.loading('Uploading file...');
      
      // Upload file to Supabase storage
      const fileUrl = await messagingService.uploadMessageFile(file, selectedConversation, user.id);
      
      if (fileUrl) {
        // Send message with file attachment
        const messageData: MessageInput = {
          conversation_id: selectedConversation,
          content: `📎 ${file.name}`,
          message_type: 'file',
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
          toast.success('File uploaded and sent!');
        }
      } else {
        toast.dismiss();
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.dismiss();
      toast.error('Failed to upload file');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const searchForUsers = async (query: string) => {
    if (!query.trim()) {
      setFoundUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url, field_of_study, academic_level')
        .or(`display_name.ilike.%${query}%,field_of_study.ilike.%${query}%`)
        .neq('user_id', user.id) // Don't include current user
        .limit(10);

      if (error) {throw error;}
      setFoundUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const startNewConversation = async (targetUserId: string, targetUserName: string) => {
    try {
      // Get or create direct conversation
      const conversationId = await messagingService.getOrCreateDirectConversation(user.id, targetUserId);
      
      if (conversationId) {
        // Refresh conversations list
        await loadConversations();
        
        // Select the new conversation
        setSelectedConversation(conversationId);
        
        // Close the dialog
        setShowNewConversation(false);
        setSearchUsers('');
        setFoundUsers([]);
        
        toast.success(`Started conversation with ${targetUserName}`);
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const searchMessages = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await messagingService.searchMessages(user.id, query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error('Failed to search messages');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    
    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      searchMessages(value);
    }, 300);

    return () => clearTimeout(debounceTimer);
  };

  const getMessageStatusIcon = (message: any) => {
    if (message.sender === 'me') {
      return message.read ? (
        <CheckCheck className="h-3 w-3 text-blue-500" />
      ) : (
        <CheckCheck className="h-3 w-3 text-gray-400" />
      );
    }
    return null;
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
              <div className="flex gap-2">
                <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                          placeholder="Search for users..."
                          value={searchUsers}
                          onChange={(e) => {
                            handleSearchUsers(e.target.value);
                          }}
                          className="pl-10"
                        />
                      </div>
                      
                      {searchingUsers && (
                        <div className="flex items-center justify-center py-4">
                          <LoadingSpinner size="md" message="Searching users..." />
                        </div>
                      )}
                      
                      {foundUsers.length > 0 && (
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {foundUsers.map((foundUser) => (
                              <div
                                key={foundUser.id}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleStartConversation(foundUser.id, foundUser.display_name)}
                              >
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={foundUser.profile_image_url} />
                                  <AvatarFallback>
                                    {foundUser.display_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{foundUser.display_name || 'Unknown User'}</h4>
                                  <p className="text-xs text-gray-600">
                                    Click to start conversation
                                  </p>
                                </div>
                                <MessageCircle className="h-4 w-4 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      
                      {searchUsers && !searchingUsers && foundUsers.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No users found</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem>
                      All Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Unread Only
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Direct Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Group Chats
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Archived
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <LoadingSpinner variant="micro" size="xs" />
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {searchTerm && searchResults.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <h4 className="text-sm font-medium text-gray-700">
                      Search Results ({searchResults.length})
                    </h4>
                  </div>
                  {searchResults.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50"
                      onClick={() => {
                        setSelectedConversation(message.conversation_id);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender?.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {message.sender?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.sender?.display_name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm && !searching && searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No messages found</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" message="Loading conversations..." />
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
                          selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-gradapp-primary' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <div className="flex gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={conv.participantProfile?.profile_picture_url} />
                              <AvatarFallback>
                                {(conv.participantProfile?.display_name || conv.participantProfile?.full_name || conv.title || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Status indicators on avatar */}
                            <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                              {conversationStatuses.get(conv.id)?.isPinned && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Pin className="h-2 w-2 text-white" />
                                </div>
                              )}
                              {conversationStatuses.get(conv.id)?.isStarred && (
                                <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Star className="h-2 w-2 text-white fill-current" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium text-sm truncate ${
                                  conversationStatuses.get(conv.id)?.isPinned ? 'text-blue-700' : ''
                                }`}>
                                  {conv.recipientName || conv.title || `Conversation ${conv.id.slice(0, 8)}`}
                                </h4>
                                
                                {/* Inline status indicators */}
                                <div className="flex gap-1">
                                  {conversationStatuses.get(conv.id)?.isPinned && (
                                    <Pin className="h-3 w-3 text-blue-500" />
                                  )}
                                  {conversationStatuses.get(conv.id)?.isStarred && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                  {conversationStatuses.get(conv.id)?.isArchived && (
                                    <Archive className="h-3 w-3 text-gray-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-1">
                              {conv.conversation_type === 'direct' ? 'Direct Message' : 'Group Chat'} {conv.participants.length > 2 && `• ${conv.participants.length} members`}
                            </p>
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conv.description || 'No recent messages'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="font-medium text-gray-600 mb-2">No conversations yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Start connecting with mentors and peers to begin conversations
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowNewConversation(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Start New Conversation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2">
        {selectedConv ? (
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConv.participantProfile?.profile_picture_url} />
                    <AvatarFallback>
                      {(selectedConv.participantProfile?.display_name || selectedConv.participantProfile?.full_name || selectedConv.title || 'C').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {selectedConv.recipientName || selectedConv.title || `Conversation ${selectedConv.id.slice(0, 8)}`}
                      </h3>
                      
                      {/* Status indicators in header */}
                      <div className="flex gap-1">
                        {conversationStatuses.get(selectedConv.id)?.isPinned && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                            <Pin className="h-3 w-3" />
                            <span>Pinned</span>
                          </div>
                        )}
                        {conversationStatuses.get(selectedConv.id)?.isStarred && (
                          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            <span>Starred</span>
                          </div>
                        )}
                        {conversationStatuses.get(selectedConv.id)?.isArchived && (
                          <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                            <Archive className="h-3 w-3" />
                            <span>Archived</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        {selectedConv.conversation_type === 'direct' ? 'Direct Message' : 'Group Chat'} 
                        {selectedConv.participants.length > 2 && ` • ${selectedConv.participants.length} members`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStartVideoCall('audio')}
                    title="Start Audio Call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStartVideoCall('video')}
                    title="Start Video Call"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu open={showMoreActions} onOpenChange={setShowMoreActions}>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handlePinConversation}>
                        <Pin className={`h-4 w-4 mr-2 ${
                          conversationStatuses.get(selectedConversation)?.isPinned ? 'text-blue-600' : ''
                        }`} />
                        {conversationStatuses.get(selectedConversation)?.isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleStarConversation}>
                        <Star className={`h-4 w-4 mr-2 ${
                          conversationStatuses.get(selectedConversation)?.isStarred ? 'text-yellow-500 fill-current' : ''
                        }`} />
                        {conversationStatuses.get(selectedConversation)?.isStarred ? 'Unstar Conversation' : 'Star Conversation'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleArchiveConversation}>
                        <Archive className={`h-4 w-4 mr-2 ${
                          conversationStatuses.get(selectedConversation)?.isArchived ? 'text-gray-600' : ''
                        }`} />
                        {conversationStatuses.get(selectedConversation)?.isArchived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.sender_id === user.id ? 'order-2' : ''}`}>
                        <div className="flex items-end gap-2">
                          {message.sender_id !== user.id && (
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={message.sender?.profile_image_url} />
                              <AvatarFallback className="text-xs">
                                {(message.sender?.display_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className="flex-1">
                            {message.message_type === 'file' && message.attachments ? (
                              <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Paperclip className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{message.attachments.fileName}</h4>
                                    <p className="text-xs text-gray-500">
                                      {(message.attachments.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(message.attachments.fileUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-3 rounded-lg ${
                                  message.sender_id === user.id
                                    ? 'bg-gradapp-primary text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                              message.sender_id === user.id ? 'justify-end' : ''
                            }`}>
                              <span>
                                {message.created_at ? formatMessageTime(message.created_at) : (message as any).timestamp}
                              </span>
                              {message.sender_id === user.id && (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="font-medium text-gray-600 mb-2">No messages yet</h3>
                      <p className="text-sm text-gray-500">
                        Be the first to send a message in this conversation
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="border-t px-4 py-2 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span>Someone is typing...</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  id="message-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="*/*"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('message-file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    className="min-h-[44px] max-h-[120px] resize-none pr-20"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                          {commonEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              className="text-lg hover:bg-gray-100 p-1 rounded"
                              onClick={() => handleEmojiSelect(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button 
                      size="sm" 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradapp-primary hover:bg-gradapp-accent"
                    >
                      {sending ? (
                        <LoadingSpinner variant="micro" size="xs" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;