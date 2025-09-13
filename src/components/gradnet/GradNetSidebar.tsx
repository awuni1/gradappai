import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Network, 
  TrendingUp,
  Globe,
  GraduationCap,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  shortLabel: string;
}

interface GradNetSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string | null;
  unreadMessageCount: number;
  pendingRequestsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const GradNetSidebar: React.FC<GradNetSidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  unreadMessageCount,
  pendingRequestsCount,
  isCollapsed,
  onToggleCollapse
}) => {
  // Get tab configuration based on user role
  const getTabConfiguration = () => {
    if (userRole === 'mentor') {
      return [
        { id: 'feed', label: 'Social Feed', icon: Globe, shortLabel: 'Feed' },
        { id: 'applicants', label: 'Find Applicants', icon: GraduationCap, shortLabel: 'Applicants' },
        { id: 'requests', label: 'Connection Requests', icon: UserPlus, shortLabel: 'Requests' },
        { id: 'messages', label: 'Messages', icon: MessageCircle, shortLabel: 'Messages' },
        // { id: 'network', label: 'My Network', icon: TrendingUp, shortLabel: 'Network' },
        { id: 'documents', label: 'Documents', icon: FileText, shortLabel: 'Docs' }
      ];
    } 
      return [
        { id: 'feed', label: 'Social Feed', icon: Globe, shortLabel: 'Feed' },
        // { id: 'mentors', label: 'Find Mentors', icon: Users, shortLabel: 'Mentors' },
        { id: 'requests', label: 'Connection Requests', icon: UserPlus, shortLabel: 'Requests' },
        { id: 'messages', label: 'Messages', icon: MessageCircle, shortLabel: 'Messages' },
        { id: 'documents', label: 'Documents', icon: FileText, shortLabel: 'Docs' }
        // { id: 'network', label: 'My Network', icon: TrendingUp, shortLabel: 'Network' }
      ];
    
  };

  const tabs = getTabConfiguration();

  const getBadgeCount = (tabId: string) => {
    if (tabId === 'messages' && unreadMessageCount > 0) {
      return unreadMessageCount;
    }
    if (tabId === 'requests' && pendingRequestsCount > 0) {
      return pendingRequestsCount;
    }
    return 0;
  };

  const getBadgeVariant = (tabId: string) => {
    if (tabId === 'messages') {return 'destructive';}
    if (tabId === 'requests') {return 'default';}
    return 'default';
  };

  return (
    <div className={cn(
      "h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gradapp-primary flex items-center gap-2">
                <Network className="h-5 w-5" />
                GradNet
              </h2>
              <p className="text-xs text-gray-500 mt-1">Social Network</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gradapp-primary"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = getBadgeCount(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                "hover:bg-gray-50 hover:text-gradapp-primary",
                isActive
                  ? "bg-gradapp-primary/10 text-gradapp-primary border border-gradapp-primary/20"
                  : "text-gray-600"
              )}
            >
              <IconComponent className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-gradapp-primary" : "text-gray-500"
              )} />
              
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-medium">
                    {tab.label}
                  </span>
                  
                  {badgeCount > 0 && (
                    <Badge 
                      variant={getBadgeVariant(tab.id)}
                      className={cn(
                        "text-xs min-w-[20px] h-5 flex items-center justify-center",
                        tab.id === 'requests' && "bg-orange-500 hover:bg-orange-600"
                      )}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </>
              )}

              {/* Collapsed state badge */}
              {isCollapsed && badgeCount > 0 && (
                <Badge 
                  variant={getBadgeVariant(tab.id)}
                  className={cn(
                    "absolute -top-1 -right-1 text-xs min-w-[16px] h-4 flex items-center justify-center",
                    tab.id === 'requests' && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>Your Role:</span>
              <Badge variant="outline" className="text-xs">
                {userRole === 'mentor' ? 'Mentor' : 'Applicant'}
              </Badge>
            </div>
            
            {(unreadMessageCount > 0 || pendingRequestsCount > 0) && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                {unreadMessageCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Unread:</span>
                    <span className="text-red-600 font-medium">{unreadMessageCount}</span>
                  </div>
                )}
                {pendingRequestsCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Pending:</span>
                    <span className="text-orange-600 font-medium">{pendingRequestsCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradNetSidebar;