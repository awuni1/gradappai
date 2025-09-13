import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  // MessageCircle, // Messaging temporarily disabled
  FileText, 
  Network,
  Globe
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

// Import the enhanced components
import SocialFeed from '@/components/gradnet/SocialFeed';
import MentorDiscovery from '@/components/gradnet/MentorDiscovery';
// import WhatsAppStyleMessageCenter from '@/components/gradnet/WhatsAppStyleMessageCenter'; // Messaging temporarily disabled
import DocumentLibrary from '@/components/gradnet/DocumentLibrary';
import NetworkingHub from '@/components/gradnet/NetworkingHub';
import { Button } from '@/components/ui/button';


const GradNet: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [searchParams, setSearchParams] = useSearchParams();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const navigate = useNavigate();

  // Get tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
  // Redirect deprecated/disabled tab to feed
  setActiveTab(tab === 'messages' ? 'feed' : tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    
  // Messaging tab is disabled
  };

  // Function to get unread message count using gradnetService
  const getUnreadMessageCount = async (userId: string) => {
    try {
      // Simple fallback count - can be enhanced later
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('Database not ready for message counts:', error);
        return 0;
      }
      
      // For now, return 0 - this can be enhanced when messaging is fully functional
      return 0;
    } catch (error) {
      console.warn('Error fetching unread message count:', error);
      return 0;
    }
  };

  // Function to update unread count
  const updateUnreadCount = async () => {
    if (user?.id) {
      const count = await getUnreadMessageCount(user.id);
      setUnreadMessageCount(count);
    }
  };

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Authentication error:', error);
          navigate('/auth');
          return;
        }
        
        if (!user) {
          console.log('No user found, redirecting to auth');
          navigate('/auth');
          return;
        }
        
        console.log('User authenticated:', user.id);
        setUser(user);
        setLoading(false);
        
        // Load initial unread count in background (don't block UI)
        getUnreadMessageCount(user.id).then(count => {
          setUnreadMessageCount(count);
        }).catch(error => {
          console.warn('Failed to load unread message count:', error);
          setUnreadMessageCount(0);
        });
        
      } catch (error) {
        console.error('Error in getUser:', error);
        setUser(null);
        setLoading(false);
        navigate('/auth');
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/');
        } else if (session?.user) {
          setUser(session.user);
          const count = await getUnreadMessageCount(session.user.id);
          setUnreadMessageCount(count);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for message updates
  useEffect(() => {
    if (user?.id) {
      const messagesSubscription = supabase
        .channel('unread-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            updateUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [user?.id]);

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'feed':
          return <SocialFeed user={user} />;
        case 'mentors':
          return <MentorDiscovery user={user} />;
  // case 'messages':
  //   return (
  //     <div className="flex flex-col items-center justify-center p-8 text-center">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages are disabled</h3>
  //       <p className="text-gray-600">Please check back later.</p>
  //     </div>
  //   );
        case 'documents':
          return <DocumentLibrary user={user} />;
        case 'network':
          return <NetworkingHub user={user} />;
        default:
          return <SocialFeed user={user} />;
      }
    } catch (error) {
      console.error('Error rendering GradNet content:', error);
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">GradNet is being set up</h3>
          <p className="text-gray-600 mb-4">The social platform is still being configured. Please check back later.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" color="primary" message="Loading GradNet..." />
      </div>
    );
  }

  if (!user) {return null;}

  return (
    <>
      <SEOHead 
        title="GradNet"
        description="Connect with fellow graduate students and mentors in your field"
        keywords="gradnet, graduate networking, academic social platform, student community"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-white">
        <div className="flex">
          {/* Clean Sidebar */}
          <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
            <div className="flex flex-col bg-white border-r border-gray-100 pt-16 overflow-y-auto">
              
              {/* Header */}
              <div className="px-10 mb-16">
                <h1 className="text-2xl font-semibold text-gray-900">GradNet</h1>
                <p className="text-sm text-gray-500 mt-3">Your Graduate Success Network</p>
              </div>

              {/* Navigation */}
              <nav className="px-10 space-y-4">
                <button
                  onClick={() => handleTabChange('feed')}
                  className={`w-full flex items-center px-6 py-5 text-base font-medium rounded-xl transition-colors ${
                    activeTab === 'feed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Globe className="h-5 w-5 mr-5" />
                  Social Feed
                </button>

                {/* <button
                  onClick={() => handleTabChange('mentors')}
                  className={`w-full flex items-center px-6 py-5 text-base font-medium rounded-xl transition-colors ${
                    activeTab === 'mentors'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5 mr-5" />
                  Find Mentors
                </button> */}

                {/* Messaging tab disabled */}

                <button
                  onClick={() => handleTabChange('documents')}
                  className={`w-full flex items-center px-6 py-5 text-base font-medium rounded-xl transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-5" />
                  Documents
                </button>

                {/* <button
                  onClick={() => handleTabChange('network')}
                  className={`w-full flex items-center px-6 py-5 text-base font-medium rounded-xl transition-colors ${
                    activeTab === 'network'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Network className="h-5 w-5 mr-5" />
                  My Network
                </button> */}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:ml-72 flex-1">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleTabChange('feed')}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === 'feed' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs mt-1">Feed</span>
            </button>

            {/* <button
              onClick={() => handleTabChange('mentors')}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === 'mentors' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1">Mentors</span>
            </button> */}

            {/* Messaging tab disabled */}

            <button
              onClick={() => handleTabChange('documents')}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === 'documents' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs mt-1">Docs</span>
            </button>

            <button
              onClick={() => handleTabChange('network')}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === 'network' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Network className="h-5 w-5" />
              <span className="text-xs mt-1">Network</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GradNet;