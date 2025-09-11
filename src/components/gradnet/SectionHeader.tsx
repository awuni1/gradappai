import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  children?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  action,
  children,
  className
}) => {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Main header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradapp-primary/10">
                <Icon className="h-4 w-4 text-gradapp-primary" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant={badge.variant || 'default'} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </h2>
          </div>
          {description && (
            <p className="text-sm text-gray-600 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="flex-shrink-0"
          >
            {action.label}
          </Button>
        )}
      </div>

      {/* Additional content */}
      {children && (
        <div className="border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;