import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Mail, 
  BookMarked, 
  Download, 
  Tag,
  Copy,
  Send,
  CheckCircle,
  X,
  FileSpreadsheet,
  FileText,
  Share,
  Filter,
  Archive
} from 'lucide-react';
import { EnhancedFacultyData } from './EnhancedFacultyCard';

interface BulkFacultyOperationsProps {
  selectedFaculty: EnhancedFacultyData[];
  onBulkBookmark: (facultyIds: string[]) => void;
  onBulkContact: (facultyIds: string[], emailData: {
    subject: string;
    body: string;
    template: string;
  }) => Promise<boolean>;
  onBulkExport: (facultyIds: string[], format: 'csv' | 'json' | 'pdf') => void;
  onBulkTag: (facultyIds: string[], tags: string[]) => void;
  onClearSelection: () => void;
  availableTags?: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'bulk_inquiry',
    name: 'Bulk Research Inquiry',
    subject: 'Research Collaboration Inquiry - {{studentName}}',
    body: `Dear Professor {{facultyName}},

I hope this email finds you well. My name is {{studentName}}, and I am currently exploring graduate research opportunities.

I am writing to inquire about potential research opportunities in your lab. Your work in {{researchArea}} aligns well with my research interests and academic background.

I would be grateful for the opportunity to discuss how I might contribute to your ongoing research projects. I have attached my CV and would be happy to provide any additional information.

Thank you for your time and consideration.

Best regards,
{{studentName}}
{{studentEmail}}`
  },
  {
    id: 'follow_up',
    name: 'Follow-up Email',
    subject: 'Following up - Research Opportunity Inquiry',
    body: `Dear Professor {{facultyName}},

I hope you are doing well. I wanted to follow up on my previous email regarding potential research opportunities in your lab.

I remain very interested in your work and would appreciate any opportunity to discuss how I might contribute to your research group.

Thank you again for your time.

Best regards,
{{studentName}}`
  },
  {
    id: 'introduction',
    name: 'Introduction Email',
    subject: 'Introduction - Prospective Graduate Student',
    body: `Dear Professor {{facultyName}},

I hope this email finds you well. I am {{studentName}}, and I am very interested in your research work at {{university}}.

I am currently seeking graduate research opportunities and would love to learn more about potential openings in your lab. Your research in {{researchArea}} particularly interests me.

I would be honored to discuss my background and how I might contribute to your research group.

Thank you for considering my inquiry.

Best regards,
{{studentName}}
{{studentEmail}}`
  }
];

