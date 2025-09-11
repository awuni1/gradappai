import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { GraduationCap, Menu, X, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsDropdown from './SettingsDropdown';
import NotificationBell from './notifications/NotificationBell';
import authService from '@/services/authService';

const AuthenticatedHeader: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Get initial user and role
    const getUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        try {
          const { role } = await authService.getUserRole(user.id);
          setUserRole(role);
        } catch (error) {
          console.warn('Could not fetch user role:', error);
          setUserRole(null);
        }
      }
    };

    getUserAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          try {
            const { role } = await authService.getUserRole(currentUser.id);
            setUserRole(role);
          } catch (error) {
            console.warn('Could not fetch user role:', error);
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => 
    `text-gray-600 hover:text-gradapp-primary transition-colors font-medium ${
      isActiveLink(path) ? 'text-gradapp-primary border-b-2 border-gradapp-primary pb-1' : ''
    }`;

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!user) {
      // Show all options for non-authenticated users
      return [
        
        { path: '/about', label: 'About' },
        { path: '/contact', label: 'Contact' },
      ];
    }

    if (userRole === 'mentor') {
      // Mentor-specific navigation
      return [
       
        { path: '/mentor/dashboard', label: 'Mentor Dashboard' },
        { path: '/mentor/students', label: 'My Students' },
        { path: '/mentor/resources', label: 'Resources' },
      ];
    } else if (userRole === 'applicant') {
      // Student/Applicant-specific navigation
      return [
        // { path: '/', label: 'Home' },
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/gradnet', label: 'GradNet' },
      ];
    } 
      // Default navigation for users without roles or unknown roles
      return [
       
        { path: '/about', label: 'About' },
        { path: '/contact', label: 'Contact' },
      ];
    
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {userRole === 'mentor' ? (
                <Users className="h-8 w-8 text-purple-600" />
              ) : (
                <GraduationCap className="h-8 w-8 text-gradapp-primary" />
              )}
            </motion.div>
            <span className={`text-2xl font-bold ${
              userRole === 'mentor' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' 
                : 'text-gradapp-primary'
            }`}>
              GradApp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to={item.path} 
                  className={navLinkClass(item.path)}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop Settings */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {/* Hide notifications and settings on home page */}
                {location.pathname !== '/' && (
                  <>
                    <NotificationBell user={user} />
                    <SettingsDropdown user={user} />
                  </>
                )}
              </>
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <>
            {/* Mobile Menu Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
            
            {/* Mobile Menu Content */}
            <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 md:hidden">
              <div className="container mx-auto px-4 py-6">
                <nav className="flex flex-col space-y-6">
                  {/* Navigation Links */}
                  {navigationItems.map((item) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link 
                        to={item.path} 
                        className={`text-lg ${navLinkClass(item.path)}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Mobile Settings Section */}
                  {user && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradapp-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gradapp-primary">
                            {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Mobile Settings Links */}
                      <div className="space-y-3">
                        <Link
                          to="/settings/profile"
                          className="block text-gray-600 hover:text-gradapp-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile Settings
                        </Link>
                        <Link
                          to="/settings/account"
                          className="block text-gray-600 hover:text-gradapp-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Account Settings
                        </Link>
                        <Link
                          to="/help"
                          className="block text-gray-600 hover:text-gradapp-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Help & Support
                        </Link>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default AuthenticatedHeader;