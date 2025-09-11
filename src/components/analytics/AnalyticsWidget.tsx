import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { analyticsService, type PersonalAnalytics } from '@/services/analyticsService';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Award,
  ArrowRight,
  Clock,
  Target,
  Eye
} from 'lucide-react';

interface AnalyticsWidgetProps {
  user: User;
  className?: string;
}

export default function AnalyticsWidget({ user, className = '' }: AnalyticsWidgetProps) {
  const [personalAnalytics, setPersonalAnalytics] = useState<PersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const analytics = await analyticsService.getPersonalAnalytics(user.id);
      setPersonalAnalytics(analytics);
    } catch (error) {
      console.error('Error loading analytics widget:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!personalAnalytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Analytics data unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (value: number) => {
    if (value >= 80) {return 'text-green-600';}
    if (value >= 60) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getActivityTrend = () => {
    const recentWeeks = personalAnalytics.weekly_activity.slice(-2);
    if (recentWeeks.length < 2) {return null;}
    
    const [prevWeek, currentWeek] = recentWeeks;
    const sessionChange = currentWeek.sessions - prevWeek.sessions;
    const isPositive = sessionChange > 0;
    
    return {
      change: Math.abs(sessionChange),
      positive: isPositive,
      label: isPositive ? 'increase' : 'decrease'
    };
  };

  const activityTrend = getActivityTrend();

  return (
    <Card className={`${className} border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          <span>Analytics Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getProgressColor(personalAnalytics.profile_completion)}`}>
                {personalAnalytics.profile_completion}%
              </div>
              <div className="text-xs text-gray-600">Profile Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {personalAnalytics.total_logins}
              </div>
              <div className="text-xs text-gray-600">Total Sessions</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/50 rounded-lg p-3 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Recent Activity</span>
              {activityTrend && (
                <div className="flex items-center text-xs">
                  {activityTrend.positive ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <Activity className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={activityTrend.positive ? 'text-green-600' : 'text-red-600'}>
                    {activityTrend.change} {activityTrend.label}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                <span>{Math.round(personalAnalytics.time_spent_total / 60)}h spent</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1 text-gray-400" />
                <span>{personalAnalytics.pages_visited} pages</span>
              </div>
            </div>
          </div>

          {/* Features Used */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Features Used</div>
            <div className="flex flex-wrap gap-1">
              {personalAnalytics.features_used.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                  {feature}
                </Badge>
              ))}
              {personalAnalytics.features_used.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{personalAnalytics.features_used.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Latest Achievement */}
          {personalAnalytics.achievements.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Latest Achievement</span>
              </div>
              <div className="text-sm text-yellow-700">
                {personalAnalytics.achievements[0].title}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {new Date(personalAnalytics.achievements[0].date_earned).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Button
            onClick={() => navigate('/analytics')}
            variant="outline"
            size="sm"
            className="w-full mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            View Detailed Analytics
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
        </div>
      </CardContent>
    </Card>
  );
}