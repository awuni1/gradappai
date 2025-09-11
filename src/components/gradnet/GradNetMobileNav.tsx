import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Network, 
  TrendingUp,
  Globe,
  GraduationCap,
  UserPlus
} from 'lucide-react';

interface GradNetMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string | null;
  unreadMessageCount: number;
  pendingRequestsCount: number;
}

const GradNetMobileNav: React.FC<GradNetMobileNavProps> = ({
  activeTab,
  onTabChange,
  userRole,
  unreadMessageCount,
  pendingRequestsCount
}) => {
  // Get primary tabs for mobile (max 5 tabs)
  const getMobileTabConfiguration = () => {
    if (userRole === 'mentor') {
      return [
        { id: 'feed', label: 'Feed', icon: Globe },
        { id: 'applicants', label: 'Find', icon: GraduationCap },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
        { id: 'requests', label: 'Requests', icon: UserPlus },
        { id: 'network', label: 'Network', icon: TrendingUp }
      ];
    } 
      return [
        { id: 'feed', label: 'Feed', icon: Globe },
        { id: 'mentors', label: 'Mentors', icon: Users },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
        { id: 'requests', label: 'Requests', icon: UserPlus },
        { id: 'documents', label: 'Docs', icon: FileText }
      ];
    
  };

  const tabs = getMobileTabConfiguration();

  const getBadgeCount = (tabId: string) => {
    if (tabId === 'messages' && unreadMessageCount > 0) {
      return unreadMessageCount;
    }
    if (tabId === 'requests' && pendingRequestsCount > 0) {
      return pendingRequestsCount;
    }
    return 0;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = getBadgeCount(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 relative transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "text-gradapp-primary"
                  : "text-gray-500"
              )}
            >
              {/* Icon with badge */}
              <div className="relative">
                <IconComponent className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-gradapp-primary" : "text-gray-500"
                )} />
                
                {badgeCount > 0 && (
                  <Badge 
                    variant={tab.id === 'messages' ? 'destructive' : 'default'}
                    className={cn(
                      "absolute -top-2 -right-2 text-xs min-w-[16px] h-4 flex items-center justify-center",
                      tab.id === 'requests' && "bg-orange-500 hover:bg-orange-600"
                    )}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </Badge>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-gradapp-primary" : "text-gray-500"
              )}>
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradapp-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Safe area for devices with bottom notch */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
};

export default GradNetMobileNav;