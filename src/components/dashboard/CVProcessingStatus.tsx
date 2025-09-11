import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CVProcessingStatusProps {
  className?: string;
}

interface ProcessingStatus {
  id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  cv_file_path: string;
  processing_error?: string;
  created_at: string;
  processed_at?: string;
}

export const CVProcessingStatus: React.FC<CVProcessingStatusProps> = ({ className }) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadProcessingStatus();
    
    // Set up polling for pending/processing status
    const interval = setInterval(() => {
      if (status?.processing_status === 'pending' || status?.processing_status === 'processing') {
        loadProcessingStatus();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [status?.processing_status]);

  useEffect(() => {
    // Animate progress for processing status
    if (status?.processing_status === 'processing') {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {return 90;} // Cap at 90% until actually complete
          return prev + Math.random() * 10;
        });
      }, 1000);

      return () => clearInterval(progressInterval);
    } else if (status?.processing_status === 'completed') {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [status?.processing_status]);

  const loadProcessingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      // Get the most recent CV analysis record
      const { data, error } = await supabase
        .from('cv_analysis')
        .select('id, processing_status, cv_file_path, processing_error, created_at, processed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load processing status:', error);
        return;
      }

      setStatus(data);
    } catch (error) {
      console.error('Error loading processing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status?.processing_status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.processing_status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusMessage = () => {
    switch (status?.processing_status) {
      case 'pending':
        return {
          title: 'CV Analysis Queued',
          description: 'Your CV has been uploaded and is waiting to be processed. This usually takes just a few moments.'
        };
      case 'processing':
        return {
          title: 'Analyzing Your CV',
          description: 'Our AI is currently extracting and analyzing your CV content to provide personalized insights.'
        };
      case 'completed':
        return {
          title: 'Analysis Complete',
          description: 'Your CV has been successfully analyzed! Check your dashboard for personalized insights and recommendations.'
        };
      case 'failed':
        return {
          title: 'Analysis Failed',
          description: status.processing_error || 'Something went wrong during CV analysis. Please try uploading your CV again.'
        };
      default:
        return {
          title: 'No CV Analysis',
          description: 'Upload your CV during onboarding to get AI-powered insights about your profile.'
        };
    }
  };

  const handleRetry = async () => {
    if (!status) {return;}

    try {
      setLoading(true);
      
      // Reset status to pending to trigger reprocessing
      const { error } = await supabase
        .from('cv_analysis')
        .update({ 
          processing_status: 'pending',
          processing_error: null 
        })
        .eq('id', status.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Processing Restarted',
        description: 'Your CV analysis has been queued for reprocessing.',
      });

      // Refresh status
      loadProcessingStatus();
    } catch (error) {
      console.error('Failed to retry processing:', error);
      toast({
        title: 'Retry Failed',
        description: 'Could not restart CV processing. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null; // No CV uploaded
  }

  const statusInfo = getStatusMessage();

  return (
    <div className={className}>
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            {getStatusIcon()}
            <span>{statusInfo.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-600">{statusInfo.description}</p>
          
          {/* Progress Bar for Processing */}
          {(status.processing_status === 'processing' || status.processing_status === 'completed') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Analysis Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Processing Time Info */}
          {status.processed_at && (
            <div className="text-xs text-gray-500">
              Completed: {new Date(status.processed_at).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {status.processing_status === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Analysis
              </Button>
            )}
            
            {status.processing_status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                View Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};