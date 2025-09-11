import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Building, CheckCircle, AlertCircle, Globe, Shield, RefreshCw, Database, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import MentorBadge from '@/components/ui/MentorBadge';
import { MentorOnboardingData, MentorInstitution } from '@/types/mentorTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  checkMentorDatabaseHealth, 
  getSampleInstitutions, 
  getMigrationScript,
  withRetry,
  DatabaseHealth
} from '@/utils/mentorDatabaseSetup';
import {
  trackInstitutionLoadError,
  trackDatabaseHealthCheck,
  trackFallbackDataUsed
} from '@/utils/mentorMonitoring';

interface MentorInstitutionFormProps {
  data: MentorOnboardingData;
  onDataChange: (data: Partial<MentorOnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const MentorInstitutionForm: React.FC<MentorInstitutionFormProps> = ({
  data,
  onDataChange,
  validationErrors
}) => {
  const [institutions, setInstitutions] = useState<MentorInstitution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState<MentorInstitution | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInstitution, setCustomInstitution] = useState('');
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDatabaseError, setShowDatabaseError] = useState(false);
  const [showMigrationScript, setShowMigrationScript] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (data.institution_id) {
      const institution = institutions.find(inst => inst.id === data.institution_id);
      if (institution) {
        setSelectedInstitution(institution);
      }
    }
  }, [data.institution_id, institutions]);

  // Circuit breaker to prevent excessive retries
  const canAttemptFetch = useCallback(() => {
    const now = Date.now();
    const cooldownPeriod = 5000; // 5 seconds between attempts
    const maxRetries = 3;
    
    return (
      isMountedRef.current &&
      !isFetching &&
      retryCount < maxRetries &&
      (now - lastAttemptTime) > cooldownPeriod
    );
  }, [isFetching, retryCount, lastAttemptTime]);

  const fetchInstitutions = useCallback(async () => {
    // Prevent multiple simultaneous requests and excessive retries
    if (!canAttemptFetch()) {
      console.log('Fetch prevented by circuit breaker', { 
        isFetching, 
        retryCount, 
        timeSinceLastAttempt: Date.now() - lastAttemptTime 
      });
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      setLastAttemptTime(Date.now());

      // Create new abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // First check database health
      const health = await checkMentorDatabaseHealth();
      
      // Check if component is still mounted
      if (!isMountedRef.current) {return;}
      
      setDbHealth(health);
      trackDatabaseHealthCheck(health);
      
      if (health.errors.length > 0) {
        console.error('Database health issues:', health.errors);
        
        // If mentor_institutions table doesn't exist, use fallback data
        if (!health.mentorInstitutionsExists) {
          console.warn('Using fallback institution data');
          
          if (!isMountedRef.current) {return;}
          
          setInstitutions(getSampleInstitutions() as MentorInstitution[]);
          setShowDatabaseError(true);
          setRetryCount(0); // Reset retry count since we have a solution
          trackFallbackDataUsed('MentorInstitutionForm', 'table_not_exists');
          // Removed toast to prevent navigation side effects - error shown in UI instead
          console.warn('Database setup incomplete. Using sample institutions.');
          return;
        }
      }

      // Attempt to fetch institutions with retry
      const result = await withRetry(async () => {
        if (!isMountedRef.current) {throw new Error('Component unmounted');}
        
        const { data: institutionsData, error } = await supabase
          .from('universities')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {throw error;}
        return institutionsData || [];
      }, 3, 1000);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {return;}

      setInstitutions(result);
      setRetryCount(0); // Reset retry count on success
      setShowDatabaseError(false); // Hide error on success
      
      if (result.length === 0) {
        toast.warning('No institutions found. You can add your institution manually.');
        setShowCustom(true);
      }
      
    } catch (error: any) {
      // Check if component is still mounted and error is not from abort
      if (!isMountedRef.current || error.name === 'AbortError') {
        return;
      }

      console.error('Error fetching institutions:', error);
      trackInstitutionLoadError(error);
      
      // Calculate new retry count to avoid race condition
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // After multiple failures, use fallback data and show database error
      if (newRetryCount >= 3) {
        console.warn('Multiple fetch failures, using fallback data');
        setInstitutions(getSampleInstitutions() as MentorInstitution[]);
        setShowDatabaseError(true);
        trackFallbackDataUsed('MentorInstitutionForm', 'multiple_fetch_failures');
        console.error('Unable to load institutions. Using sample data. Please set up the database.');
      } else {
        console.error(`Failed to load institutions (Attempt ${newRetryCount}/3)`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [canAttemptFetch, retryCount, lastAttemptTime]);

  // Initial fetch on component mount
  useEffect(() => {
    if (isMountedRef.current && institutions.length === 0 && !isFetching) {
      fetchInstitutions();
    }
  }, [fetchInstitutions, institutions.length, isFetching]);

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    institution.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInstitutionSelect = (institution: MentorInstitution) => {
    setSelectedInstitution(institution);
    setShowCustom(false);
    onDataChange({
      institution_id: institution.id,
      sso_provider: institution.sso_provider,
      custom_institution: undefined
    });
  };

  const handleCustomInstitution = () => {
    setShowCustom(true);
    setSelectedInstitution(null);
    onDataChange({
      institution_id: undefined,
      sso_provider: undefined,
      custom_institution: customInstitution
    });
  };

  const handleCustomInstitutionChange = (value: string) => {
    setCustomInstitution(value);
    onDataChange({
      institution_id: undefined,
      sso_provider: undefined,
      custom_institution: value
    });
  };

  const handleRetry = useCallback(() => {
    // Reset all retry-related state
    setRetryCount(0);
    setShowDatabaseError(false);
    setIsFetching(false);
    setLastAttemptTime(0);
    
    // Small delay to ensure state updates are processed
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchInstitutions();
      }
    }, 100);
  }, [fetchInstitutions]);

  const copyMigrationScript = async () => {
    try {
      await navigator.clipboard.writeText(getMigrationScript());
      toast.success('Migration script copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy. Please copy manually from the text area.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Loading institutions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Database Error Warning */}
      {showDatabaseError && dbHealth && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassmorphicCard className="p-6 bg-amber-50/50 border-amber-200">
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-6 h-6 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 mb-2">Database Setup Required</h4>
                <p className="text-sm text-amber-700 mb-3">
                  The mentor platform database tables haven't been set up yet. This is a one-time setup required for the mentor features to work properly.
                </p>
                
                {dbHealth.errors.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-amber-800 mb-1">Issues found:</h5>
                    <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                      {dbHealth.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {dbHealth.suggestions.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-amber-800 mb-1">Suggestions:</h5>
                    <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                      {dbHealth.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => setShowMigrationScript(!showMigrationScript)}
                    variant="outline"
                    size="sm"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50"
                  >
                    <Database className="w-4 h-4 mr-1" />
                    Show Setup Instructions
                  </Button>
                  <Button
                    onClick={() => setShowCustom(true)}
                    variant="outline"
                    size="sm"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50"
                  >
                    Continue Anyway
                  </Button>
                </div>
              </div>
            </div>

            {showMigrationScript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 border-t border-amber-200 pt-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-amber-800">Database Migration Script</h5>
                  <Button
                    onClick={copyMigrationScript}
                    size="sm"
                    variant="outline"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Script
                  </Button>
                </div>
                <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>Instructions:</strong> Copy the script below and run it in your Supabase Dashboard → SQL Editor
                  </p>
                  <textarea
                    className="w-full h-32 p-3 text-xs font-mono bg-white border border-amber-200 rounded resize-none"
                    value={getMigrationScript()}
                    readOnly
                  />
                </div>
              </motion.div>
            )}
          </GlassmorphicCard>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Institution
        </h3>
        <p className="text-gray-600">
          Select your university or organization to enable verification and SSO features
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search institutions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Selected Institution */}
      {selectedInstitution && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassmorphicCard variant="mentor" className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedInstitution.logo_url ? (
                  <img
                    src={selectedInstitution.logo_url}
                    alt={selectedInstitution.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                )}
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedInstitution.name}
                  </h4>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {selectedInstitution.domain}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedInstitution.sso_provider && (
                  <MentorBadge type="verified" showLabel />
                )}
                {selectedInstitution.sso_provider && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">SSO Available</span>
                  </div>
                )}
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {selectedInstitution.sso_provider && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800">
                      Single Sign-On (SSO) Available
                    </h5>
                    <p className="text-sm text-green-700 mt-1">
                      You can sign in using your university credentials for enhanced security and automatic verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassmorphicCard>
        </motion.div>
      )}

      {/* Custom Institution */}
      {showCustom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassmorphicCard className="p-6">
            <Label htmlFor="custom_institution" className="text-base font-medium mb-2 block">
              Institution Name
            </Label>
            <Input
              id="custom_institution"
              placeholder="Enter your institution name"
              value={customInstitution}
              onChange={(e) => handleCustomInstitutionChange(e.target.value)}
              className="h-12 text-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Your institution will be reviewed for verification eligibility.
            </p>
          </GlassmorphicCard>
        </motion.div>
      )}

      {/* Institution List */}
      {!showCustom && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredInstitutions.length > 0 ? (
            filteredInstitutions.map((institution) => (
              <motion.div
                key={institution.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlassmorphicCard
                  hoverable
                  onClick={() => handleInstitutionSelect(institution)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedInstitution?.id === institution.id
                      ? 'ring-2 ring-purple-500 bg-purple-50/50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {institution.logo_url ? (
                        <img
                          src={institution.logo_url}
                          alt={institution.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {institution.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {institution.domain}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {institution.sso_provider && (
                        <MentorBadge type="verified" size="sm" />
                      )}
                      {institution.country && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {institution.country}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassmorphicCard>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No institutions found
              </h4>
              <p className="text-gray-600 mb-4">
                Can't find your institution? You can add it manually.
              </p>
              <Button
                variant="outline"
                onClick={handleCustomInstitution}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                Add Custom Institution
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Custom Institution Option */}
      {!showCustom && filteredInstitutions.length > 0 && (
        <div className="text-center pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleCustomInstitution}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            Can't find your institution? Add it manually
          </Button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.institution && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-red-800">Validation Error</h5>
              <ul className="text-sm text-red-700 mt-1">
                {validationErrors.institution.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Benefits Info */}
      <GlassmorphicCard className="p-6 bg-blue-50/50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Benefits of Institution Verification
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Enhanced profile credibility and trust
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Access to university-specific mentorship programs
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Single Sign-On (SSO) for secure authentication
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Priority matching with students from your institution
          </li>
        </ul>
      </GlassmorphicCard>
    </div>
  );
};

export default MentorInstitutionForm;