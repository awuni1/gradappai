import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  Copy, 
  Calendar, 
  Clock,
  User,
  FileText,
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Tag,
  Bell
} from 'lucide-react';
import { EnhancedFacultyData } from './EnhancedFacultyCard';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'initial_contact' | 'follow_up' | 'meeting_request' | 'thank_you' | 'custom';
  variables: string[];
}

interface ContactManagementModalProps {
  faculty: EnhancedFacultyData | null;
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    name: string;
    email: string;
    university?: string;
    program?: string;
    researchInterests: string[];
    cvSummary?: string;
  };
  onSendEmail?: (emailData: {
    to: string;
    subject: string;
    body: string;
    facultyId: string;
  }) => Promise<boolean>;
  onSaveContact?: (contactData: {
    facultyId: string;
    status: string;
    notes: string;
    reminderDate?: string;
    tags: string[];
  }) => Promise<boolean>;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'initial_contact',
    name: 'Initial Research Inquiry',
    subject: 'Research Collaboration Inquiry - {{studentName}}',
    body: `Dear Professor {{facultyName}},

I hope this email finds you well. My name is {{studentName}}, and I am {{studentBackground}}. I am writing to express my strong interest in your research work, particularly in {{researchAlignment}}.

{{personalizedSection}}

I would be honored to discuss potential opportunities to contribute to your research group. I have attached my CV and would be happy to provide any additional information you might need.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
{{studentName}}
{{studentEmail}}`,
    type: 'initial_contact',
    variables: ['studentName', 'facultyName', 'studentBackground', 'researchAlignment', 'personalizedSection', 'studentEmail']
  },
  {
    id: 'follow_up',
    name: 'Follow-up Email',
    subject: 'Following up - Research Collaboration Inquiry',
    body: `Dear Professor {{facultyName}},

I hope you are doing well. I wanted to follow up on my previous email regarding potential research opportunities in your lab.

{{followUpReason}}

I remain very interested in your work on {{researchAreas}} and would appreciate any opportunity to discuss how I might contribute to your ongoing research.

Thank you again for your time.

Best regards,
{{studentName}}`,
    type: 'follow_up',
    variables: ['facultyName', 'followUpReason', 'researchAreas', 'studentName']
  },
  {
    id: 'meeting_request',
    name: 'Meeting Request',
    subject: 'Request for Brief Meeting - {{studentName}}',
    body: `Dear Professor {{facultyName}},

Thank you for your positive response to my inquiry about research opportunities. I would be grateful for the opportunity to meet with you briefly to discuss my background and potential fit with your research group.

I am available for a meeting at your convenience, either in person or via video call. Please let me know what times work best for you.

I appreciate your time and consideration.

Best regards,
{{studentName}}
{{studentEmail}}`,
    type: 'meeting_request',
    variables: ['facultyName', 'studentName', 'studentEmail']
  }
];

