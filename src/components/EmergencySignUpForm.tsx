import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

interface EmergencySignUpFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
  selectedRole?: 'applicant' | 'mentor' | null;
}

const EmergencySignUpForm: React.FC<EmergencySignUpFormProps> = ({ 
  onSuccess, 
  onToggleForm,
  selectedRole 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  console.warn('[EMERGENCY SIGNUP] Component rendered');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    console.warn(`[EMERGENCY SIGNUP] ${field} changed to:`, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.warn('[EMERGENCY SIGNUP] Form submitted:', formData);
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      console.warn('[EMERGENCY SIGNUP] Validation failed - missing fields');
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields.",
      });
      return;
    }

    if (formData.password.length < 6) {
      console.warn('[EMERGENCY SIGNUP] Validation failed - password too short');
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    console.warn('[EMERGENCY SIGNUP] Starting signup process...');

    try {
      // Simple, direct signup call
      console.warn('[EMERGENCY SIGNUP] Calling supabase.auth.signUp...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: selectedRole || 'applicant',
            signup_source: 'emergency_form'
          },
          emailRedirectTo: `${(() => {
            if (typeof window === 'undefined') return 'https://www.gradappai.com';
            const host = window.location.hostname;
            return (host === 'localhost' || host === '127.0.0.1') ? window.location.origin : 'https://www.gradappai.com';
          })()}/auth`
        }
      });

      console.warn('[EMERGENCY SIGNUP] Supabase response:', { data, error });

      if (error) {
        console.error('[EMERGENCY SIGNUP] Error occurred:', error);
        
        let message = error.message;
        if (error.message.includes('email_address_invalid')) {
          message = "Please use a valid email address (try Gmail, Yahoo, or Outlook).";
        }
        
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: message,
        });
        return;
      }

      console.warn('[EMERGENCY SIGNUP] Signup successful!');

      if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Check Your Email! 📧",
          description: "We've sent you a confirmation link. Please check your email and click the link to activate your account.",
          duration: 8000,
        });
      } else if (data.user && data.session) {
        // Immediate success
        toast({
          title: "Welcome! 🎉",
          description: "Your account has been created successfully!",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }

    } catch (err) {
      console.error('[EMERGENCY SIGNUP] Unexpected error:', err);
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Emergency Signup</h3>
        <p className="text-sm text-gray-600 mt-2">
          Simplified signup form for troubleshooting
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName"
              type="text" 
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Wuni"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName"
              type="text" 
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Abdulai"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            type="email" 
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="wuniabdulai19@gmail.com"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="At least 6 characters"
            disabled={isSubmitting}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "🚨 Emergency Signup"
          )}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Button 
          variant="link" 
          onClick={onToggleForm} 
          className="p-0 h-auto text-red-600 hover:text-red-700"
          disabled={isSubmitting}
        >
          Sign in here
        </Button>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
        <p><strong>Debug Info:</strong></p>
        <p>Component: EmergencySignUpForm</p>
        <p>Selected Role: {selectedRole || 'applicant'}</p>
        <p>Supabase URL: {supabase.supabaseUrl}</p>
        <p>Form State: {JSON.stringify(formData, null, 2)}</p>
      </div>
    </div>
  );
};

export default EmergencySignUpForm;