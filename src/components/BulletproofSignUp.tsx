import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const BulletproofSignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: 'Wuni',
    lastName: 'Abdulai', 
    email: 'wuniabdulai19@gmail.com',
    password: 'password123'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.warn('🚀 STEP 1: Form submitted! Button click works!');
    
    try {
      console.warn('🔄 STEP 2: About to call Supabase with:', formData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'applicant'
          }
        }
      });
      
      console.warn('BULLETPROOF: Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ STEP 3: Error occurred: ' + error.message);
        console.error('BULLETPROOF: Error:', error);
      } else {
        console.warn('✅ STEP 3: Success! User created: ' + (data.user ? 'YES' : 'NO'), data);
        
        if (data.user && !data.session) {
          console.warn('📧 STEP 4: Email confirmation required. Check your email!');
        } else if (data.user && data.session) {
          console.warn('🎉 STEP 4: Logged in immediately!');
        }
      }
      
    } catch (err) {
      console.error('💥 STEP 3: Unexpected error: ' + (err as Error).message);
      console.error('BULLETPROOF: Catch error:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '3px solid red', 
      borderRadius: '10px', 
      backgroundColor: '#ffe6e6' 
    }}>
      <h2 style={{ color: 'red', textAlign: 'center' }}>🔴 BULLETPROOF SIGNUP</h2>
      <p style={{ textAlign: 'center', fontSize: '14px' }}>
        This will alert you at every step so we can see exactly what happens
      </p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <Label>First Name</Label>
          <Input 
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Label>Last Name</Label>
          <Input 
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Label>Email</Label>
          <Input 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <Label>Password</Label>
          <Input 
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <Button 
          type="submit"
          style={{ 
            width: '100%', 
            backgroundColor: 'red', 
            color: 'white',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🔴 BULLETPROOF SIGNUP (WILL ALERT YOU)
        </Button>
      </form>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#ffcccc', 
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <strong>Instructions:</strong><br/>
        1. Open browser dev tools (F12)<br/>
        2. Go to Console tab<br/>
        3. Click the red signup button<br/>
        4. Watch the alerts and console messages<br/>
        5. Tell me which step fails or if all steps work
      </div>
    </div>
  );
};

export default BulletproofSignUp;