import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Award, 
  Target, 
  BookOpen, 
  Briefcase,
  GraduationCap,
  Star,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cvProcessingService, CVAnalysisResult } from '@/services/cvProcessingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CVAnalysisInsightsProps {
  className?: string;
}

interface AnalysisStats {
  total_analyses: number;
  completed_analyses: number;
  pending_analyses: number;
  failed_analyses: number;
  latest_analysis_date?: string;
  average_match_score?: number;
}

export const CVAnalysisInsights: React.FC<CVAnalysisInsightsProps> = ({ className }) => {
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check service availability
    setServiceAvailable(cvProcessingService.isServiceAvailable());
    loadCVAnalysis();
  }, []);

  const loadCVAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check service status
      const serviceStatus = cvProcessingService.getServiceStatus();
      if (!serviceStatus.available) {
        setServiceAvailable(false);
        if (serviceStatus.error) {
          console.warn('CV Processing Service not available:', serviceStatus.error);
        }
        // Don't throw error - just show graceful fallback
        setAnalysis(null);
        setStats(null);
        return;
      }

      // Load the latest CV analysis and stats
      const [analysisData, statsData] = await Promise.all([
        cvProcessingService.getLatestCVAnalysis(user.id),
        cvProcessingService.getCVAnalysisStats(user.id)
      ]);

      setAnalysis(analysisData);
      setStats(statsData);
      setServiceAvailable(true);

    } catch (err) {
      console.error('Failed to load CV analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
      setServiceAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const formatMatchScore = (score: number): string => {
    return Math.round(score * 100) + '%';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) {return 'text-green-600';}
    if (score >= 0.6) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8) {return 'bg-green-50 border-green-200';}
    if (score >= 0.6) {return 'bg-yellow-50 border-yellow-200';}
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700">
              <p className="font-medium mb-1">Analysis Error</p>
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCVAnalysis}
                className="mt-2 text-red-600 hover:text-red-700 p-0 h-auto"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Service not available - show informative message
  if (!serviceAvailable) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-medium mb-1">CV Analysis Unavailable</p>
              <p>The CV analysis service is currently initializing or unavailable. Your CV data is safely stored and analysis will be available once the service is ready.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCVAnalysis}
                className="mt-2 text-orange-600 hover:text-orange-700 p-0 h-auto"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Check Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No analysis available yet
  if (!analysis || !stats || stats.completed_analyses === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">CV Analysis</p>
              <p>Upload your CV during onboarding to see personalized insights here.</p>
              {stats && stats.pending_analyses > 0 && (
                <div className="flex items-center mt-2 text-yellow-600">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Analysis in progress...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {/* Match Score Card */}
          <div className={`p-3 border rounded-lg ${getScoreBgColor(analysis.match_score)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className={`h-4 w-4 ${getScoreColor(analysis.match_score)}`} />
                <span className="font-medium text-gray-900 text-sm">Profile Strength</span>
              </div>
              <Badge variant="outline" className={getScoreColor(analysis.match_score)}>
                {formatMatchScore(analysis.match_score)}
              </Badge>
            </div>
            <Progress 
              value={analysis.match_score * 100} 
              className="h-2"
            />
          </div>

          {/* Key Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900 text-sm">Key Strengths</span>
              </div>
              <div className="space-y-1">
                {analysis.strengths.slice(0, 2).map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-green-800">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Areas */}
          {analysis.areas_for_improvement.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900 text-sm">Growth Areas</span>
              </div>
              <div className="space-y-1">
                {analysis.areas_for_improvement.slice(0, 2).map((area, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-orange-800">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            {/* Education */}
            {analysis.education.length > 0 && (
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center space-x-1 mb-1">
                  <GraduationCap className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Education</span>
                </div>
                <span className="text-xs text-purple-700">
                  {analysis.education.length} degree{analysis.education.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Experience */}
            {analysis.work_experience.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-1 mb-1">
                  <Briefcase className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Experience</span>
                </div>
                <span className="text-xs text-blue-700">
                  {analysis.work_experience.length} position{analysis.work_experience.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Research */}
            {(analysis.research.publications.length > 0 || analysis.research.research_projects.length > 0) && (
              <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-md">
                <div className="flex items-center space-x-1 mb-1">
                  <BookOpen className="h-3 w-3 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-900">Research</span>
                </div>
                <span className="text-xs text-indigo-700">
                  {analysis.research.publications.length + analysis.research.research_projects.length} item{(analysis.research.publications.length + analysis.research.research_projects.length) !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Achievements */}
            {analysis.achievements.length > 0 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center space-x-1 mb-1">
                  <Award className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-900">Awards</span>
                </div>
                <span className="text-xs text-yellow-700">
                  {analysis.achievements.length} achievement{analysis.achievements.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Analysis Date */}
          {stats?.latest_analysis_date && (
            <div className="text-center">
              <span className="text-xs text-gray-500">
                Last updated: {new Date(stats.latest_analysis_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};