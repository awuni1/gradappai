import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Upload, 
  MessageSquare,
  Bot,
  User as UserIcon,
  FileText,
  Brain,
  University,
  Clock,
  Paperclip,
  ArrowDown,
  Mic,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CVUploadMessage } from './CVUploadMessage';
import { UniversityCardMessage } from './UniversityCardMessage';
import { UniversityResponseParser, universityResponseUtils } from '@/services/universityResponseParser';
import { GeminiService } from '@/services/geminiService';
import { documentParserService } from '@/services/documentParserService';
import { cvAnalysisService } from '@/services/cvAnalysisService';
import { ChatMessage, ConversationDetails, MatchedUniversity, CVAnalysisResult } from '@/types/global';

interface MessageMetadata {
  universities?: MatchedUniversity[];
  cv_analysis?: CVAnalysisResult;
  file_info?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
  processing_time?: number;
  confidence?: number;
  error_details?: string;
  [key: string]: unknown;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'cv_upload' | 'universities_list' | 'cv_analysis' | 'file';
  metadata: MessageMetadata | null;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  selectedConversationId: string | null;
  user: User | null;
  onMessageSent: () => void;
  conversations: ConversationDetails[];
  onConversationUpdate: () => void;
  inputOnly?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  selectedConversationId,
  user,
  onMessageSent,
  conversations,
  onConversationUpdate,
  inputOnly = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll position for scroll-to-bottom button
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) {return;}

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    // Check if we have required dependencies
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upload files',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedConversationId) {
      toast({
        title: 'No Conversation',
        description: 'Please start a conversation first',
        variant: 'destructive',
      });
      return;
    }

    if (sending) {
      toast({
        title: 'Please Wait',
        description: 'Another operation is in progress',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('text')) {
      toast({
        title: 'Unsupported File Type',
        description: 'Please upload a PDF, DOC, or TXT file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      console.log('📄 Processing CV upload:', file.name);

      // Show immediate "Analyzing..." message
      const analyzingMessage = {
        conversation_id: selectedConversationId,
        role: 'assistant' as const,
        content: 'Analyzing your document... This may take a moment.',
        message_type: 'text' as const,
        metadata: { analyzing: true }
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(analyzingMessage);

      if (messageError) {
        console.error('❌ Error inserting analyzing message:', messageError);
      }

      // Refresh messages to show analyzing indicator
      onMessageSent();

      // Parse document using the proper document parser service
      console.log('📄 Parsing document with documentParserService...');
      const parseResult = await documentParserService.parseDocument(file);
      
      if (parseResult.error) {
        console.error('❌ Document parsing failed:', parseResult.error);
        throw new Error(`Document parsing failed: ${parseResult.error.message}. Tip: For best results, try uploading a Word document (.docx) or text file (.txt) instead.`);
      }
      
      if (!parseResult.data?.text) {
        throw new Error('No text content could be extracted from the document');
      }
      
      const fileText = parseResult.data.text;
      const documentMetadata = parseResult.data.metadata;
      
      console.log(`✅ Successfully extracted ${fileText.length} characters from ${documentMetadata.fileName}`);

      // Insert user file upload message with enhanced metadata
      const { error: uploadMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          role: 'user',
          content: `Uploaded ${documentMetadata.parseMethod.toUpperCase()} file: ${file.name}`,
          message_type: 'file',
          metadata: { 
            filename: file.name,
            filesize: file.size,
            filetype: file.type,
            document_metadata: {
              wordCount: documentMetadata.wordCount,
              characterCount: documentMetadata.characterCount,
              pageCount: documentMetadata.pageCount,
              parseMethod: documentMetadata.parseMethod
            },
            extraction_success: true
          }
        });

      if (uploadMessageError) {
        console.error('❌ Error recording file upload:', uploadMessageError);
      }

      // Generate file analysis using Gemini
      const fileAnalysisPrompt = `I've attached a file for analysis. Please analyze this document and help me find suitable universities and programs.`;
      await generateCVAnalysis(selectedConversationId, fileText, fileAnalysisPrompt);
      onMessageSent();

    } catch (error) {
      console.error('❌ Error processing file upload:', error);
      
      // Provide specific error messages based on document parser errors
      let errorTitle = 'Upload Failed';
      let errorDescription = 'Failed to process your document. Please try again.';
      
      if (error.message.includes('PDF_NO_TEXT_CONTENT')) {
        errorTitle = 'PDF Text Extraction Failed';
        errorDescription = 'This PDF appears to be image-based. Please use a PDF with selectable text, convert to Word (.docx), or save as text file (.txt).';
      } else if (error.message.includes('PDF_PARSE_FAILED')) {
        errorTitle = 'PDF Processing Failed';
        errorDescription = 'Unable to read this PDF file. This could be due to:\n• The PDF may be password-protected\n• The PDF may be corrupted\n• The PDF may be image-based (scanned document)\n\nPlease try:\n• Converting to Word document (.docx)\n• Saving as text file (.txt)\n• Ensuring the PDF has selectable text';
      } else if (error.message.includes('FILE_TOO_LARGE')) {
        errorTitle = 'File Too Large';
        errorDescription = 'File size exceeds 10MB limit. Please upload a smaller file.';
      } else if (error.message.includes('INSUFFICIENT_CONTENT')) {
        errorTitle = 'Insufficient Content';
        errorDescription = 'Document appears to be empty or contains too little text content for analysis.';
      } else if (error.message.includes('UNSUPPORTED_FORMAT')) {
        errorTitle = 'Unsupported File Format';
        errorDescription = 'Please upload PDF, DOCX, DOC, or TXT files only.';
      } else if (error.message.includes('Document parsing failed')) {
        errorDescription = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const generateDemoResponse = async (userMessage: string) => {
    try {
      console.log('🎭 Generating demo response for:', userMessage);
      
      // Simulate different types of responses based on the message
      const lowerMessage = userMessage.toLowerCase();
      
      // Add a delay to simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let demoResponse = '';
      
      if (lowerMessage.includes('university') || lowerMessage.includes('school') || lowerMessage.includes('recommend')) {
        // University search response
        demoResponse = `🎓 **Demo University Recommendations**

Based on your query, here are some example university matches:

**🏆 Stanford University** (Reach School)
- Program: MS in Computer Science 
- Location: Stanford, CA, USA
- Match Score: 92%
- Why recommended: Top-tier CS program with excellent AI research

**🎯 University of Washington** (Target School)  
- Program: MS in Computer Science
- Location: Seattle, WA, USA
- Match Score: 85%
- Why recommended: Strong tech industry connections, great research

**✅ Arizona State University** (Safety School)
- Program: MS in Computer Science
- Location: Tempe, AZ, USA  
- Match Score: 78%
- Why recommended: Good program with flexible admission requirements

*Note: This is a demo response. Deploy the database schema for real AI-powered recommendations!*`;
        
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        // Greeting response
        demoResponse = `👋 Hello! I'm GradMatch AI, your graduate school advisor.

I can help you with:
• 🎓 Finding universities that match your profile
• 📄 Analyzing your CV/resume 
• 🎯 Application strategy and advice
• 📝 Program requirements and deadlines

What would you like to explore today?

*Currently in demo mode - deploy the database schema for full functionality!*`;
        
      } else if (lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
        demoResponse = `📄 **CV Analysis Demo**

I'd love to analyze your CV! In the full version, I can:

✅ Extract your academic background and experience
✅ Identify your strengths and areas for improvement  
✅ Suggest suitable graduate programs
✅ Recommend universities based on your profile
✅ Provide application strategy advice

To enable this feature:
1. Deploy the database schema using the SQL script
2. Upload your CV through the chat interface
3. Get personalized AI-powered analysis!

*Demo mode active - real CV analysis requires database setup.*`;
        
      } else {
        // General response
        demoResponse = `🤖 **Demo AI Response**

Thank you for your message: "${userMessage}"

In the full version, I provide:
• 🎯 Personalized university recommendations
• 📊 Detailed program analysis  
• 💡 Application strategy advice
• 📝 Requirements and deadlines
• 🔍 Research supervisor matching

To get real AI responses:
1. Run the database schema deployment
2. Restart your conversation
3. Experience full AI-powered guidance!

What specific aspect of graduate school would you like to discuss?

*Currently in demo mode for testing purposes.*`;
      }
      
      // In a real scenario, you'd insert this into the database
      // For demo, we'll just show it as a toast with the response
      console.log('🤖 Demo AI Response:', demoResponse);
      
      toast({
        title: 'Demo AI Response Generated',
        description: 'Check console for full response. Deploy database for real chat!',
        duration: 5000
      });
      
    } catch (error) {
      console.error('❌ Error in demo response:', error);
      toast({
        title: 'Demo Error',
        description: 'Demo mode encountered an issue',
        variant: 'destructive',
      });
    }
  };

  const generateCVAnalysis = async (conversationId: string, documentText: string, userMessage: string) => {
    try {
      console.log('🤖 Generating document analysis');

      // Build context for document analysis
      const context = await buildConversationContext(conversationId, userMessage);
      
      // Generate document analysis using Gemini - this will analyze the document and provide university recommendations
      const geminiResponse = await GeminiService.sendRequest({
        prompt: `Please analyze this document and provide comprehensive insights with university recommendations:\n\n${documentText}\n\n${userMessage}`,
        context: { ...context, documentText },
        type: 'cv_analysis'
      });

      console.log('✅ Document analysis received:', geminiResponse.type);

      // Process and store the analysis response
      await processAndStoreAIResponse(conversationId, geminiResponse, 'cv_analysis');

    } catch (error) {
      console.error('❌ Error generating document analysis:', error);
      
      // Fallback to helpful error message
      await insertErrorResponse(conversationId, 
        "I had trouble analyzing your document. Please ensure the file is readable and try uploading again. I can help with PDF, DOC, or text files."
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) {return;}
    
    const messageText = newMessage.trim();
    
    // If no conversation selected and we have a user, try to create one
    if (!selectedConversationId && user) {
      console.log('⚠️ No conversation selected, creating new one');
      // This should trigger conversation creation in the parent component
      try {
        onConversationUpdate();
        toast({
          title: 'Creating conversation',
          description: 'Please wait while we set up your chat...',
        });
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to create conversation. Please refresh the page.',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // If no user, we're in demo mode - handle differently
    if (!user) {
      console.log('⚠️ No user authenticated, using demo mode');
      setNewMessage('');
      setSending(true);
      
      // Simulate message sending and response in demo mode
      setTimeout(async () => {
        try {
          await generateDemoResponse(messageText);
        } catch (error) {
          console.error('❌ Demo response failed:', error);
        } finally {
          setSending(false);
        }
      }, 1000);
      return;
    }

    // Check if we're in temp conversation mode (database not set up)
    if (selectedConversationId === 'temp-conversation') {
      console.log('🎭 Temp conversation mode - using demo response');
      setNewMessage('');
      setSending(true);
      
      setTimeout(async () => {
        try {
          // Add user message to display (in memory only)
          const tempUserMessage = {
            id: `temp-user-${Date.now()}`,
            conversation_id: selectedConversationId,
            role: 'user' as const,
            content: messageText,
            message_type: 'text' as const,
            metadata: {},
            created_at: new Date().toISOString()
          };
          
          // Show the user message immediately
          console.log('👤 Adding temp user message:', tempUserMessage);
          
          // Generate demo AI response
          await generateDemoResponse(messageText);
          
          toast({
            title: 'Demo Mode Active',
            description: 'Deploy the database schema for full functionality.',
            duration: 3000
          });
        } catch (error) {
          console.error('❌ Demo response failed:', error);
        } finally {
          setSending(false);
        }
      }, 500);
      return;
    }

    setNewMessage('');
    setSending(true);

    try {
      console.log('📤 Sending message:', messageText);

      // Insert user message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          role: 'user',
          content: messageText,
          message_type: 'text',
          metadata: {}
        });

      if (messageError) {
        console.error('❌ Error sending message:', messageError);
        
        // Check if it's a table not found error
        if (messageError.message?.includes('relation "public.messages" does not exist')) {
          toast({
            title: 'Database Setup Required',
            description: 'Please deploy the chat system database schema.',
            variant: 'destructive',
            duration: 10000
          });
        } else {
          toast({
            title: 'Message Send Failed',
            description: `Database error: ${messageError.message}`,
            variant: 'destructive',
          });
        }
        setNewMessage(messageText); // Restore message
        return;
      }

      // Refresh messages
      onMessageSent();

      // Generate AI response using Gemini
      try {
        await generateAIResponse(selectedConversationId, messageText);
        onMessageSent();
      } catch (error) {
        console.error('❌ Error generating AI response:', error);
        // Don't throw the error, just log it - the message was already sent
        toast({
          title: 'AI Response Failed',
          description: 'Your message was sent but AI response failed. Please try again.',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while sending your message.',
        variant: 'destructive',
      });
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const generateAIResponse = async (conversationId: string, userMessage: string) => {
    try {
      console.log('🤖 Generating AI response for:', userMessage);

      // Get conversation context
      const context = await buildConversationContext(conversationId, userMessage);
      
      // Detect message type and generate appropriate response
      const messageType = detectMessageType(userMessage, context);
      console.log('📝 Detected message type:', messageType);

      // Generate response using Gemini
      const geminiResponse = await GeminiService.sendRequest({
        prompt: userMessage,
        context: context,
        type: messageType
      });

      console.log('✅ Gemini response received:', geminiResponse.type);

      // Process and store the response
      await processAndStoreAIResponse(conversationId, geminiResponse, messageType);

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Fallback to a helpful error message
      await insertErrorResponse(conversationId, 
        "I'm having trouble processing your request right now. Please try again in a moment. I can help you with university recommendations, CV analysis, and application guidance."
      );
    }
  };

  // Helper function to build conversation context
  const buildConversationContext = async (conversationId: string, currentMessage: string) => {
    if (!conversationId) {
      return {
        conversationHistory: [],
        userProfile: null,
        currentMessage,
        metadata: {}
      };
    }

    try {
      // Get conversation history
      const { data: conversationHistory, error: historyError } = await supabase
        .from('messages')
        .select('role, content, message_type, metadata')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (historyError) {
        console.error('❌ Error fetching conversation history:', historyError);
      }

      // Get conversation data (including CV analysis)
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('cv_analysis, metadata')
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('❌ Error fetching conversation data:', conversationError);
      }

      return {
        conversationHistory: conversationHistory || [],
        userProfile: conversationData?.cv_analysis || null,
        currentMessage,
        metadata: conversationData?.metadata || {}
      };
    } catch (error) {
      console.error('❌ Error building context:', error);
      return {
        conversationHistory: [],
        userProfile: null,
        currentMessage,
        metadata: {}
      };
    }
  };

  // Helper function to detect message type
  const detectMessageType = (message: string, context: any) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)$/)) {
      return 'greeting';
    }

    // Check for country selection
    const countries = ['usa', 'uk', 'canada', 'germany', 'australia', 'united states', 'britain', 'england'];
    if (countries.some(country => lowerMessage.includes(country))) {
      return 'university_search';
    }

    // Check for university-related requests
    if (lowerMessage.includes('university') || lowerMessage.includes('college') || 
        lowerMessage.includes('recommend') || lowerMessage.includes('school')) {
      return context.userProfile ? 'university_search' : 'general_chat';
    }

    // Default to general chat
    return 'general_chat';
  };

  // Helper function to process and store AI response
  const processAndStoreAIResponse = async (conversationId: string, geminiResponse: any, messageType: string) => {
    try {
      if (geminiResponse.type === 'cv_analysis') {
        await handleCVAnalysisResponse(conversationId, geminiResponse);
      } else if (geminiResponse.type === 'universities_list') {
        await handleUniversityListResponse(conversationId, geminiResponse);
      } else {
        await handleTextResponse(conversationId, geminiResponse);
      }
    } catch (error) {
      console.error('❌ Error processing AI response:', error);
      throw error;
    }
  };

  // Handle CV analysis response
  const handleCVAnalysisResponse = async (conversationId: string, response: any) => {
    try {
      // Store CV analysis in conversation
      if (response.parsed_data) {
        await supabase
          .from('conversations')
          .update({ 
            cv_analysis: response.parsed_data.user_profile,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }

      // Store response message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response.content,
          message_type: 'cv_analysis',
          metadata: {
            analysis_data: response.parsed_data,
            confidence: response.confidence
          }
        });

    } catch (error) {
      console.error('❌ Error handling CV analysis response:', error);
      throw error;
    }
  };

  // Handle university list response
  const handleUniversityListResponse = async (conversationId: string, response: any) => {
    try {
      if (response.parsed_data?.universities) {
        await insertUniversityRecommendations(conversationId, response.content, response.parsed_data);
        
        // Also store the matches using our new storage service
        const { universityMatchingStorageService } = await import('@/services/universityMatchingStorageService');
        await universityMatchingStorageService.storeUniversityMatches(conversationId, response.parsed_data.universities);
      } else {
        // Try generating comprehensive matches using real user data
        const { universityMatchingStorageService } = await import('@/services/universityMatchingStorageService');
        const comprehensiveMatches = await universityMatchingStorageService.generateComprehensiveMatches(response.content, 15); // Request 15 to ensure we get at least 10
        
        if (comprehensiveMatches.data && comprehensiveMatches.data.length > 0) {
          await universityMatchingStorageService.storeUniversityMatches(conversationId, comprehensiveMatches.data);
          
          // Convert to expected format and store as recommendations
          const formattedData = {
            universities: comprehensiveMatches.data,
            analysis: {
              reach_schools: comprehensiveMatches.data.filter(u => u.match_category === 'reach').length,
              target_schools: comprehensiveMatches.data.filter(u => u.match_category === 'target').length,
              safety_schools: comprehensiveMatches.data.filter(u => u.match_category === 'safety').length,
              confidence_score: Math.round(comprehensiveMatches.data.reduce((acc, u) => acc + u.match_score, 0) / comprehensiveMatches.data.length * 100),
              primary_field: 'Graduate Studies'
            }
          };
          
          await insertUniversityRecommendations(conversationId, response.content, formattedData);
        } else {
          // If no comprehensive matches could be generated, show error
          await insertErrorResponse(conversationId, 
            "I couldn't find any universities in the database that match your profile. Please ensure the university database is properly populated with universities and programs."
          );
        }
      }
    } catch (error) {
      console.error('❌ Error handling university list response:', error);
      throw error;
    }
  };

  // Handle general text response
  const handleTextResponse = async (conversationId: string, response: any) => {
    try {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response.content,
          message_type: 'text',
          metadata: {
            confidence: response.confidence,
            generated_at: response.metadata?.generated_at
          }
        });
    } catch (error) {
      console.error('❌ Error handling text response:', error);
      throw error;
    }
  };

  // Helper function for error responses
  const insertErrorResponse = async (conversationId: string, errorMessage: string) => {
    try {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: errorMessage,
          message_type: 'text',
          metadata: { error: true }
        });
    } catch (error) {
      console.error('❌ Error inserting error response:', error);
    }
  };


  const insertUniversityRecommendations = async (conversationId: string, responseText: string, parsedData: any) => {
    try {
      const { universities, analysis } = parsedData;

      // Insert AI message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: `I've analyzed your profile and found ${universities.length} excellent university matches! Here's my comprehensive analysis:

🎯 **Match Analysis:**
- ${analysis?.reach_schools || 0} Reach schools (challenging but achievable)
- ${analysis?.target_schools || 0} Target schools (good match)
- ${analysis?.safety_schools || 0} Safety schools (high probability)
- Field focus: ${analysis?.primary_field || 'Graduate Studies'}
- Overall confidence: ${analysis?.confidence_score || 80}%

Each recommendation below includes detailed reasoning and important considerations.`,
          message_type: 'universities_list',
          metadata: { 
            university_count: universities.length,
            analysis: analysis,
            generated_at: new Date().toISOString(),
            parsed_from_json: true,
            original_response: responseText
          }
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Error inserting parsed message:', messageError);
        return;
      }

      // Insert university recommendations
      const dbData = universityResponseUtils.convertToDbFormat(universities, conversationId, messageData.id);
      const { error: recommendationsError } = await supabase
        .from('university_recommendations')
        .insert(dbData);

      if (recommendationsError) {
        console.error('❌ Error inserting parsed recommendations:', recommendationsError);
        return;
      }

      console.log('✅ Successfully inserted parsed university recommendations');
      
    } catch (error) {
      console.error('❌ Error inserting university recommendations:', error);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMessageIcon = (message: Message) => {
    if (message.role === 'assistant') {return <Bot className="h-4 w-4 text-blue-600" />;}
    if (message.message_type === 'cv_upload') {return <FileText className="h-4 w-4 text-purple-600" />;}
    if (message.message_type === 'universities_list') {return <University className="h-4 w-4 text-green-600" />;}
    return <UserIcon className="h-4 w-4 text-gray-600" />;
  };

  // Don't show welcome screen if in inputOnly mode
  if (!selectedConversationId && !inputOnly) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50/50 to-blue-50/30">
        <div className="text-center max-w-2xl px-8">
          {/* Modern Icon Design */}
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <MessageSquare className="h-16 w-16 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
            AI University Matching
          </h1>
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Get personalized university recommendations powered by AI. Upload your CV or start chatting to discover your perfect graduate school matches.
          </p>
          
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Upload Your CV</h3>
              <p className="text-sm text-slate-600 mb-4">Get instant analysis and personalized recommendations based on your academic background</p>
              <Button 
                onClick={() => onConversationUpdate()} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-xl h-11 font-medium transition-all duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CV & Start
              </Button>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Ask AI Advisor</h3>
              <p className="text-sm text-slate-600 mb-4">Chat with our AI to explore universities, programs, and application strategies</p>
              <Button 
                onClick={() => onConversationUpdate()} 
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-50 rounded-xl h-11 font-medium transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chatting
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <University className="h-4 w-4" />
              <span>500+ Universities</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>AI-Powered Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>CV Analysis</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If inputOnly mode, just render the Perplexity-style search input bar
  if (inputOnly) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Perplexity-style Search Input */}
        <div className="relative">
          <div className="flex items-center bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 p-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Summarize the latest"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[48px] max-h-32 resize-none border-0 bg-transparent rounded-2xl px-4 py-3 text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                disabled={sending}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-3 mr-2">
              {/* Attach Button */}
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Attach"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Voice Message Button */}
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Voice Message"
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              {/* Browse Prompts Button */}
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Browse Prompts"
              >
                <Globe className="h-4 w-4" />
              </Button>
              
              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 border-0 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
          
          {/* Character count */}
          <div className="flex justify-end mt-2 mr-2">
            <span className="text-xs text-slate-400">
              {newMessage.length}/3,000
            </span>
          </div>
        </div>

        {/* Sending Indicator */}
        {sending && (
          <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Analyzing your message and generating response...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/30 to-blue-50/20">
      {/* Modern Chat Interface - No Header */}
        {/* Borderless Messages Area */}
        <div className="flex-1 relative">
          <div className="h-full overflow-y-auto" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] ${
                        message.role === 'user' ? 'order-first' : ''
                      }`}
                    >
                      {/* Message Type Badge */}
                      {message.message_type !== 'text' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                            {getMessageIcon(message)}
                            <span className="text-xs font-medium text-slate-600">
                              {message.message_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Modern Message Content */}
                      <div
                        className={`${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-3xl px-5 py-3'
                            : message.message_type === 'universities_list'
                            ? 'bg-transparent'
                            : 'bg-white/80 backdrop-blur-sm text-slate-800 shadow-sm rounded-3xl px-5 py-4 border border-white/50'
                        }`}
                      >
                        {message.message_type === 'cv_upload' ? (
                          <CVUploadMessage message={message} />
                        ) : message.message_type === 'universities_list' ? (
                          <UniversityCardMessage message={message} />
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>

                      {/* Subtle Timestamp */}
                      <div
                        className={`flex items-center gap-1 mt-2 text-xs text-slate-400 ${
                          message.role === 'user' ? 'justify-end' : ''
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                    <Bot className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Ready to help you!</h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Ask me about universities, upload your CV for analysis, or tell me about your academic goals. I'm here to help you find the perfect graduate programs!
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Modern Scroll to Bottom Button */}
          {showScrollButton && (
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-6 right-6 rounded-full w-12 h-12 p-0 shadow-xl bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-2xl transition-all duration-200"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Modern Input Area with Prominent Upload */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-white/50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Quick Actions Bar */}
            <div className="flex gap-3 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewMessage("I'd like to upload my CV for analysis and get university recommendations")}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-xl h-10 px-4 font-medium transition-all duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewMessage("Can you recommend universities for Computer Science graduate programs?")}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded-xl h-10 px-4 font-medium transition-all duration-200"
              >
                <University className="h-4 w-4 mr-2" />
                Find Universities
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewMessage("What should I include in my graduate school application?")}
                className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100 text-purple-700 rounded-xl h-10 px-4 font-medium transition-all duration-200"
              >
                <Brain className="h-4 w-4 mr-2" />
                Get Advice
              </Button>
            </div>

            {/* Modern Message Input */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Ask me about universities, upload your CV, share your goals, or get application advice..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[52px] max-h-32 resize-none border-0 bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 text-slate-800 placeholder:text-slate-400 shadow-sm focus:shadow-md transition-all duration-200"
                  disabled={sending}
                />
                {/* File Upload Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 bottom-2 w-8 h-8 p-0 rounded-xl hover:bg-slate-100"
                  title="Attach"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <Paperclip className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-12 w-12 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* Hidden File Input for Regular Chat */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Sending Indicator */}
            {sending && (
              <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Analyzing your message and generating response...</span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};