export const ContactManagementModal: React.FC<ContactManagementModalProps> = ({
  faculty,
  isOpen,
  onClose,
  userProfile,
  onSendEmail,
  onSaveContact
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [contactStatus, setContactStatus] = useState('not_contacted');
  const [contactNotes, setContactNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<string[]>([]);

  useEffect(() => {
    if (faculty && isOpen) {
      generateAIInsights();
    }
  }, [faculty, isOpen]);

  const generateAIInsights = async () => {
    if (!faculty || !userProfile) {return;}

    // Simulate AI-generated insights based on research alignment
    const insights = [
      `Research alignment: ${Math.round(faculty.compatibility_scores.research_alignment * 100)}% match in ${faculty.research_interests.slice(0, 2).join(' and ')}`,
      `Recent publication relevance: ${faculty.recent_publications?.length || 0} papers in related areas`,
      `Lab status: ${faculty.accepting_students ? 'Currently accepting students' : 'Check availability'}`,
      `Contact timing: Best to reach out during academic year`
    ];
    
    setGeneratedInsights(insights);
  };

  const generatePersonalizedEmail = async (template: EmailTemplate) => {
    if (!faculty || !userProfile) {return;}

    setIsGeneratingEmail(true);
    
    try {
      // Simulate AI email generation with personalized content
      const variables = {
        studentName: userProfile.name,
        facultyName: faculty.name,
        studentBackground: `a ${userProfile.program || 'graduate'} student interested in ${userProfile.researchInterests.slice(0, 2).join(' and ')}`,
        researchAlignment: faculty.research_interests.slice(0, 3).join(', '),
        personalizedSection: generatePersonalizedSection(),
        studentEmail: userProfile.email,
        followUpReason: 'I wanted to ensure my previous message reached you and to reiterate my strong interest in your research.',
        researchAreas: faculty.research_interests.join(', ')
      };

      let personalizedSubject = template.subject;
      let personalizedBody = template.body;

      // Replace variables in subject and body
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
        personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value);
      });

      setEmailSubject(personalizedSubject);
      setEmailBody(personalizedBody);
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Error generating personalized email:', error);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const generatePersonalizedSection = () => {
    if (!faculty || !userProfile) {return '';}

    const commonInterests = faculty.research_interests.filter(interest =>
      userProfile.researchInterests.some(userInterest =>
        userInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(userInterest.toLowerCase())
      )
    );

    if (commonInterests.length > 0) {
      return `I am particularly drawn to your work on ${commonInterests.join(' and ')}, which aligns closely with my research interests in ${userProfile.researchInterests.slice(0, 2).join(' and ')}. ${faculty.recent_publications && faculty.recent_publications.length > 0 ? `Your recent publication "${faculty.recent_publications[0].title}" especially caught my attention.` : ''}`;
    }

    return `Your research in ${faculty.research_interests.slice(0, 2).join(' and ')} is of great interest to me, and I believe my background in ${userProfile.researchInterests.slice(0, 2).join(' and ')} would allow me to contribute meaningfully to your research group.`;
  };

  const handleSendEmail = async () => {
    if (!faculty || !onSendEmail) {return;}

    setIsSending(true);
    try {
      const success = await onSendEmail({
        to: faculty.contact_information.email!,
        subject: emailSubject,
        body: emailBody,
        facultyId: faculty.id
      });

      if (success) {
        setContactStatus('contacted');
        setContactNotes(`Sent initial email: "${emailSubject}"`);
        await handleSaveContact();
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveContact = async () => {
    if (!faculty || !onSaveContact) {return;}

    setIsSaving(true);
    try {
      await onSaveContact({
        facultyId: faculty.id,
        status: contactStatus,
        notes: contactNotes,
        reminderDate: reminderDate || undefined,
        tags
      });
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!faculty) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact {faculty.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email Composer</TabsTrigger>
            <TabsTrigger value="contact">Contact Tracking</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Email Templates</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generatePersonalizedEmail(selectedTemplate || defaultTemplates[0])}
                    disabled={isGeneratingEmail}
                  >
                    {isGeneratingEmail ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    AI Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  {defaultTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => generatePersonalizedEmail(template)}
                      className="text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email body"
                      className="min-h-[300px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendEmail}
                      disabled={!emailSubject || !emailBody || !faculty.contact_information.email || isSending}
                      className="flex-1"
                    >
                      {isSending ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(`${emailSubject}\n\n${emailBody}`)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`mailto:${faculty.contact_information.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open in Email App
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Status & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Status</label>
                  <Select value={contactStatus} onValueChange={setContactStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_contacted">Not Contacted</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="rejected">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder="Add notes about your interaction with this faculty member..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Follow-up Reminder</label>
                  <Input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button size="sm" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveContact}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Contact Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Research Compatibility Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Research Alignment:</span>
                        <span className="font-medium">{Math.round(faculty.compatibility_scores.research_alignment * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Collaboration Potential:</span>
                        <span className="font-medium">{Math.round(faculty.compatibility_scores.collaboration_potential * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mentoring Fit:</span>
                        <span className="font-medium">{Math.round(faculty.compatibility_scores.mentoring_fit * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Contact Strategy Recommendations</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Mention specific publications to show genuine interest</li>
                      <li>• Highlight relevant experience and skills</li>
                      <li>• Be specific about research goals and timeline</li>
                      <li>• Follow up if no response within 2 weeks</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContactManagementModal;