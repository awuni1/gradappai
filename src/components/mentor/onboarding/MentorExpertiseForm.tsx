import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Users, Plus, X, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import { MentorOnboardingData } from '@/types/mentorTypes';

interface MentorExpertiseFormProps {
  data: MentorOnboardingData;
  onDataChange: (data: Partial<MentorOnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const MentorExpertiseForm: React.FC<MentorExpertiseFormProps> = ({
  data,
  onDataChange,
  validationErrors
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newMentoringArea, setNewMentoringArea] = useState('');

  const popularMentoringAreas = [
    'Application Strategy',
    'Statement of Purpose',
    'CV/Resume Review',
    'Interview Preparation',
    'Research Guidance',
    'Career Planning',
    'Academic Writing',
    'Scholarship Applications',
    'Program Selection',
    'Networking & Professional Development'
  ];

  const menteelevels = [
    'Undergraduate',
    'Master\'s Students',
    'PhD Applicants',
    'Postdoctoral Researchers',
    'Early Career Professionals',
    'Career Changers'
  ];

  const addKeyword = () => {
    if (newKeyword.trim() && !data.expertise_keywords?.includes(newKeyword.trim())) {
      const updated = [...(data.expertise_keywords || []), newKeyword.trim()];
      onDataChange({ expertise_keywords: updated });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    const updated = data.expertise_keywords?.filter(k => k !== keyword) || [];
    onDataChange({ expertise_keywords: updated });
  };

  const addMentoringArea = (area: string) => {
    if (!data.mentoring_areas?.includes(area)) {
      const updated = [...(data.mentoring_areas || []), area];
      onDataChange({ mentoring_areas: updated });
    }
  };

  const removeMentoringArea = (area: string) => {
    const updated = data.mentoring_areas?.filter(a => a !== area) || [];
    onDataChange({ mentoring_areas: updated });
  };

  const addCustomMentoringArea = () => {
    if (newMentoringArea.trim() && !data.mentoring_areas?.includes(newMentoringArea.trim())) {
      const updated = [...(data.mentoring_areas || []), newMentoringArea.trim()];
      onDataChange({ mentoring_areas: updated });
      setNewMentoringArea('');
    }
  };

  const toggleMenteeLevel = (level: string) => {
    const current = data.preferred_mentee_levels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onDataChange({ preferred_mentee_levels: updated });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Mentoring Expertise
        </h3>
        <p className="text-gray-600">
          Define your areas of expertise and mentoring preferences
        </p>
      </div>

      {/* Mentoring Areas */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Mentoring Areas *</h4>
        </div>

        <p className="text-gray-600 mb-4">
          Select the areas where you can provide the most value to mentees
        </p>

        {/* Popular Areas */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Popular Mentoring Areas</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {popularMentoringAreas.map((area) => {
              const isSelected = data.mentoring_areas?.includes(area);
              return (
                <motion.button
                  key={area}
                  type="button"
                  onClick={() => isSelected ? removeMentoringArea(area) : addMentoringArea(area)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {area}
                  {isSelected && <Star className="w-4 h-4 inline ml-1" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Custom Area Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a custom mentoring area..."
            value={newMentoringArea}
            onChange={(e) => setNewMentoringArea(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomMentoringArea()}
          />
          <Button
            type="button"
            onClick={addCustomMentoringArea}
            disabled={!newMentoringArea.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected Areas */}
        {data.mentoring_areas && data.mentoring_areas.length > 0 && (
          <div className="mt-4">
            <Label className="text-sm font-medium mb-2 block">Selected Areas ({data.mentoring_areas.length})</Label>
            <div className="flex flex-wrap gap-2">
              {data.mentoring_areas.map((area) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 pr-1"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeMentoringArea(area)}
                    className="ml-2 hover:bg-purple-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {validationErrors.mentoring_areas && (
          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.mentoring_areas[0]}
          </p>
        )}
      </GlassmorphicCard>

      {/* Expertise Keywords */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Expertise Keywords *</h4>
        </div>

        <p className="text-gray-600 mb-4">
          Add keywords that describe your expertise and help students find you
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="e.g., Machine Learning, Data Science, PhD Applications..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
          />
          <Button
            type="button"
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {data.expertise_keywords && data.expertise_keywords.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Your Expertise Keywords ({data.expertise_keywords.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {data.expertise_keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 pr-1"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 hover:bg-blue-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {validationErrors.expertise_keywords && (
          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.expertise_keywords[0]}
          </p>
        )}
      </GlassmorphicCard>

      {/* Preferred Mentee Levels */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Preferred Mentee Levels</h4>
        </div>

        <p className="text-gray-600 mb-4">
          Select the academic/career levels you prefer to mentor
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {menteelevels.map((level) => {
            const isSelected = data.preferred_mentee_levels?.includes(level);
            return (
              <motion.button
                key={level}
                type="button"
                onClick={() => toggleMenteeLevel(level)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {level}
                {isSelected && <Star className="w-4 h-4 inline ml-1" />}
              </motion.button>
            );
          })}
        </div>
      </GlassmorphicCard>

      {/* Mentoring Capacity */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Mentoring Capacity</h4>
        </div>

        <p className="text-gray-600 mb-4">
          How many mentees can you effectively support at once?
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Number of Mentees: {data.mentoring_capacity || 5}
            </Label>
            <Slider
              value={[data.mentoring_capacity || 5]}
              onValueChange={([value]) => onDataChange({ mentoring_capacity: value })}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 mentee</span>
              <span>20+ mentees</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Recommended:</strong> Start with 3-5 mentees to maintain quality mentorship.
              You can always adjust this later as you gain experience.
            </p>
          </div>
        </div>
      </GlassmorphicCard>

      {/* Mentoring Philosophy */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Mentoring Philosophy</h4>
        </div>

        <div>
          <Label htmlFor="mentoring_philosophy" className="text-sm font-medium mb-2 block">
            Describe Your Mentoring Approach
          </Label>
          <Textarea
            id="mentoring_philosophy"
            placeholder="Share your mentoring philosophy, approach, and what mentees can expect from working with you..."
            value={data.mentoring_philosophy || ''}
            onChange={(e) => onDataChange({ mentoring_philosophy: e.target.value })}
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-2">
            This helps potential mentees understand your mentoring style and expectations.
          </p>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default MentorExpertiseForm;