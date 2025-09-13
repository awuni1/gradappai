import React from 'react';
import { User } from '@supabase/supabase-js';
import MessageCenter from './MessageCenter';

interface NetworkingHubProps {
  user: User;
}

const NetworkingHub: React.FC<NetworkingHubProps> = ({ user }) => {
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Loading Messaging...</h2>
        <p className="text-gray-600">Please wait while we load your messaging center.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <MessageCenter user={user} />
    </div>
  );
};

export default NetworkingHub;