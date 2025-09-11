import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, BookOpen, Lightbulb, Plus, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingData } from '../OnboardingWizard';

interface TargetProgramStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const degreeOptions = [
  { value: 'masters', label: 'Master\'s Degree', description: 'MS, MA, MEng, etc.' },
  { value: 'phd', label: 'PhD', description: 'Doctoral research degree' },
  { value: 'mba', label: 'MBA', description: 'Master of Business Administration' },
  { value: 'professional', label: 'Professional Degree', description: 'MD, JD, PharmD, etc.' },
  { value: 'certificate', label: 'Certificate Program', description: 'Specialized certification' },
  { value: 'other', label: 'Other', description: 'Other degree types' }
];

const popularFields = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Architecture',
  'Business Administration',
  'Data Science',
  'Artificial Intelligence',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Economics',
  'Psychology',
  'Medicine',
  'Law',
  'Education',
  'Environmental Science'
];

export const TargetProgramStep: React.FC<TargetProgramStepProps> = ({
  data,
  updateData,
  onNext,
  onPrevious
}) => {
  const [newResearchInterest, setNewResearchInterest] = useState('');
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  const handleDegreeSelect = (degree: string) => {
    updateData({ targetDegreeLevel: degree });
  };

  const handleFieldChange = (field: string) => {
    updateData({ targetField: field });
    setFieldSearchQuery(field);
  };

  const addResearchInterest = () => {
    if (newResearchInterest.trim() && !data.researchInterests.includes(newResearchInterest.trim())) {
      updateData({
        researchInterests: [...data.researchInterests, newResearchInterest.trim()]
      });
      setNewResearchInterest('');
    }
  };

  const removeResearchInterest = (interest: string) => {
    updateData({
      researchInterests: data.researchInterests.filter(item => item !== interest)
    });
  };

  const filteredFields = popularFields.filter(field =>
    field.toLowerCase().includes(fieldSearchQuery.toLowerCase())
  );

  const isFormValid = () => {
    return Boolean(data.targetDegreeLevel &&
      data.targetField.trim() &&
      data.researchInterests.length > 0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What are your academic goals?
        </h2>
        <p className="text-gray-600">
          Tell us about the program you want to pursue and your research interests
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Target Degree Level */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <span>Target Degree Level *</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {degreeOptions.map((degree) => (
                  <motion.div
                    key={degree.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        data.targetDegreeLevel === degree.value
                          ? 'ring-2 ring-purple-500 bg-purple-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleDegreeSelect(degree.value)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {degree.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {degree.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Program Field */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <span>Program Field *</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetField" className="text-sm font-medium">
                  What field do you want to study?
                </Label>
                <Input
                  id="targetField"
                  value={fieldSearchQuery}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  placeholder="e.g., Computer Science, Mechanical Engineering..."
                  className="mt-1"
                />
              </div>

              {fieldSearchQuery && filteredFields.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium text-gray-700">
                    Popular fields matching your search:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filteredFields.slice(0, 8).map((field) => (
                      <Badge
                        key={field}
                        variant={data.targetField === field ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-purple-100"
                        onClick={() => handleFieldChange(field)}
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Research Interests */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-purple-500" />
                <span>Research Interests *</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Add your research interests or areas you'd like to explore
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Research Interest */}
              <div className="flex space-x-2">
                <Input
                  value={newResearchInterest}
                  onChange={(e) => setNewResearchInterest(e.target.value)}
                  placeholder="e.g., Machine Learning, Renewable Energy..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addResearchInterest();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addResearchInterest}
                  disabled={!newResearchInterest.trim()}
                  className="px-4 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display Research Interests */}
              {data.researchInterests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium">
                    Your research interests ({data.researchInterests.length}):
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {data.researchInterests.map((interest, index) => (
                      <motion.div
                        key={interest}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Badge
                          variant="secondary"
                          className="pr-1 py-1 bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                          {interest}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResearchInterest(interest)}
                            className="ml-1 h-4 w-4 p-0 hover:bg-purple-200"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {data.researchInterests.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Add at least one research interest to continue
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Career Goals (Optional) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span>Career Goals (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.careerGoals}
                onChange={(e) => updateData({ careerGoals: e.target.value })}
                placeholder="Tell us about your career aspirations and what you hope to achieve with this degree..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div variants={itemVariants} className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Step</span>
          </Button>

          <Button
            onClick={onNext}
            disabled={!isFormValid()}
            size="lg"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
          </Button>
        </motion.div>

        {!isFormValid() && (
          <motion.p
            variants={itemVariants}
            className="text-sm text-red-500 text-center"
          >
            Please complete all required fields: degree level, program field, and at least one research interest
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};