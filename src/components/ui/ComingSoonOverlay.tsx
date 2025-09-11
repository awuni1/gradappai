import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Sparkles, 
  Clock, 
  Bell, 
  ArrowRight,
  Rocket,
  Users,
  Calendar,
  MessageCircle
} from 'lucide-react';

interface ComingSoonOverlayProps {
  feature: string;
  description: string;
  expectedDate?: string;
  features?: string[];
  onNotifyMe?: () => void;
  className?: string;
}

export default function ComingSoonOverlay({ 
  feature, 
  description, 
  expectedDate,
  features = [],
  onNotifyMe,
  className = ""
}: ComingSoonOverlayProps) {
  const handleNotifyMe = () => {
    if (onNotifyMe) {
      onNotifyMe();
    } else {
      // Default notification action
      alert(`Thanks for your interest! We'll notify you when ${feature} is ready.`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg"></div>
      
      {/* Coming Soon Content */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur border-2 border-blue-200 shadow-xl">
          <CardContent className="p-8 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 p-1 rounded-full animate-pulse">
                  <Sparkles className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
            </div>

            {/* Badge */}
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {feature}
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {description}
            </p>

            {/* Expected Date */}
            {expectedDate && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Expected: {expectedDate}</span>
                </div>
              </div>
            )}

            {/* Features List */}
            {features.length > 0 && (
              <div className="mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-3 text-center">What's Coming:</h4>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleNotifyMe}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notify Me When Ready
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('mailto:support@gradapp.com?subject=Feature Request: ' + feature, '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Request Priority Access
              </Button>
            </div>

            {/* Fine print */}
            <p className="text-xs text-gray-500 mt-4">
              Join thousands of users waiting for this feature
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}