import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar,
  Clock,
  Video,
  User as UserIcon,
  FileText,
  Save,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: User;
  session?: MentorshipSession | null;
}

interface MentorshipSession {
  id: string;
  mentorship_id: string;
  title: string;
  description?: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  agenda?: string;
  student_profile: {
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
  };
}

interface StudentMentorship {
  id: string;
  student_id: string;
  student_profile: {
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
  };
}

const SessionForm: React.FC<SessionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  session
}) => {
  const [formData, setFormData] = useState({
    mentorship_id: '',
    title: '',
    description: '',
    session_type: 'general_guidance',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    agenda: '',
    meeting_link: ''
  });
  const [studentMentorships, setStudentMentorships] = useState<StudentMentorship[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadStudentMentorships();
      if (session) {
        populateFormData(session);
      } else {
        resetForm();
      }
    }
  }, [isOpen, session]);

  const loadStudentMentorships = async () => {
    setLoading(true);
    try {
      const { data: mentorships, error } = await supabase
        .from('mentor_student_relationships')
        .select(`
          id,
          student_id,
          student_profile:student_id (
            display_name,
            profile_image_url,
            field_of_study,
            academic_level
          )
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'active');

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Mock data for demonstration
      const mockMentorships: StudentMentorship[] = [
        {
          id: 'mentorship-1',
          student_id: 'student-1',
          student_profile: {
            display_name: 'Sarah Johnson',
            profile_image_url: undefined,
            field_of_study: 'Computer Science',
            academic_level: 'undergraduate'
          }
        },
        {
          id: 'mentorship-2',
          student_id: 'student-2',
          student_profile: {
            display_name: 'Michael Chen',
            profile_image_url: undefined,
            field_of_study: 'Biology',
            academic_level: 'masters'
          }
        },
        {
          id: 'mentorship-3',
          student_id: 'student-3',
          student_profile: {
            display_name: 'Emma Rodriguez',
            profile_image_url: undefined,
            field_of_study: 'Psychology',
            academic_level: 'phd'
          }
        },
        {
          id: 'mentorship-4',
          student_id: 'student-4',
          student_profile: {
            display_name: 'David Kim',
            profile_image_url: undefined,
            field_of_study: 'Engineering',
            academic_level: 'masters'
          }
        }
      ];

      setStudentMentorships(mentorships || mockMentorships);

    } catch (error) {
      console.error('Error loading mentorships:', error);
      toast.error('Failed to load your students');
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (sessionData: MentorshipSession) => {
    const scheduledDate = new Date(sessionData.scheduled_at);
    setFormData({
      mentorship_id: sessionData.mentorship_id,
      title: sessionData.title,
      description: sessionData.description || '',
      session_type: sessionData.session_type,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: scheduledDate.toTimeString().slice(0, 5),
      duration_minutes: sessionData.duration_minutes,
      agenda: sessionData.agenda || '',
      meeting_link: sessionData.meeting_link || ''
    });
  };

  const resetForm = () => {
    setFormData({
      mentorship_id: '',
      title: '',
      description: '',
      session_type: 'general_guidance',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: 60,
      agenda: '',
      meeting_link: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mentorship_id) {
      newErrors.mentorship_id = 'Please select a student';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Session date is required';
    }
    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Session time is required';
    }
    if (formData.duration_minutes < 15 || formData.duration_minutes > 240) {
      newErrors.duration_minutes = 'Duration must be between 15 and 240 minutes';
    }

    // Check if date/time is in the future
    if (formData.scheduled_date && formData.scheduled_time) {
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      if (scheduledDateTime <= new Date()) {
        newErrors.scheduled_date = 'Session must be scheduled for a future date and time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString();

      const sessionData = {
        mentorship_id: formData.mentorship_id,
        title: formData.title,
        description: formData.description || null,
        session_type: formData.session_type,
        scheduled_at: scheduledAt,
        duration_minutes: formData.duration_minutes,
        agenda: formData.agenda || null,
        meeting_link: formData.meeting_link || null,
        status: 'scheduled'
      };

      if (session) {
        // Update existing session
        const { error } = await supabase
          .from('mentor_sessions')
          .update(sessionData)
          .eq('id', session.id);

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        toast.success('Session updated successfully!');
      } else {
        // Create new session
        const { error } = await supabase
          .from('mentor_sessions')
          .insert({
            ...sessionData,
            created_by: user.id
          });

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        toast.success('Session scheduled successfully!');
      }

      onSave();
      onClose();

    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const sessionTypes = [
    { value: 'initial_consultation', label: 'Initial Consultation' },
    { value: 'progress_check', label: 'Progress Check' },
    { value: 'document_review', label: 'Document Review' },
    { value: 'interview_prep', label: 'Interview Preparation' },
    { value: 'goal_setting', label: 'Goal Setting' },
    { value: 'general_guidance', label: 'General Guidance' },
    { value: 'crisis_support', label: 'Crisis Support' },
    { value: 'celebration', label: 'Celebration' }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const selectedStudent = studentMentorships.find(m => m.id === formData.mentorship_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gradapp-primary" />
            {session ? 'Edit Session' : 'Schedule New Session'}
          </DialogTitle>
          <DialogDescription>
            {session ? 'Update the session details below' : 'Create a new mentoring session with one of your students'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="mentorship">Student *</Label>
            <Select 
              value={formData.mentorship_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, mentorship_id: value }))}
              disabled={Boolean(session)} // Disable if editing existing session
            >
              <SelectTrigger className={errors.mentorship_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a student">
                  {selectedStudent && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedStudent.student_profile.profile_image_url} />
                        <AvatarFallback className="text-xs">
                          {selectedStudent.student_profile.display_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedStudent.student_profile.display_name}</span>
                      <span className="text-gray-500 text-sm">
                        • {selectedStudent.student_profile.academic_level} • {selectedStudent.student_profile.field_of_study}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <span className="text-sm text-gray-600 mt-2">Loading students...</span>
                  </div>
                ) : (
                  studentMentorships.map((mentorship) => (
                    <SelectItem key={mentorship.id} value={mentorship.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={mentorship.student_profile.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {mentorship.student_profile.display_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{mentorship.student_profile.display_name}</span>
                        <span className="text-gray-500 text-sm">
                          • {mentorship.student_profile.academic_level} • {mentorship.student_profile.field_of_study}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.mentorship_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.mentorship_id}
              </p>
            )}
          </div>

          {/* Session Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Personal Statement Review, Application Strategy Discussion"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="session_type">Session Type</Label>
            <Select 
              value={formData.session_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={errors.scheduled_date ? 'border-red-500' : ''}
              />
              {errors.scheduled_date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.scheduled_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time *</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                className={errors.scheduled_time ? 'border-red-500' : ''}
              />
              {errors.scheduled_time && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.scheduled_time}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select 
              value={formData.duration_minutes.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.duration_minutes && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.duration_minutes}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this session will cover..."
              rows={3}
            />
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda">Session Agenda</Label>
            <Textarea
              id="agenda"
              value={formData.agenda}
              onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              placeholder="Detailed agenda or topics to cover during the session..."
              rows={4}
            />
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting_link">Meeting Link</Label>
            <Input
              id="meeting_link"
              value={formData.meeting_link}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
              placeholder="https://meet.google.com/abc-defg-hij"
              type="url"
            />
            <p className="text-sm text-gray-500">
              If left empty, a meeting link will be generated automatically
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradapp-primary hover:bg-gradapp-accent">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {session ? 'Update Session' : 'Schedule Session'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionForm;