import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Upload, User, School, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleCVUpload } from '../SimpleCVUpload';
import { OnboardingData } from '../OnboardingWizard';

interface AcademicBackgroundStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const degreeOptions = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Professional Degree',
  'Doctoral Degree',
  'Other'
];

export const AcademicBackgroundStep: React.FC<AcademicBackgroundStepProps> = ({
  data,
  updateData,
  onNext
}) => {
  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    updateData({ [field]: value });
  };

  const handleGPAChange = (value: string) => {
    // Allow only numbers with up to 2 decimal places between 0 and 4
    const regex = /^([0-3](\.\d{0,2})?|4(\.0{0,2})?)$/;
    if (value === '' || regex.test(value)) {
      updateData({ gpa: value });
    }
  };

  const isFormValid = () => {
    return Boolean(data.firstName.trim() &&
      data.lastName.trim() &&
      data.currentDegree &&
      data.currentInstitution.trim());
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
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your academic background
        </h2>
        <p className="text-gray-600">
          Let's start with your basic information and current education status
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <motion.div variants={itemVariants}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={data.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={data.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Educational Background */}
        <motion.div variants={itemVariants}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <School className="h-5 w-5 text-blue-500" />
                <span>Educational Background</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentDegree" className="text-sm font-medium">
                  Current/Most Recent Degree *
                </Label>
                <Select
                  value={data.currentDegree}
                  onValueChange={(value) => handleInputChange('currentDegree', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your degree" />
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
                <Label htmlFor="currentInstitution" className="text-sm font-medium">
                  University/Institution *
                </Label>
                <Input
                  id="currentInstitution"
                  value={data.currentInstitution}
                  onChange={(e) => handleInputChange('currentInstitution', e.target.value)}
                  placeholder="e.g., Harvard University"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gpa" className="text-sm font-medium">
                  GPA (Optional)
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="gpa"
                    value={data.gpa}
                    onChange={(e) => handleGPAChange(e.target.value)}
                    placeholder="e.g., 3.75"
                    className="pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Scale: 0.0 - 4.0
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CV Upload Section */}
      <motion.div variants={itemVariants} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-500" />
              <span>Upload Your CV/Resume</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Upload your CV or resume to help us understand your background better (optional)
            </p>
          </CardHeader>
          <CardContent>
            <SimpleCVUpload
              file={data.cvFile}
              onFileSelect={(file) => updateData({ cvFile: file })}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          size="lg"
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Target Program
        </Button>
        {!isFormValid() && (
          <p className="text-sm text-red-500 mt-2">
            Please complete all required fields marked with *
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};