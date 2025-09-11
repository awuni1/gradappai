import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Video,
  Calendar,
  Globe,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  BookOpen,
  Heart,
  Settings,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import type { OnboardingData } from './MentorOnboardingContainer';

interface MentoringPreferencesStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  validationErrors?: Record<string, string[]>;
}

const MentoringPreferencesStep: React.FC<MentoringPreferencesStepProps> = ({
  data,
  onDataChange,
  validationErrors = {}
}) => {
  const [showAdvancedPreferences, setShowAdvancedPreferences] = useState(false);
  const [menteeCapacity, setMenteeCapacity] = useState(data.mentoring_capacity || [5]);

  const studentLevels = [
    { id: 'undergraduate', label: 'Undergraduate', icon: User, color: 'bg-blue-500' },
    { id: 'masters', label: 'Masters', icon: GraduationCap, color: 'bg-green-500' },
    { id: 'phd', label: 'PhD', icon: BookOpen, color: 'bg-purple-500' },
    { id: 'postdoc', label: 'Post-Doc', icon: Heart, color: 'bg-pink-500' }
  ];

  const communicationMethods = [
    { id: 'video_calls', label: 'Video Calls', icon: Video, description: 'Face-to-face virtual meetings' },
    { id: 'messaging', label: 'Messaging', icon: MessageCircle, description: 'Text-based conversations' },
    { id: 'email', label: 'Email', icon: Settings, description: 'Formal email communication' },
    { id: 'in_person', label: 'In-Person', icon: MapPin, description: 'Physical meetings when possible' }
  ];

  const timeCommitments = [
    { id: 'light', label: 'Light', hours: '1-3 hours/week', description: 'Perfect for busy schedules' },
    { id: 'moderate', label: 'Moderate', hours: '4-6 hours/week', description: 'Standard mentoring commitment' },
    { id: 'intensive', label: 'Intensive', hours: '7+ hours/week', description: 'Deep mentoring engagement' }
  ];

  const handleStudentLevelToggle = (levelId: string) => {
    const currentLevels = data.preferred_mentee_levels || [];
    const updatedLevels = currentLevels.includes(levelId)
      ? currentLevels.filter((id: string) => id !== levelId)
      : [...currentLevels, levelId];
    
    onDataChange({
      ...data,
      preferred_mentee_levels: updatedLevels
    });
  };

  const handleCommunicationToggle = (methodId: string) => {
    const currentMethods = data.communication_preferences || [];
    const updatedMethods = currentMethods.includes(methodId)
      ? currentMethods.filter((id: string) => id !== methodId)
      : [...currentMethods, methodId];
    
    onDataChange({
      ...data,
      communication_preferences: updatedMethods
    });
  };

  const handleCapacityChange = (value: number[]) => {
    setMenteeCapacity(value);
    onDataChange({
      ...data,
      mentoring_capacity: value[0]
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Mentoring Style</h2>
        <p className="text-gray-600">Help us match you with the right students by sharing your preferences</p>
        <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-purple-50 rounded-full">
          <Info className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-800">All preferences are optional and can be updated later</span>
        </div>
      </motion.div>

      {/* Student Level Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              Student Levels You'd Like to Mentor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {studentLevels.map((level, index) => {
                const isSelected = (data.preferred_mentee_levels || []).includes(level.id);
                const IconComponent = level.icon;
                
                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:shadow-lg'
                      }`}
                      onClick={() => handleStudentLevelToggle(level.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 ${level.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{level.label}</h4>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mx-auto mt-2"
                          >
                            <Heart className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mentoring Capacity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              How Many Students Can You Mentor?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Number of Students</Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {menteeCapacity[0]} student{menteeCapacity[0] !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Slider
                  value={menteeCapacity}
                  onValueChange={handleCapacityChange}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 student</span>
                  <span>20+ students</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Recommendation:</strong> Starting with 3-5 students allows you to provide quality mentorship while managing your time effectively.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Communication Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              Preferred Communication Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {communicationMethods.map((method, index) => {
                const isSelected = (data.communication_preferences || []).includes(method.id);
                const IconComponent = method.icon;
                
                return (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleCommunicationToggle(method.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{method.label}</h4>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                            >
                              <Heart className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Preferences (Progressive Disclosure) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                Advanced Preferences
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedPreferences(!showAdvancedPreferences)}
                className="text-purple-600 hover:text-purple-700"
              >
                {showAdvancedPreferences ? (
                  <>
                    Hide <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {showAdvancedPreferences && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-6">
                  {/* Geographic Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Geographic Preferences</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location_preference">Preferred Student Locations (Optional)</Label>
                      <Input
                        id="location_preference"
                        placeholder="e.g., North America, Europe, Global"
                        value={data.location_preference || ''}
                        onChange={(e) => onDataChange({ ...data, location_preference: e.target.value })}
                      />
                      <p className="text-xs text-gray-600">Leave blank to mentor students globally</p>
                    </div>
                  </div>

                  {/* Time Zone Preference */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Time Zone Flexibility</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Accept students in different time zones</Label>
                        <p className="text-sm text-gray-600">Enable to mentor students worldwide</p>
                      </div>
                      <Switch
                        checked={data.timezone_flexible || false}
                        onCheckedChange={(checked) => onDataChange({ ...data, timezone_flexible: checked })}
                      />
                    </div>
                  </div>

                  {/* Mentoring Philosophy */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Your Mentoring Philosophy</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mentoring_philosophy">How would you describe your mentoring approach?</Label>
                      <Textarea
                        id="mentoring_philosophy"
                        placeholder="e.g., I believe in guiding students to discover their own solutions while providing structured support and industry insights..."
                        value={data.mentoring_philosophy || ''}
                        onChange={(e) => onDataChange({ ...data, mentoring_philosophy: e.target.value })}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-gray-600">This helps students understand your mentoring style</p>
                    </div>
                  </div>

                  {/* Availability Notes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Availability Notes</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability_notes">Additional availability information</Label>
                      <Textarea
                        id="availability_notes"
                        placeholder="e.g., Available weekday evenings EST, prefer scheduled sessions over ad-hoc messaging..."
                        value={data.availability_notes || ''}
                        onChange={(e) => onDataChange({ ...data, availability_notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Your Mentoring Profile Summary</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Student Levels:</p>
                <p className="font-medium text-gray-900">
                  {(data.preferred_mentee_levels || []).length > 0 
                    ? (data.preferred_mentee_levels || []).join(', ') 
                    : 'All levels'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Mentoring Capacity:</p>
                <p className="font-medium text-gray-900">
                  {data.mentoring_capacity || 5} student{(data.mentoring_capacity || 5) !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Communication:</p>
                <p className="font-medium text-gray-900">
                  {(data.communication_preferences || []).length > 0 
                    ? (data.communication_preferences || []).join(', ') 
                    : 'All methods'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Global Mentoring:</p>
                <p className="font-medium text-gray-900">
                  {data.timezone_flexible ? 'Yes' : 'Local timezone preferred'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MentoringPreferencesStep;