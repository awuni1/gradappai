import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  BookOpen, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

export interface DiscoveryStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  estimatedDuration: number; // in seconds
  startTime?: Date;
  endTime?: Date;
}

export interface FacultyDiscoveryProgressProps {
  isVisible: boolean;
  currentUniversity: string;
  stages: DiscoveryStage[];
  overallProgress: number;
  estimatedTimeRemaining: number;
  discoveredCount: number;
  onCancel?: () => void;
  onComplete?: () => void;
  onMinimize?: () => void;
}

const defaultStages: DiscoveryStage[] = [
  {
    id: 'url_discovery',
    name: 'Finding Faculty Directory',
    description: 'Locating university faculty directory pages',
    status: 'pending',
    icon: Search,
    estimatedDuration: 10
  },
  {
    id: 'faculty_extraction',
    name: 'Extracting Faculty Profiles',
    description: 'Gathering faculty information and contact details',
    status: 'pending',
    icon: Users,
    estimatedDuration: 30
  },
  {
    id: 'publication_analysis',
    name: 'Analyzing Publications',
    description: 'Extracting recent publications and research areas',
    status: 'pending',
    icon: BookOpen,
    estimatedDuration: 25
  },
  {
    id: 'compatibility_scoring',
    name: 'Calculating Compatibility',
    description: 'Generating match scores based on research alignment',
    status: 'pending',
    icon: Target,
    estimatedDuration: 15
  }
];

export const FacultyDiscoveryProgress: React.FC<FacultyDiscoveryProgressProps> = ({
  isVisible,
  currentUniversity,
  stages = defaultStages,
  overallProgress,
  estimatedTimeRemaining,
  discoveredCount,
  onCancel,
  onComplete,
  onMinimize
}) => {
  const [minimized, setMinimized] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if any stage has an error
  useEffect(() => {
    const errorStage = stages.find(stage => stage.status === 'error');
    setHasError(Boolean(errorStage));
  }, [stages]);

  // Auto-complete when all stages are done
  useEffect(() => {
    const allCompleted = stages.every(stage => stage.status === 'completed');
    if (allCompleted && onComplete) {
      setTimeout(() => onComplete(), 1000); // Small delay for user to see completion
    }
  }, [stages, onComplete]);

  if (!isVisible) {return null;}

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {return `${seconds}s`;}
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageIcon = (stage: DiscoveryStage) => {
    const IconComponent = stage.icon;
    
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <IconComponent className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <IconComponent className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageStatus = (stage: DiscoveryStage) => {
    switch (stage.status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Pending</Badge>;
    }
  };

  if (minimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-l-4 border-l-blue-500 z-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Discovering Faculty</p>
                <p className="text-xs text-gray-600">{currentUniversity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {discoveredCount} found
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMinimized(false)}
                className="h-8 w-8 p-0"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={overallProgress} className="mt-2 h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-xl border-l-4 border-l-blue-500 z-50 max-h-[80vh] overflow-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Faculty Discovery
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinimized(true)}
              className="h-8 w-8 p-0"
            >
              <Clock className="h-4 w-4" />
            </Button>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>University: <span className="font-medium">{currentUniversity}</span></span>
            <span>Faculty found: <span className="font-medium text-blue-600">{discoveredCount}</span></span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{Math.round(overallProgress)}% complete</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(estimatedTimeRemaining)} remaining
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStageIcon(stage)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{stage.name}</h4>
                  {getStageStatus(stage)}
                </div>
                <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                
                {/* Stage progress bar for in-progress stages */}
                {stage.status === 'in_progress' && (
                  <div className="space-y-1">
                    <Progress value={75} className="h-1" />
                    <p className="text-xs text-gray-500">Processing...</p>
                  </div>
                )}
                
                {/* Timing information */}
                {stage.startTime && (
                  <div className="text-xs text-gray-500">
                    {stage.status === 'completed' && stage.endTime ? (
                      <span>Completed in {Math.round((stage.endTime.getTime() - stage.startTime.getTime()) / 1000)}s</span>
                    ) : stage.status === 'in_progress' ? (
                      <span>Started {Math.round((Date.now() - stage.startTime.getTime()) / 1000)}s ago</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Error state */}
          {hasError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">Discovery encountered an issue</p>
              </div>
              <p className="text-xs text-red-700 mb-3">
                Some faculty information may be incomplete. You can retry or view partial results.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Retry Failed Steps
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  View Partial Results
                </Button>
              </div>
            </div>
          )}
          
          {/* Success state */}
          {overallProgress === 100 && !hasError && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">Faculty discovery completed!</p>
              </div>
              <p className="text-xs text-green-700 mb-3">
                Found {discoveredCount} faculty members with detailed compatibility analysis.
              </p>
              <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700">
                View Faculty Matches
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyDiscoveryProgress;