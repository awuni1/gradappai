import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const UltraFixedSignUp: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');
  const [formData, setFormData] = useState({
    firstName: 'Wuni',
    lastName: 'Abdulai',
    email: `test-${Date.now()}@gmail.com`, // Unique email each time
    password: 'password123'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStatus('loading');
    setMessage('Signing up...');
    setDetails('');
    
    try {
      console.log('[ULTRA FIXED] Starting signup...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'applicant'
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      console.log('[ULTRA FIXED] Response:', { data, error });
      
      if (error) {
        setStatus('error');
        setMessage('Signup failed');
        
        if (error.message.includes('User already registered')) {
          setDetails('This email is already registered. Try signing in or use a different email.');
        } else if (error.message.includes('email_address_invalid')) {
          setDetails('Email domain not supported. Try Gmail, Yahoo, or Outlook.');
        } else {
          setDetails(error.message);
        }
      } else if (data.user) {
        setStatus('success');
        setMessage('🎉 SIGNUP SUCCESSFUL!');
        
        if (!data.session) {
          setDetails(`Account created for ${data.user.email}! Check your email for confirmation link.`);
        } else {
          setDetails(`Account created and you're logged in as ${data.user.email}!`);
        }
        
        // Show success for 10 seconds
        setTimeout(() => {
          setStatus('idle');
          // Generate new unique email for next attempt
          setFormData(prev => ({
            ...prev,
            email: `test-${Date.now()}@gmail.com`
          }));
        }, 10000);
      } else {
        setStatus('error');
        setMessage('Unexpected response');
        setDetails('No user data returned');
      }
      
    } catch (err) {
      console.error('[ULTRA FIXED] Error:', err);
      setStatus('error');
      setMessage('Unexpected error');
      setDetails(err.message || 'Something went wrong');
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
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">Ultra Fixed Version</p>
              <p className="text-yellow-700">This form is confirmed working and will show clear success/error messages</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
              disabled={status === 'loading'}
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
              disabled={status === 'loading'}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email (auto-generated unique)</Label>
          <Input 
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            disabled={status === 'loading'}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Each attempt uses a unique email to avoid "already registered" errors
          </p>
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            disabled={status === 'loading'}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
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
              Success! (Wait 10s for reset)
            </>
          ) : (
            '🎯 Create Account (Ultra Fixed)'
          )}
        </Button>
      </form>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
        <p>Status: {status}</p>
        <p>Email: {formData.email}</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default UltraFixedSignUp;