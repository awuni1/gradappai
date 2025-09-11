import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContentCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  children,
  className,
  headerContent,
  variant = 'default'
}) => {
  const cardVariants = {
    default: "shadow-sm border-gray-200",
    elevated: "shadow-md border-gray-200",
    flat: "shadow-none border-gray-100"
  };

  return (
    <Card className={cn(
      "bg-white transition-all duration-200 hover:shadow-md",
      cardVariants[variant],
      className
    )}>
      {(title || description || headerContent) && (
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-sm text-gray-600">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerContent && (
              <div className="flex-shrink-0">
                {headerContent}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        "space-y-4",
        (title || description || headerContent) ? "pt-0" : "pt-6"
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ContentCard;