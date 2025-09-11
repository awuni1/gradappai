import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { profilePictureService } from '@/services/profilePictureService';

export interface ProfileAvatarProps {
  userId?: string;
  src?: string | null;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20'
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl'
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  userId,
  src,
  displayName,
  size = 'md',
  className,
  onClick,
  loading = false,
  showOnlineStatus = false,
  isOnline = false
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(src || null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load profile picture from database if userId is provided and no src is given
  useEffect(() => {
    if (userId && !src) {
      setImageLoading(true);
      profilePictureService.getProfilePicture(userId)
        .then(url => {
          setProfileImage(url);
        })
        .catch(error => {
          console.warn('Could not load profile picture:', error);
        })
        .finally(() => {
          setImageLoading(false);
        });
    } else if (src) {
      setProfileImage(src);
    }
  }, [userId, src]);

  // Generate initials fallback
  const initials = displayName ? profilePictureService.generateInitials(displayName) : '?';

  const isLoading = loading || imageLoading;

  return (
    <div className="relative inline-block">
      <Avatar 
        className={cn(
          sizeClasses[size],
          onClick && 'cursor-pointer hover:ring-2 hover:ring-gradapp-primary/20 transition-all duration-200',
          className
        )}
        onClick={onClick}
      >
        {/* Show loading state */}
        {isLoading ? (
          <AvatarFallback className="bg-gradapp-primary/10">
            <div className="animate-spin rounded-full border-2 border-gradapp-primary border-t-transparent w-4 h-4" />
          </AvatarFallback>
        ) : (
          <>
            {/* Profile image */}
            {profileImage && (
              <AvatarImage 
                src={profileImage} 
                alt={`${displayName || 'User'}'s profile picture`}
                className="object-cover"
              />
            )}
            
            {/* Fallback with initials or icon */}
            <AvatarFallback className="bg-gradient-to-br from-gradapp-primary/10 to-gradapp-accent/10 text-gradapp-primary font-semibold">
              {displayName ? (
                <span className={cn('select-none', textSizeClasses[size])}>
                  {initials}
                </span>
              ) : (
                <User 
                  size={
                    size === 'xs' ? 12 : 
                    size === 'sm' ? 16 : 
                    size === 'md' ? 20 : 
                    size === 'lg' ? 24 : 
                    size === 'xl' ? 32 : 40
                  } 
                  className="text-gradapp-primary/60" 
                />
              )}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
          isOnline ? 'bg-green-500' : 'bg-gray-400',
          size === 'xs' ? 'w-2 h-2' :
          size === 'sm' ? 'w-2.5 h-2.5' :
          size === 'md' ? 'w-3 h-3' :
          size === 'lg' ? 'w-3.5 h-3.5' :
          size === 'xl' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      )}

      {/* Click overlay for better UX */}
      {onClick && (
        <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/5 transition-colors duration-200" />
      )}
    </div>
  );
};

export default ProfileAvatar;