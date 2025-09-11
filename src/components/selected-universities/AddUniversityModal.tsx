import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  User, 
  BookOpen,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CustomFaculty {
  name: string;
  email: string;
  department: string;
  researchAreas: string[];
  website?: string;
}

interface UniversityFormData {
  university_name: string;
  program_name: string;
  location: string;
  country: string;
  application_deadline: string;
  website_url: string;
  funding_available: boolean;
  funding_details: string;
  tuition_fees: string;
  notes: string;
  contact_email: string;
  contact_phone: string;
  customFaculty: CustomFaculty[];
}

interface AddUniversityModalProps {
  onUniversityAdded: () => void;
  trigger?: React.ReactNode;
}

const AddUniversityModal: React.FC<AddUniversityModalProps> = ({ 
  onUniversityAdded, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [facultyInput, setFacultyInput] = useState({
    name: '',
    email: '',
    department: '',
    researchAreas: '',
    website: ''
  });

  const [formData, setFormData] = useState<UniversityFormData>({
    university_name: '',
    program_name: '',
    location: '',
    country: '',
    application_deadline: '',
    website_url: '',
    funding_available: false,
    funding_details: '',
    tuition_fees: '',
    notes: '',
    contact_email: '',
    contact_phone: '',
    customFaculty: []
  });

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Netherlands', 'Switzerland', 'Sweden', 'Denmark', 'Norway',
    'Japan', 'South Korea', 'Singapore', 'New Zealand', 'Ireland'
  ];

  const resetForm = () => {
    setFormData({
      university_name: '',
      program_name: '',
      location: '',
      country: '',
      application_deadline: '',
      website_url: '',
      funding_available: false,
      funding_details: '',
      tuition_fees: '',
      notes: '',
      contact_email: '',
      contact_phone: '',
      customFaculty: []
    });
    setFacultyInput({
      name: '',
      email: '',
      department: '',
      researchAreas: '',
      website: ''
    });
    setCurrentStep(1);
  };

  const handleInputChange = (field: keyof UniversityFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCustomFaculty = () => {
    if (!facultyInput.name.trim() || !facultyInput.email.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide faculty name and email',
        variant: 'destructive'
      });
      return;
    }

    const newFaculty: CustomFaculty = {
      name: facultyInput.name.trim(),
      email: facultyInput.email.trim(),
      department: facultyInput.department.trim(),
      researchAreas: facultyInput.researchAreas.split(',').map(area => area.trim()).filter(Boolean),
      website: facultyInput.website.trim() || undefined
    };

    setFormData(prev => ({
      ...prev,
      customFaculty: [...prev.customFaculty, newFaculty]
    }));

    setFacultyInput({
      name: '',
      email: '',
      department: '',
      researchAreas: '',
      website: ''
    });

    toast({
      title: 'Faculty Added',
      description: `${newFaculty.name} has been added to the university faculty list`
    });
  };

  const removeCustomFaculty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customFaculty: prev.customFaculty.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    return formData.university_name.trim() && 
           formData.program_name.trim() && 
           formData.location.trim() && 
           formData.country;
  };

  const validateStep2 = () => {
    return formData.application_deadline; // At minimum, deadline is required
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to add universities',
          variant: 'destructive'
        });
        return;
      }

      // Check if university already exists for this user
      const { data: existing } = await supabase
        .from('selected_universities')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('university_name', formData.university_name)
        .eq('program_name', formData.program_name)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'University Already Exists',
          description: 'This university and program combination is already in your list',
          variant: 'destructive'
        });
        return;
      }

      // Store additional custom information in the custom_data JSONB field
      const customData = {
        country: formData.country,
        tuition_fees: formData.tuition_fees,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        custom_faculty: formData.customFaculty,
        is_custom_university: true
      };

      // Insert the new university
      const { data: newUniversity, error } = await supabase
        .from('selected_universities')
        .insert({
          user_id: user.user.id,
          university_name: formData.university_name,
          program_name: formData.program_name,
          location: formData.location,
          application_deadline: formData.application_deadline,
          funding_available: formData.funding_available,
          funding_details: formData.funding_details || null,
          website_url: formData.website_url || null,
          notes: formData.notes || null,
          custom_data: customData
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding university:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to add university. Please try again.';
        if (error.message?.includes('duplicate') || error.code === '23505') {
          errorMessage = 'This university and program combination already exists in your list.';
        } else if (error.message?.includes('permission') || error.code === '42501') {
          errorMessage = 'Permission denied. Please sign in again.';
        } else if (error.message?.includes('column') || error.code === '42703') {
          errorMessage = 'Database configuration issue. Please contact support.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }

      // If faculty were added, create records for them
      if (formData.customFaculty.length > 0 && newUniversity) {
        const facultyRecords = formData.customFaculty.map(faculty => {
          // Include website info in research_interests field if provided
          const researchInterestsWithWebsite = faculty.website ? 
            `${faculty.researchAreas.join(', ')} | Website: ${faculty.website}` :
            faculty.researchAreas.join(', ');

          return {
            user_id: user.user.id,
            selected_university_id: newUniversity.id,
            professor_name: faculty.name,
            research_interests: researchInterestsWithWebsite,
            contact_status: 'Apply', // Using 'Apply' to match existing application logic
            email: faculty.email,
            department: faculty.department || 'Not Specified'
          };
        });

        const { error: facultyError } = await supabase
          .from('selected_professors')
          .insert(facultyRecords);

        if (facultyError) {
          console.error('Error adding faculty:', facultyError);
          // Don't fail the whole operation, just log it
          toast({
            title: 'Warning',
            description: 'University added successfully, but there was an issue adding faculty members.',
            variant: 'default'
          });
        }
      }

      toast({
        title: 'Success',
        description: `${formData.university_name} has been added to your selected universities`,
      });

      resetForm();
      setOpen(false);
      onUniversityAdded();

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="university_name" className="text-sm font-medium">
            University Name *
          </Label>
          <Input
            id="university_name"
            placeholder="e.g., Stanford University"
            value={formData.university_name}
            onChange={(e) => handleInputChange('university_name', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="program_name" className="text-sm font-medium">
            Program Name *
          </Label>
          <Input
            id="program_name"
            placeholder="e.g., Computer Science PhD"
            value={formData.program_name}
            onChange={(e) => handleInputChange('program_name', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Location *
            </Label>
            <Input
              id="location"
              placeholder="e.g., Stanford, CA"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-sm font-medium">
              Country *
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="website_url" className="text-sm font-medium">
            Program Website
          </Label>
          <Input
            id="website_url"
            placeholder="https://..."
            value={formData.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="application_deadline" className="text-sm font-medium">
            Application Deadline *
          </Label>
          <Input
            id="application_deadline"
            type="date"
            value={formData.application_deadline}
            onChange={(e) => handleInputChange('application_deadline', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="tuition_fees" className="text-sm font-medium">
            Tuition Fees
          </Label>
          <Input
            id="tuition_fees"
            placeholder="e.g., $50,000 per year"
            value={formData.tuition_fees}
            onChange={(e) => handleInputChange('tuition_fees', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="funding_available"
            checked={formData.funding_available}
            onCheckedChange={(checked) => handleInputChange('funding_available', checked)}
          />
          <Label htmlFor="funding_available" className="text-sm font-medium">
            Funding Available
          </Label>
        </div>

        {formData.funding_available && (
          <div>
            <Label htmlFor="funding_details" className="text-sm font-medium">
              Funding Details
            </Label>
            <Textarea
              id="funding_details"
              placeholder="Describe available funding opportunities..."
              value={formData.funding_details}
              onChange={(e) => handleInputChange('funding_details', e.target.value)}
              className="mt-1"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="contact_email" className="text-sm font-medium">
              Contact Email
            </Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="admissions@university.edu"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="contact_phone" className="text-sm font-medium">
              Contact Phone
            </Label>
            <Input
              id="contact_phone"
              placeholder="+1 (555) 123-4567"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes about this university..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Add Faculty Members (Optional)</h3>
        
        {/* Add Faculty Form */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Add Faculty Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Professor Name"
                value={facultyInput.name}
                onChange={(e) => setFacultyInput(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={facultyInput.email}
                onChange={(e) => setFacultyInput(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Department"
                value={facultyInput.department}
                onChange={(e) => setFacultyInput(prev => ({ ...prev, department: e.target.value }))}
              />
              <Input
                placeholder="Website (optional)"
                value={facultyInput.website}
                onChange={(e) => setFacultyInput(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Research Areas (comma-separated)"
              value={facultyInput.researchAreas}
              onChange={(e) => setFacultyInput(prev => ({ ...prev, researchAreas: e.target.value }))}
            />
            <Button onClick={addCustomFaculty} size="sm" className="w-full">
              <User className="h-3 w-3 mr-1" />
              Add Faculty Member
            </Button>
          </CardContent>
        </Card>

        {/* Faculty List */}
        {formData.customFaculty.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Added Faculty ({formData.customFaculty.length})</h4>
            <div className="space-y-2">
              {formData.customFaculty.map((faculty, index) => (
                <Card key={index} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{faculty.name}</h5>
                      <p className="text-xs text-gray-600">{faculty.email}</p>
                      {faculty.department && (
                        <p className="text-xs text-gray-500">{faculty.department}</p>
                      )}
                      {faculty.researchAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {faculty.researchAreas.map((area, areaIndex) => (
                            <Badge key={areaIndex} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => removeCustomFaculty(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom University
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-gradapp-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 ${
                    currentStep > step ? 'bg-gradapp-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'text-gradapp-primary font-medium' : ''}>
              Basic Info
            </span>
            <span className={currentStep >= 2 ? 'text-gradapp-primary font-medium' : ''}>
              Application Details
            </span>
            <span className={currentStep >= 3 ? 'text-gradapp-primary font-medium' : ''}>
              Faculty (Optional)
            </span>
          </div>

          <Separator />

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={currentStep === 1 ? !validateStep1() : !validateStep2()}
                  className="bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep1() || !validateStep2()}
                  className="bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  {loading ? 'Adding...' : 'Add University'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUniversityModal;