import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Award, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import { MentorOnboardingData } from '@/types/mentorTypes';

interface MentorProfessionalFormProps {
  data: MentorOnboardingData;
  onDataChange: (data: Partial<MentorOnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const MentorProfessionalForm: React.FC<MentorProfessionalFormProps> = ({
  data,
  onDataChange,
  validationErrors
}) => {
  const [workExperiences, setWorkExperiences] = useState(
    data.industry_experience?.experiences || []
  );

  const degreeOptions = [
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'MBA',
    'PhD',
    'PostDoc',
    'MD',
    'JD',
    'Other'
  ];

  const experienceRanges = [
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10-15 years',
    '15+ years'
  ];

  const addWorkExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      duration: '',
      description: ''
    };
    const updated = [...workExperiences, newExperience];
    setWorkExperiences(updated);
    onDataChange({
      industry_experience: {
        ...data.industry_experience,
        experiences: updated
      }
    });
  };

  const updateWorkExperience = (id: string, field: string, value: string) => {
    const updated = workExperiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    setWorkExperiences(updated);
    onDataChange({
      industry_experience: {
        ...data.industry_experience,
        experiences: updated
      }
    });
  };

  const removeWorkExperience = (id: string) => {
    const updated = workExperiences.filter(exp => exp.id !== id);
    setWorkExperiences(updated);
    onDataChange({
      industry_experience: {
        ...data.industry_experience,
        experiences: updated
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Professional Background
        </h3>
        <p className="text-gray-600">
          Tell us about your professional experience and academic achievements
        </p>
      </div>

      {/* Current Position */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Current Position</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="current_position" className="text-sm font-medium mb-2 block">
              Position/Title *
            </Label>
            <Input
              id="current_position"
              placeholder="e.g., Assistant Professor, Senior Data Scientist"
              value={data.current_position || ''}
              onChange={(e) => onDataChange({ current_position: e.target.value })}
              className={validationErrors.current_position ? 'border-red-300' : ''}
            />
            {validationErrors.current_position && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.current_position[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="department" className="text-sm font-medium mb-2 block">
              Department/Division
            </Label>
            <Input
              id="department"
              placeholder="e.g., Computer Science, Engineering"
              value={data.department || ''}
              onChange={(e) => onDataChange({ department: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="years_experience" className="text-sm font-medium mb-2 block">
              Years of Experience *
            </Label>
            <Select
              value={data.years_of_experience?.toString() || ''}
              onValueChange={(value) => onDataChange({ years_of_experience: parseInt(value) })}
            >
              <SelectTrigger className={validationErrors.years_of_experience ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select experience range" />
              </SelectTrigger>
              <SelectContent>
                {experienceRanges.map((range, index) => (
                  <SelectItem key={range} value={index.toString()}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.years_of_experience && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.years_of_experience[0]}
              </p>
            )}
          </div>
        </div>
      </GlassmorphicCard>

      {/* Academic Background */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Academic Background</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="highest_degree" className="text-sm font-medium mb-2 block">
              Highest Degree
            </Label>
            <Select
              value={data.highest_degree || ''}
              onValueChange={(value) => onDataChange({ highest_degree: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your highest degree" />
              </SelectTrigger>
              <SelectContent>
                {degreeOptions.map((degree) => (
                  <SelectItem key={degree} value={degree}>
                    {degree}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="publications_count" className="text-sm font-medium mb-2 block">
              Number of Publications
            </Label>
            <Input
              id="publications_count"
              type="number"
              min="0"
              placeholder="0"
              value={data.publications_count || ''}
              onChange={(e) => onDataChange({ publications_count: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="research_areas" className="text-sm font-medium mb-2 block">
            Research Areas (comma-separated)
          </Label>
          <Input
            id="research_areas"
            placeholder="e.g., Machine Learning, Data Science, Computer Vision"
            value={data.research_areas?.join(', ') || ''}
            onChange={(e) => onDataChange({ 
              research_areas: e.target.value.split(',').map(area => area.trim()).filter(Boolean)
            })}
          />
        </div>
      </GlassmorphicCard>

      {/* Work Experience */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Work Experience</h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addWorkExperience}
            className="flex items-center gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </Button>
        </div>

        {workExperiences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No work experience added yet</p>
            <p className="text-sm">Click "Add Experience" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workExperiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 rounded-lg p-4 bg-white/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Experience {index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkExperience(experience.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Company/Organization</Label>
                    <Input
                      placeholder="e.g., Google, Stanford University"
                      value={experience.company || ''}
                      onChange={(e) => updateWorkExperience(experience.id, 'company', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1 block">Position</Label>
                    <Input
                      placeholder="e.g., Software Engineer, Research Assistant"
                      value={experience.position || ''}
                      onChange={(e) => updateWorkExperience(experience.id, 'position', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium mb-1 block">Duration</Label>
                    <Input
                      placeholder="e.g., Jan 2020 - Present, 2 years"
                      value={experience.duration || ''}
                      onChange={(e) => updateWorkExperience(experience.id, 'duration', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium mb-1 block">Description</Label>
                    <Textarea
                      placeholder="Brief description of your role and achievements..."
                      value={experience.description || ''}
                      onChange={(e) => updateWorkExperience(experience.id, 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassmorphicCard>

      {/* Professional Summary */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Professional Summary</h4>
        </div>

        <div>
          <Label htmlFor="professional_summary" className="text-sm font-medium mb-2 block">
            Brief Professional Summary
          </Label>
          <Textarea
            id="professional_summary"
            placeholder="Provide a brief summary of your professional background, key achievements, and what makes you a great mentor..."
            value={data.industry_experience?.summary || ''}
            onChange={(e) => onDataChange({
              industry_experience: {
                ...data.industry_experience,
                summary: e.target.value
              }
            })}
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-2">
            This will help potential mentees understand your background and expertise.
          </p>
        </div>
      </GlassmorphicCard>

      {/* Tips */}
      <GlassmorphicCard className="p-6 bg-blue-50/50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">💡 Tips for a Strong Profile</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
            <span>Be specific about your current role and responsibilities</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
            <span>Include any teaching, mentoring, or leadership experience</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
            <span>Highlight achievements that demonstrate your expertise</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
            <span>Mention any industry recognition or awards</span>
          </li>
        </ul>
      </GlassmorphicCard>
    </div>
  );
};

export default MentorProfessionalForm;