export const BulkFacultyOperations: React.FC<BulkFacultyOperationsProps> = ({
  selectedFaculty,
  onBulkBookmark,
  onBulkContact,
  onBulkExport,
  onBulkTag,
  onClearSelection,
  availableTags = []
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(emailTemplates[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleEmailTemplate = (template: EmailTemplate) => {
    setEmailTemplate(template);
    setCustomSubject(template.subject);
    setCustomBody(template.body);
  };

  const handleBulkEmail = async () => {
    if (!customSubject || !customBody) {return;}

    setIsSending(true);
    setSentCount(0);

    try {
      const facultyIds = selectedFaculty
        .filter(f => f.contact_information.email)
        .map(f => f.id);

      const success = await onBulkContact(facultyIds, {
        subject: customSubject,
        body: customBody,
        template: emailTemplate.id
      });

      if (success) {
        setSentCount(facultyIds.length);
        setTimeout(() => {
          setShowEmailModal(false);
          setSentCount(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkTag = () => {
    if (selectedTags.length > 0) {
      onBulkTag(selectedFaculty.map(f => f.id), selectedTags);
      setShowTagModal(false);
      setSelectedTags([]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onBulkExport(selectedFaculty.map(f => f.id), format);
  };

  const copyEmailsToClipboard = () => {
    const emails = selectedFaculty
      .filter(f => f.contact_information.email)
      .map(f => f.contact_information.email)
      .join(', ');
    navigator.clipboard.writeText(emails);
  };

  const generateSummaryText = () => {
    const summary = selectedFaculty.map(f => 
      `${f.name} (${f.university}) - ${Math.round(f.match_score * 100)}% match - ${f.contact_information.email || 'No email'}`
    ).join('\n');
    
    return `Faculty Selection Summary (${selectedFaculty.length} selected):\n\n${summary}`;
  };

  const shareFacultyList = async () => {
    const summaryText = generateSummaryText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Selected Faculty List',
          text: summaryText
        });
      } catch (error) {
        navigator.clipboard.writeText(summaryText);
      }
    } else {
      navigator.clipboard.writeText(summaryText);
    }
  };

  if (selectedFaculty.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Select faculty members to perform bulk operations</p>
          <p className="text-xs text-gray-400 mt-1">
            Use the checkboxes on faculty cards to select multiple faculty members
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Operations
              <Badge variant="secondary">{selectedFaculty.length} selected</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Faculty Preview */}
          <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
            <div className="space-y-1">
              {selectedFaculty.slice(0, 5).map((faculty) => (
                <div key={faculty.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{faculty.name} ({faculty.university})</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(faculty.match_score * 100)}%
                  </Badge>
                </div>
              ))}
              {selectedFaculty.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{selectedFaculty.length - 5} more faculty
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Avg Match Score</p>
              <p className="font-bold text-blue-800">
                {Math.round(selectedFaculty.reduce((sum, f) => sum + f.match_score, 0) / selectedFaculty.length * 100)}%
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">With Email</p>
              <p className="font-bold text-green-800">
                {selectedFaculty.filter(f => f.contact_information.email).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-600">Accepting Students</p>
              <p className="font-bold text-yellow-800">
                {selectedFaculty.filter(f => f.accepting_students).length}
              </p>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailModal(true)}
              disabled={selectedFaculty.filter(f => f.contact_information.email).length === 0}
              className="flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              Email All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkBookmark(selectedFaculty.map(f => f.id))}
              className="flex items-center gap-1"
            >
              <BookMarked className="h-3 w-3" />
              Bookmark
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagModal(true)}
              className="flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              Tag
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copyEmailsToClipboard}
              disabled={selectedFaculty.filter(f => f.contact_information.email).length === 0}
              className="flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy Emails
            </Button>
          </div>

          {/* Export Options */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Export Options</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="h-3 w-3" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                className="flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareFacultyList}
                className="flex items-center gap-1"
              >
                <Share className="h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Bulk Email ({selectedFaculty.filter(f => f.contact_information.email).length} recipients)
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Email Template</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {emailTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant={emailTemplate.id === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEmailTemplate(template)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="Email subject"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Email body"
                className="min-h-[200px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use placeholders: {{studentName}}, {{facultyName}}, {{university}}, {{researchArea}}
              </p>
            </div>

            {/* Recipients Preview */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Recipients:</h4>
              <div className="max-h-32 overflow-y-auto">
                {selectedFaculty
                  .filter(f => f.contact_information.email)
                  .map((faculty) => (
                    <div key={faculty.id} className="flex justify-between text-xs py-1">
                      <span>{faculty.name}</span>
                      <span className="text-gray-500">{faculty.contact_information.email}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Send Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleBulkEmail}
                disabled={!customSubject || !customBody || isSending}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedFaculty.filter(f => f.contact_information.email).length} Faculty
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
            </div>

            {/* Success Message */}
            {sentCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-800">
                <CheckCircle className="h-4 w-4" />
                Successfully sent emails to {sentCount} faculty members!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Add Tags to Selected Faculty
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Available Tags */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Available Tags</label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className="text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Tag */}
            <div>
              <label className="text-sm font-medium mb-2 block">Add New Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter new tag"
                  className="flex-1 p-2 border rounded-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Tags</label>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleBulkTag}
                disabled={selectedTags.length === 0}
                className="flex-1"
              >
                <Tag className="h-4 w-4 mr-2" />
                Apply Tags to {selectedFaculty.length} Faculty
              </Button>
              <Button variant="outline" onClick={() => setShowTagModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkFacultyOperations;