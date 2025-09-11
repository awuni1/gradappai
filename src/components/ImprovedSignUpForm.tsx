import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ImprovedSignUpFormProps {
  selectedRole?: 'applicant' | 'mentor' | null;
  onSuccess?: () => void;
}

const ImprovedSignUpForm: React.FC<ImprovedSignUpFormProps> = ({ 
  selectedRole, 
  onSuccess 
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStatus('loading');
    setMessage('Creating your account...');
    setDetails('');
    
    try {
      console.log('[IMPROVED SIGNUP] Starting signup process...');
      
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: selectedRole || 'applicant',
            full_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }
      
      console.log('[IMPROVED SIGNUP] Auth user created:', authData.user.id);
      
      // Step 2: Create user profile
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            role: selectedRole || 'applicant',
            full_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            onboarding_completed: false,
            onboarding_step: 1
          });
        
        if (profileError) {
          console.warn('[IMPROVED SIGNUP] Profile creation warning:', profileError);
          // Don't fail the signup if profile creation fails
        } else {
          console.log('[IMPROVED SIGNUP] User profile created successfully');
        }
      } catch (profileErr) {
        console.warn('[IMPROVED SIGNUP] Profile creation error:', profileErr);
        // Continue with signup even if profile creation fails
      }
      
      // Step 3: Create user role entry for compatibility
      try {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: selectedRole || 'applicant'
          });
        
        if (roleError) {
          console.warn('[IMPROVED SIGNUP] Role creation warning:', roleError);
        } else {
          console.log('[IMPROVED SIGNUP] User role created successfully');
        }
      } catch (roleErr) {
        console.warn('[IMPROVED SIGNUP] Role creation error:', roleErr);
      }
      
      // Step 4: Handle success and redirection
      setStatus('success');
      setMessage('🎉 Account Created Successfully!');
      
      if (authData.session) {
        // User is immediately logged in
        setDetails('You are now logged in! Redirecting to your dashboard...');
        
        // Store role in localStorage for immediate access
        localStorage.setItem(`user_role_${authData.user.id}`, selectedRole || 'applicant');
        
        // Trigger navigation after short delay
        setTimeout(() => {
          if (selectedRole === 'mentor') {
            navigate('/mentor/onboarding');
          } else {
            navigate('/onboarding');
          }
          
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
        
      } else {
        // Email confirmation required (though it should be disabled)
        setDetails('Please check your email for a confirmation link, then sign in.');
        
        // Still redirect after a delay in case email confirmation is disabled
        setTimeout(() => {
          // Try to sign in automatically
          attemptAutoSignIn();
        }, 3000);
      }
      
    } catch (err: any) {
      console.error('[IMPROVED SIGNUP] Signup failed:', err);
      setStatus('error');
      setMessage('Signup Failed');
      
      if (err.message?.includes('User already registered')) {
        setDetails('This email is already registered. Try signing in instead.');
      } else if (err.message?.includes('Password')) {
        setDetails('Password must be at least 6 characters long.');
      } else if (err.message?.includes('email')) {
        setDetails('Please enter a valid email address.');
      } else {
        setDetails(err.message || 'Something went wrong. Please try again.');
      }
    }
  };
  
  const attemptAutoSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (!error && data.session) {
        console.log('[IMPROVED SIGNUP] Auto sign-in successful');
        
        // Store role and redirect
        localStorage.setItem(`user_role_${data.user.id}`, selectedRole || 'applicant');
        
        if (selectedRole === 'mentor') {
          navigate('/mentor/onboarding');
        } else {
          navigate('/onboarding');
        }
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (autoSignInErr) {
      console.warn('[IMPROVED SIGNUP] Auto sign-in failed:', autoSignInErr);
      // Show manual sign-in option
      setDetails('Account created! Please sign in manually with your credentials.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Display */}
      {status !== 'idle' && (
        <div className={`p-4 rounded-lg border-2 ${
          status === 'success' ? 'bg-green-50 border-green-500' :
          status === 'error' ? 'bg-red-50 border-red-500' :
          'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-center gap-3">
            {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
            
            <div className="flex-1">
              <p className={`font-bold text-lg ${
                status === 'success' ? 'text-green-800' :
                status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message}
              </p>
              {details && (
                <p className={`text-sm mt-1 ${
                  status === 'success' ? 'text-green-700' :
                  status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {details}
                </p>
              )}
              
              {status === 'success' && (
                <div className="flex items-center gap-2 mt-2 text-green-700">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-sm">Redirecting to your dashboard...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
              disabled={status === 'loading' || status === 'success'}
              placeholder="Enter your first name"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
              disabled={status === 'loading' || status === 'success'}
              placeholder="Enter your last name"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            disabled={status === 'loading' || status === 'success'}
            placeholder="Enter your email address"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            disabled={status === 'loading' || status === 'success'}
            placeholder="Create a strong password"
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary"
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Account Created!
            </>
          ) : (
            `Create ${selectedRole === 'mentor' ? 'Mentor' : 'Applicant'} Account`
          )}
        </Button>
        
        {selectedRole && (
          <div className="text-center text-sm text-gray-600">
            Creating account as: <span className="font-semibold capitalize text-gradapp-primary">{selectedRole}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ImprovedSignUpForm;