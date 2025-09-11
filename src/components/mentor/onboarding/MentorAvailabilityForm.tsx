import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import { MentorOnboardingData, MentorAvailability } from '@/types/mentorTypes';

interface MentorAvailabilityFormProps {
  data: MentorOnboardingData;
  onDataChange: (data: Partial<MentorOnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const MentorAvailabilityForm: React.FC<MentorAvailabilityFormProps> = ({
  data,
  onDataChange,
  validationErrors
}) => {
  const [schedule, setSchedule] = useState<Partial<MentorAvailability>[]>(
    data.availability_schedule || []
  );

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'
  ];

  const addTimeSlot = () => {
    const newSlot: Partial<MentorAvailability> = {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: true,
      is_active: true,
      timezone: data.timezone || 'UTC'
    };
    
    const updated = [...schedule, newSlot];
    setSchedule(updated);
    onDataChange({ availability_schedule: updated });
  };

  const updateTimeSlot = (index: number, field: string, value: any) => {
    const updated = schedule.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updated);
    onDataChange({ availability_schedule: updated });
  };

  const removeTimeSlot = (index: number) => {
    const updated = schedule.filter((_, i) => i !== index);
    setSchedule(updated);
    onDataChange({ availability_schedule: updated });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Set Your Availability
        </h3>
        <p className="text-gray-600">
          Let mentees know when you're available for sessions
        </p>
      </div>

      {/* Timezone Selection */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Timezone & Preferences</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone" className="text-sm font-medium mb-2 block">
              Your Timezone *
            </Label>
            <Select
              value={data.timezone || 'UTC'}
              onValueChange={(value) => onDataChange({ timezone: value })}
            >
              <SelectTrigger className={validationErrors.timezone ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.timezone && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.timezone[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="response_time" className="text-sm font-medium mb-2 block">
              Response Time (hours)
            </Label>
            <Select
              value={data.response_time_hours?.toString() || '48'}
              onValueChange={(value) => onDataChange({ response_time_hours: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Response time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">72 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassmorphicCard>

      {/* Availability Schedule */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Weekly Schedule</h4>
          </div>
          <Button
            type="button"
            onClick={addTimeSlot}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Time Slot
          </Button>
        </div>

        {schedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No availability set yet</p>
            <p className="text-sm">Add time slots to let mentees know when you're available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 bg-white/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Time Slot {index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Day</Label>
                    <Select
                      value={slot.day_of_week?.toString() || '1'}
                      onValueChange={(value) => updateTimeSlot(index, 'day_of_week', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.id} value={day.id.toString()}>
                            {day.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1 block">Start Time</Label>
                    <Select
                      value={slot.start_time || '09:00'}
                      onValueChange={(value) => updateTimeSlot(index, 'start_time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1 block">End Time</Label>
                    <Select
                      value={slot.end_time || '17:00'}
                      onValueChange={(value) => updateTimeSlot(index, 'end_time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id={`recurring-${index}`}
                      checked={slot.is_recurring || false}
                      onCheckedChange={(checked) => updateTimeSlot(index, 'is_recurring', checked)}
                    />
                    <Label htmlFor={`recurring-${index}`} className="text-sm">
                      Recurring
                    </Label>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassmorphicCard>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Availability Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set consistent time slots to help mentees plan ahead</li>
          <li>• Consider time zones when working with international mentees</li>
          <li>• You can always adjust your availability later</li>
          <li>• Block out time for preparation and follow-up</li>
        </ul>
      </div>
    </div>
  );
};

export default MentorAvailabilityForm;