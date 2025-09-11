import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Briefcase, Linkedin, Camera, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData } from './MentorOnboardingContainer';

interface BasicInfoStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onDataChange,
  validationErrors,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Handle field changes
  const handleFieldChange = (field: keyof OnboardingData, value: string) => {
    onDataChange({ [field]: value });
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `mentor-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mentor-assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('mentor-assets')
        .getPublicUrl(filePath);

      onDataChange({ professionalPhotoUrl: publicUrl });
      toast.success('Photo uploaded successfully!');

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error uploading photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Get field error from validation errors
  const getFieldError = (field: string): string => {
    return validationErrors[field]?.[0] || '';
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div
        className="text-center mb-8"
        variants={fieldVariants}
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about yourself
        </h2>
        <p className="text-gray-600">
          This information helps students understand your background and expertise.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        className="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl border border-white/30 p-8"
        variants={fieldVariants}
      >
        <div className="space-y-6">
          {/* Profile Photo */}
          <motion.div variants={fieldVariants} className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Photo (Optional)
            </label>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {data.professionalPhotoUrl || data.photo_url ? (
                    <img
                      src={data.professionalPhotoUrl || data.photo_url}
                      alt="Professional photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              {isUploading && (
                <p className="text-sm text-purple-600 mt-2">Uploading...</p>
              )}
            </div>
          </motion.div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.fullName || ''}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    getFieldError('fullName') ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="Enter your full name"
                />
              </div>
              {getFieldError('fullName') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('fullName')}</p>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={data.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    getFieldError('email') ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="your.email@example.com"
                  disabled={Boolean(data.email)} // Pre-filled from auth
                />
              </div>
              {getFieldError('email') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
              )}
            </motion.div>
          </div>

          {/* Phone & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={data.phoneNumber || ''}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    getFieldError('phoneNumber') ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {getFieldError('phoneNumber') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('phoneNumber')}</p>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.location || ''}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    getFieldError('location') ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="City, Country"
                />
              </div>
              {getFieldError('location') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('location')}</p>
              )}
            </motion.div>
          </div>

          {/* Professional Title */}
          <motion.div variants={fieldVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Title *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={data.professionalTitle || ''}
                onChange={(e) => handleFieldChange('professionalTitle', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  getFieldError('professionalTitle') ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                placeholder="e.g., Senior Software Engineer, Research Scientist, Professor"
              />
            </div>
            {getFieldError('professionalTitle') && (
              <p className="text-red-500 text-sm mt-1">{getFieldError('professionalTitle')}</p>
            )}
          </motion.div>

          {/* LinkedIn Profile */}
          <motion.div variants={fieldVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile (Optional)
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={data.linkedinProfile || ''}
                onChange={(e) => handleFieldChange('linkedinProfile', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  getFieldError('linkedinProfile') ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>
            {getFieldError('linkedinProfile') && (
              <p className="text-red-500 text-sm mt-1">{getFieldError('linkedinProfile')}</p>
            )}
          </motion.div>

          {/* Bio */}
          <motion.div variants={fieldVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={data.bio || ''}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                rows={4}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  getFieldError('bio') ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                placeholder="Tell students about your background, expertise, and what you're passionate about mentoring. Minimum 50 characters."
              />
            </div>
            <div className="flex justify-between mt-1">
              {getFieldError('bio') && (
                <p className="text-red-500 text-sm">{getFieldError('bio')}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {(data.bio || '').length}/50 characters minimum
              </p>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;