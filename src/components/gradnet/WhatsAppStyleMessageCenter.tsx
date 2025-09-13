import React from 'react';
import { User } from '@supabase/supabase-js';

interface WhatsAppStyleMessageCenterProps {
  user: User | null;
}

const WhatsAppStyleMessageCenter: React.FC<WhatsAppStyleMessageCenterProps> = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-400 mt-20">Messages are disabled</h2>
      <p className="text-gray-500 mt-2">Please check back later.</p>
    </div>
  );
};

export default WhatsAppStyleMessageCenter;
