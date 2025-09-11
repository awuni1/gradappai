import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Settings, 
  User as UserIcon, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronDown,
  Bell,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsDropdownProps {
  user: User;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsOpen(false);
      
      // Show immediate feedback
      toast.info('Signing out...');
      
      // Clear local storage immediately for better UX
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
      
      // Sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      try {
        const { error } = await Promise.race([signOutPromise, timeoutPromise]);
        
        if (error) {
          console.error('Sign out error:', error);
          // Don't show error toast - proceed with fallback
        }
      } catch {
        console.warn('Sign out timed out, proceeding with fallback');
      }
      
      // Clear all local storage regardless of auth result
      localStorage.clear();
      
      // Navigate immediately
      navigate('/', { replace: true });
      toast.success('Signed out successfully');
      
      // Force page reload to ensure clean state (with slight delay)
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Fallback: force sign out
      localStorage.clear();
      sessionStorage.clear();
      
      // Force navigation
      toast.success('Signed out');
      window.location.href = '/';
    } finally {
      // Don't reset isSigningOut immediately to prevent UI flicker
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
    }
  };

  const handleItemClick = (callback?: () => void) => {
    setIsOpen(false);
    callback?.();
  };

  // Get user display name or email
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || '';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gradapp-primary hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium">Settings</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
            
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradapp-primary/10 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gradapp-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Profile Settings */}
              <Link
                to="/settings/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => handleItemClick()}
              >
                <UserIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Profile Settings</p>
                  <p className="text-xs text-gray-500">Manage your personal information</p>
                </div>
              </Link>

              {/* Account Settings */}
              <Link
                to="/settings/account"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => handleItemClick()}
              >
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Account Settings</p>
                  <p className="text-xs text-gray-500">Billing, security, and preferences</p>
                </div>
              </Link>

              {/* Notifications */}
              <Link
                to="/settings/notifications"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => handleItemClick()}
              >
                <Bell className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-gray-500">Email and push notification settings</p>
                </div>
              </Link>

              {/* Privacy & Security */}
              <Link
                to="/settings/privacy"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => handleItemClick()}
              >
                <Shield className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Privacy & Security</p>
                  <p className="text-xs text-gray-500">Data usage and account security</p>
                </div>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-100 my-1" />

              {/* Help & Support */}
              <Link
                to="/help"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => handleItemClick()}
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Help & Support</p>
                  <p className="text-xs text-gray-500">Documentation and contact support</p>
                </div>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-100 my-1" />

              {/* Sign Out */}
              <button
                onClick={() => handleItemClick(handleSignOut)}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </p>
                  <p className="text-xs text-red-500">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsDropdown;