
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import RoleSelectionModal from './RoleSelectionModal';

interface AuthModalProps {
  triggerElement?: React.ReactNode;
  initialMode?: 'signin' | 'signup';
  autoOpen?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  triggerElement,
  initialMode = 'signin',
  autoOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen && Boolean(triggerElement) === false);
  const [showSignIn, setShowSignIn] = useState(initialMode === 'signin');
  const [_isAuthenticated, setIsAuthenticated] = useState(false);
  const [_userRole, setUserRole] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setIsAuthenticated(Boolean(user));
      
      if (user) {
        setUserEmail(user.email || '');
        
        // Check if user has a role assigned
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleData?.role) {
          setUserRole(roleData.role);
        }
      }
    };

    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user;
        setIsAuthenticated(Boolean(user));
        
        if (user) {
          setUserEmail(user.email || '');
          
          // Check for user role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          if (roleData?.role) {
            setUserRole(roleData.role);
          } else if (event === 'SIGNED_IN') {
            // Show role selection for new sign-ins without role
            setShowRoleSelection(true);
          }
        } else {
          setUserRole(null);
          setShowRoleSelection(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = () => {
    // Don't close the modal immediately - let the role selection flow handle it
    // The role selection modal will show automatically via the auth state change
  };

  const handleRoleSelectionClose = () => {
    setShowRoleSelection(false);
    setIsOpen(false);
  };
  
  const toggleForm = () => {
    setShowSignIn(!showSignIn);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerElement || (
            <Button 
              variant="default" 
              className="bg-gradapp-primary hover:bg-gradapp-accent text-lg py-6 px-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              Get Started <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px] animate-scale-in">
          {showSignIn ? (
            <>
              <DialogTitle>Sign In to GradPath</DialogTitle>
              <DialogDescription>
                Welcome back! Sign in to continue your graduate school journey.
              </DialogDescription>
              <SignInForm onSuccess={handleAuthSuccess} onToggleForm={toggleForm} />
            </>
          ) : (
            <>
              <DialogTitle>Join GradPath</DialogTitle>
              <DialogDescription>
                Start your graduate school journey with personalized guidance and AI-powered tools.
              </DialogDescription>
              <SignUpForm onSuccess={handleAuthSuccess} onToggleForm={toggleForm} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Selection Modal */}
      <RoleSelectionModal 
        isOpen={showRoleSelection}
        onClose={handleRoleSelectionClose}
        userEmail={userEmail}
      />
    </>
  );
};

export default AuthModal;
