import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  X, 
  Plus, 
  GraduationCap,
  BookOpen,
  Award,
  Microscope,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

import type { OnboardingData } from './MentorOnboardingContainer';

interface AcademicProgramStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  validationErrors?: Record<string, string[]>;
}


const AcademicProgramStep: React.FC<AcademicProgramStepProps> = ({
  data,
  onDataChange,
  validationErrors = {}
}) => {
  const { toast } = useToast();
  const [researchInterests, setResearchInterests] = useState<string[]>(data.research_interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [publications, setPublications] = useState<string[]>(data.key_publications || []);
  const [newPublication, setNewPublication] = useState('');

  // Add research interest
  const addResearchInterest = () => {
    if (newInterest.trim() && !researchInterests.includes(newInterest.trim())) {
      const updatedInterests = [...researchInterests, newInterest.trim()];
      setResearchInterests(updatedInterests);
      setNewInterest('');
      onDataChange({
        ...data,
        research_interests: updatedInterests
      });
    }
  };

  // Remove research interest
  const removeResearchInterest = (interest: string) => {
    const updatedInterests = researchInterests.filter(i => i !== interest);
    setResearchInterests(updatedInterests);
    onDataChange({
      ...data,
      research_interests: updatedInterests
    });
  };

  // Add publication
  const addPublication = () => {
    if (newPublication.trim() && !publications.includes(newPublication.trim())) {
      const updatedPublications = [...publications, newPublication.trim()];
      setPublications(updatedPublications);
      setNewPublication('');
      onDataChange({
        ...data,
        key_publications: updatedPublications
      });
    }
  };

  // Remove publication
  const removePublication = (publication: string) => {
    const updatedPublications = publications.filter(p => p !== publication);
    setPublications(updatedPublications);
    onDataChange({
      ...data,
      key_publications: updatedPublications
    });
  };

  return (
    <div className="space-y-8">

      {/* Academic Background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Academic Background</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="highest_degree">Highest Degree</Label>
            <Input
              id="highest_degree"
              placeholder="e.g., Ph.D. in Computer Science"
              value={data.highest_degree || ''}
              onChange={(e) => onDataChange({ ...data, highest_degree: e.target.value })}
              className={validationErrors.highest_degree ? 'border-red-500' : ''}
            />
            {validationErrors.highest_degree && (
              <p className="text-sm text-red-600">{validationErrors.highest_degree[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input
              id="institution"
              placeholder="e.g., Stanford University"
              value={data.alma_mater || ''}
              onChange={(e) => onDataChange({ ...data, alma_mater: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduation_year">Graduation Year</Label>
            <Input
              id="graduation_year"
              type="number"
              placeholder="e.g., 2020"
              value={data.graduation_year || ''}
              onChange={(e) => onDataChange({ ...data, graduation_year: parseInt(e.target.value) || null })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_experience">Years of Experience</Label>
            <Input
              id="years_experience"
              type="number"
              placeholder="e.g., 5"
              value={data.years_of_experience || ''}
              onChange={(e) => onDataChange({ ...data, years_of_experience: parseInt(e.target.value) || null })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_position">Current Position</Label>
            <Input
              id="current_position"
              placeholder="e.g., Assistant Professor"
              value={data.current_position || ''}
              onChange={(e) => onDataChange({ ...data, current_position: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publications_count">Number of Publications</Label>
            <Input
              id="publications_count"
              type="number"
              placeholder="e.g., 15"
              value={data.publications_count || ''}
              onChange={(e) => onDataChange({ ...data, publications_count: parseInt(e.target.value) || null })}
            />
          </div>
        </div>
      </motion.div>

      {/* Research Interests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Microscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Research Interests</h3>
            <p className="text-sm text-gray-600">Add your areas of expertise and research focus</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Machine Learning, Computer Vision"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addResearchInterest()}
              className="flex-1"
            />
            <Button onClick={addResearchInterest} disabled={!newInterest.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <AnimatePresence>
            {researchInterests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {researchInterests.map((interest, index) => (
                  <motion.div
                    key={interest}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-800">
                      {interest}
                      <button
                        onClick={() => removeResearchInterest(interest)}
                        className="ml-1 hover:text-indigo-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {validationErrors.research_interests && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.research_interests[0]}
            </div>
          )}
        </div>
      </motion.div>

      {/* Key Publications (Optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Key Publications <span className="text-sm font-normal text-gray-500">(Optional)</span></h3>
            <p className="text-sm text-gray-600">List your most important or recent publications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="e.g., 'Deep Learning for Computer Vision', Nature 2023"
              value={newPublication}
              onChange={(e) => setNewPublication(e.target.value)}
              className="flex-1 min-h-[80px]"
            />
            <Button onClick={addPublication} disabled={!newPublication.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <AnimatePresence>
            {publications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {publications.map((publication, index) => (
                  <motion.div
                    key={publication}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <BookOpen className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <p className="flex-1 text-sm text-orange-900">{publication}</p>
                    <button
                      onClick={() => removePublication(publication)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AcademicProgramStep;