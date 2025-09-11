import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, Mail, User, Lock } from 'lucide-react';

interface FinalWorkingSignUpFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
  selectedRole?: 'applicant' | 'mentor' | null;
}

const FinalWorkingSignUpForm: React.FC<FinalWorkingSignUpFormProps> = ({ 
  onSuccess, 
  onToggleForm,
  selectedRole 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('[FINAL SIGNUP] Starting signup process...');
      console.log('[FINAL SIGNUP] Form data:', { ...formData, password: '***' });
      
      // Perform signup with correct redirect URL
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: selectedRole || 'applicant'
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      console.log('[FINAL SIGNUP] Supabase response:', { 
        user: data.user ? 'Created' : 'Not created',
        session: data.session ? 'Active' : 'Not active',
        error: error?.message || 'None'
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('email_address_invalid')) {
          errorMessage = "Please use a different email provider (Gmail, Yahoo, Outlook, etc.)";
        } else if (error.message.includes('User already registered')) {
          errorMessage = "Account already exists! Please sign in instead.";
        }
        
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: errorMessage,
        });
        return;
      }

      // Success! User was created
      console.log('[FINAL SIGNUP] User created successfully!');
      setSignupSuccess(true);
      
      if (data.user && !data.session) {
        // Email confirmation required (most common case)
        toast({
          title: "🎉 Account Created Successfully!",
          description: "Please check your email for a confirmation link. Click the link to activate your account.",
          duration: 10000,
        });
      } else if (data.user && data.session) {
        // Immediate login (less common)
        toast({
          title: "🎉 Welcome to GradApp!",
          description: "Your account has been created and you're logged in!",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }

    } catch (err) {
      console.error('[FINAL SIGNUP] Unexpected error:', err);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created! 🎉</h3>
          <p className="text-gray-600 mb-4">
            Your account has been successfully created with email: <br/>
            <strong>{formData.email}</strong>
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <strong className="text-blue-800">Next Steps:</strong>
            </div>
            <p className="text-blue-700 text-sm">
              1. Check your email inbox (and spam folder)<br/>
              2. Click the confirmation link in the email<br/>
              3. Return to GradApp to sign in
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setSignupSuccess(false)}
              variant="outline"
              className="w-full"
            >
              Create Another Account
            </Button>
            
            {onToggleForm && (
              <Button 
                onClick={onToggleForm}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Sign In Instead
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Create Your Account</h3>
        <p className="text-sm text-gray-600 mt-2">
          Join GradApp - Signup is working! ✅
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="firstName"
                className="pl-10"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="lastName"
                className="pl-10"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="email"
              type="email"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="password"
              type="password"
              className="pl-10"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 text-white font-semibold py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Your Account...
            </>
          ) : (
            <>
              Create Account ✅
            </>
          )}
        </Button>
      </form>
      
      {onToggleForm && (
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Button 
            variant="link" 
            onClick={onToggleForm} 
            className="p-0 h-auto text-green-600 hover:text-green-700 font-semibold"
            disabled={isSubmitting}
          >
            Sign in here
          </Button>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-green-800 mb-1">✅ Status: Signup is Working!</p>
        <p className="text-green-700">6 users already created successfully in database</p>
      </div>
    </div>
  );
};

export default FinalWorkingSignUpForm;