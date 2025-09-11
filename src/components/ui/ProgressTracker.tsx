import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Minimize2, 
  Maximize2,
  StopCircle 
} from 'lucide-react';
import { ProgressTrackingService, type ProgressUpdate } from '@/services/progressTrackingService';

interface ProgressTrackerProps {
  sessionId: string;
  userId: string;
  onComplete?: (result: ProgressUpdate) => void;
  onError?: (error: string) => void;
  className?: string;
  allowMinimize?: boolean;
  showDetails?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  sessionId,
  userId,
  onComplete,
  onError,
  className = '',
  allowMinimize = true,
  showDetails = true
}) => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!sessionId || !userId) {return;}

    // Subscribe to progress updates
    const unsubscribe = ProgressTrackingService.subscribe(
      sessionId,
      userId,
      (update) => {
        setProgress(update);
      },
      (finalUpdate) => {
        setProgress(finalUpdate);
        onComplete?.(finalUpdate);
        
        // Auto-hide after completion
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      },
      (error) => {
        onError?.(error);
        
        // Auto-hide after error
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    );

    return unsubscribe;
  }, [sessionId, userId, onComplete, onError]);

  const handleCancel = () => {
    if (progress?.canCancel) {
      const success = ProgressTrackingService.cancelOperation(sessionId);
      if (success) {
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      }
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const getStageIcon = (stage: ProgressUpdate['stage']) => {
    switch (stage) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'initializing':
      case 'cv_analysis':
      case 'ai_discovery':
      case 'data_processing':
      case 'background_tasks':
      case 'finalizing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStageColor = (stage: ProgressUpdate['stage']) => {
    switch (stage) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'initializing':
        return 'bg-blue-400';
      case 'cv_analysis':
        return 'bg-purple-500';
      case 'ai_discovery':
        return 'bg-indigo-500';
      case 'data_processing':
        return 'bg-cyan-500';
      case 'background_tasks':
        return 'bg-orange-500';
      case 'finalizing':
        return 'bg-green-400';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {return `${seconds}s`;}
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible || !progress) {return null;}

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-96 shadow-lg border-2 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStageIcon(progress.stage)}
            <CardTitle className="text-sm font-medium">
              {progress.operationType.replace('_', ' ').toUpperCase()} Progress
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {progress.stage.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {allowMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            )}
            
            {progress.canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <StopCircle className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{progress.message}</span>
              <span>{progress.progress}%</span>
            </div>
            <Progress 
              value={progress.progress} 
              className="h-2"
              style={{
                background: `linear-gradient(to right, ${getStageColor(progress.stage)} ${progress.progress}%, #e5e7eb ${progress.progress}%)`
              }}
            />
          </div>

          {/* Details */}
          {showDetails && progress.details && (
            <div className="space-y-2 text-xs">
              {progress.details.currentTask && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Task:</span>
                  <span className="font-medium">{progress.details.currentTask}</span>
                </div>
              )}
              
              {progress.details.completedTasks !== undefined && progress.details.totalTasks && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks:</span>
                  <span className="font-medium">
                    {progress.details.completedTasks} / {progress.details.totalTasks}
                  </span>
                </div>
              )}
              
              {progress.details.estimatedTimeRemaining !== undefined && progress.details.estimatedTimeRemaining > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-medium">
                    {formatTimeRemaining(progress.details.estimatedTimeRemaining)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Errors and Warnings */}
          {progress.details?.errors && progress.details.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600">Errors:</p>
              {progress.details.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-500 bg-red-50 p-1 rounded">
                  {error}
                </p>
              ))}
            </div>
          )}

          {progress.details?.warnings && progress.details.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-600">Warnings:</p>
              {progress.details.warnings.map((warning, index) => (
                <p key={index} className="text-xs text-yellow-600 bg-yellow-50 p-1 rounded">
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Completion Message */}
          {progress.stage === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-xs text-green-700 font-medium">
                ✅ {progress.message}
              </p>
            </div>
          )}

          {/* Error Message */}
          {progress.stage === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700 font-medium">
                ❌ {progress.message}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProgressTracker;