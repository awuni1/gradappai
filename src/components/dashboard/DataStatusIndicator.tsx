import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Database,
  FileText,
  GraduationCap,
  Target,
  Users,
  Info
} from 'lucide-react';
import { dataIntegrityService } from '@/services/dataIntegrityService';
import { supabase } from '@/integrations/supabase/client';

interface DataStatusProps {
  className?: string;
}

const DataStatusIndicator: React.FC<DataStatusProps> = ({ className }) => {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const checkDataStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      const status = await dataIntegrityService.testCompleteDataFlow(user.id);
      setDataStatus(status);
    } catch (error) {
      console.error('Error checking data status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check data status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fixDataIssues = async () => {
    setFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      const result = await dataIntegrityService.fixDataIntegrityIssues(user.id);
      
      if (result.fixed.length > 0) {
        toast({
          title: 'Data Issues Fixed',
          description: `Fixed: ${result.fixed.join(', ')}`,
        });
      }

      if (result.stillBroken.length > 0) {
        toast({
          title: 'Some Issues Remain',
          description: `Still broken: ${result.stillBroken.join(', ')}`,
          variant: 'destructive',
        });
      }

      // Refresh status
      await checkDataStatus();
    } catch (error) {
      console.error('Error fixing data issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix data issues',
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    checkDataStatus();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <AlertCircle className="h-4 w-4" />;
      case 'poor': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const calculateCompletionScore = () => {
    if (!dataStatus) {return 0;}
    
    let score = 0;
    if (dataStatus.cvData.cvAnalysis) {score += 25;}
    if (dataStatus.cvData.academicProfile) {score += 25;}
    if (dataStatus.cvData.researchInterests) {score += 20;}
    if (dataStatus.matchingData.hasMatches) {score += 20;}
    if (dataStatus.matchingData.usingCVData) {score += 10;}
    
    return score;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dataStatus) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Unable to check data status</p>
        </CardContent>
      </Card>
    );
  }

  const completionScore = calculateCompletionScore();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Integrity
          </div>
          <Badge className={getHealthColor(dataStatus.overallHealth)}>
            {getHealthIcon(dataStatus.overallHealth)}
            <span className="ml-1 capitalize">{dataStatus.overallHealth}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Completion */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Data Completion</span>
            <span className="font-medium">{completionScore}%</span>
          </div>
          <Progress value={completionScore} className="h-2" />
        </div>

        {/* CV Data Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CV Analysis Data
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.cvData.cvAnalysis ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {dataStatus.cvData.cvAnalysis ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Analysis
            </div>
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.cvData.academicProfile ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {dataStatus.cvData.academicProfile ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Profile
            </div>
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.cvData.researchInterests ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {dataStatus.cvData.researchInterests ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Interests
            </div>
          </div>
        </div>

        {/* Onboarding Data Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Profile Data
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.onboardingData.hasOnboardingProfile ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {dataStatus.onboardingData.hasOnboardingProfile ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              Onboarding
            </div>
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.onboardingData.dataComplete ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {dataStatus.onboardingData.dataComplete ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              Complete
            </div>
          </div>
        </div>

        {/* Matching Data Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.matchingData.hasMatches ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {dataStatus.matchingData.hasMatches ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {dataStatus.matchingData.matchesCount} Unis
            </div>
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.matchingData.facultyCount > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <Users className="h-3 w-3" />
              {dataStatus.matchingData.facultyCount} Faculty
            </div>
            <div className={`p-2 rounded flex items-center gap-1 ${dataStatus.matchingData.usingCVData ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {dataStatus.matchingData.usingCVData ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              CV-Enhanced
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {dataStatus.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommendations</h4>
            <div className="space-y-1">
              {dataStatus.recommendations.slice(0, 2).map((rec: string, index: number) => (
                <p key={index} className="text-xs text-gray-600 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {rec}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkDataStatus}
            disabled={loading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          
          {(dataStatus.cvData.issues.length > 0 || dataStatus.onboardingData.issues.length > 0) && (
            <Button
              size="sm"
              onClick={fixDataIssues}
              disabled={fixing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {fixing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              Auto-Fix
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataStatusIndicator;