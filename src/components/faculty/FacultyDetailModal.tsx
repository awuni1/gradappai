import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  Mail, 
  Phone,
  MapPin, 
  ExternalLink, 
  BookMarked,
  Award,
  Users,
  Calendar,
  Heart,
  MessageCircle,
  Building,
  Globe,
  GraduationCap,
  TrendingUp,
  Copy,
  Download,
  Share,
  Clock,
  DollarSign,
  FileText,
  Link2
} from 'lucide-react';
import { EnhancedFacultyData } from './EnhancedFacultyCard';

interface FacultyDetailModalProps {
  faculty: EnhancedFacultyData | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (facultyId: string) => void;
  onContact?: (faculty: EnhancedFacultyData) => void;
  onAddToComparison?: (faculty: EnhancedFacultyData) => void;
  isBookmarked?: boolean;
  contactStatus?: 'not_contacted' | 'interested' | 'contacted' | 'responded' | 'rejected';
  onUpdateContactStatus?: (facultyId: string, status: string, notes?: string) => void;
}

export const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({
  faculty,
  isOpen,
  onClose,
  onBookmark,
  onContact,
  onAddToComparison,
  isBookmarked = false,
  contactStatus = 'not_contacted',
  onUpdateContactStatus
}) => {
  const [notes, setNotes] = useState('');
  const [imageError, setImageError] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  if (!faculty) {return null;}

  const getProfileImage = () => {
    if (faculty.profile_image && !imageError) {
      return faculty.profile_image;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=random&color=fff&size=400`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ideal': return 'bg-green-50 text-green-700 border-green-200';
      case 'suitable': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'possible': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const renderCompatibilitySection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Compatibility Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-blue-600">{Math.round(faculty.match_score * 100)}%</span>
          <Badge variant="outline" className={getTierColor(faculty.tier)}>
            {faculty.tier === 'ideal' ? 'Ideal Match' : faculty.tier === 'suitable' ? 'Good Match' : 'Possible Match'}
          </Badge>
        </div>

        <div className="space-y-3">
          {[
            { key: 'research_alignment', label: 'Research Alignment', icon: Award },
            { key: 'experience_fit', label: 'Experience Level Fit', icon: GraduationCap },
            { key: 'collaboration_potential', label: 'Collaboration Potential', icon: MessageCircle },
            { key: 'mentoring_fit', label: 'Mentoring Style Fit', icon: Heart },
            { key: 'availability', label: 'Availability Score', icon: Calendar }
          ].map(({ key, label, icon: Icon }) => {
            const score = faculty.compatibility_scores[key as keyof typeof faculty.compatibility_scores] * 100;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(score)}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            );
          })}
        </div>

        {faculty.match_reason && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Why This Match?</h4>
            <p className="text-sm text-blue-700">{faculty.match_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderContactSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculty.contact_information.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-blue-600">{faculty.contact_information.email}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(faculty.contact_information.email!, 'Email')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {faculty.contact_information.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Phone</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{faculty.contact_information.phone}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(faculty.contact_information.phone!, 'Phone')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {faculty.contact_information.office && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Office</p>
                <p className="text-sm">{faculty.contact_information.office}</p>
              </div>
            </div>
          )}

          {faculty.contact_information.office_hours && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Office Hours</p>
                <p className="text-sm">{faculty.contact_information.office_hours}</p>
              </div>
            </div>
          )}
        </div>

        {faculty.contact_information.website && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Personal Website</p>
                <p className="text-sm text-blue-600">{faculty.contact_information.website}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(faculty.contact_information.website, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit
            </Button>
          </div>
        )}

        {/* Contact Status and Notes */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <label className="text-sm font-medium mb-2 block">Contact Status</label>
            <select 
              value={contactStatus}
              onChange={(e) => onUpdateContactStatus?.(faculty.id, e.target.value, notes)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="not_contacted">Not Contacted</option>
              <option value="interested">Interested</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="rejected">Not Available</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Textarea
              placeholder="Add your notes about this faculty member..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <Button
            size="sm"
            onClick={() => onUpdateContactStatus?.(faculty.id, contactStatus, notes)}
            className="w-full"
          >
            Save Notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPublicationsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Recent Publications
          {faculty.recent_publications && (
            <Badge variant="secondary">{faculty.recent_publications.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {faculty.recent_publications && faculty.recent_publications.length > 0 ? (
          <div className="space-y-4">
            {faculty.recent_publications.map((pub, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">{pub.title}</h4>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {pub.year && <span>{pub.year}</span>}
                  {pub.journal && <span>• {pub.journal}</span>}
                  {pub.type && <span>• {pub.type}</span>}
                </div>
                {pub.url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(pub.url, '_blank')}
                    className="mt-2 h-6 text-xs"
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    View Paper
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent publications available</p>
        )}
      </CardContent>
    </Card>
  );

  const renderResearchSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Research & Lab Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Research Areas */}
        <div>
          <h4 className="text-sm font-medium mb-2">Research Areas</h4>
          <div className="flex flex-wrap gap-2">
            {faculty.research_interests.map((area, index) => (
              <Badge key={index} variant="secondary">{area}</Badge>
            ))}
          </div>
        </div>

        {/* Current Projects */}
        {faculty.current_projects && faculty.current_projects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Current Projects</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {faculty.current_projects.map((project, index) => (
                <li key={index}>{project}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Lab Information */}
        {faculty.research_lab_info && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Research Lab</h4>
            <div className="space-y-2 text-sm">
              {faculty.research_lab_info.name && (
                <p><strong>Lab Name:</strong> {faculty.research_lab_info.name}</p>
              )}
              {faculty.research_lab_info.size && (
                <p><strong>Lab Size:</strong> {faculty.research_lab_info.size} members</p>
              )}
              {faculty.research_lab_info.funding_status && (
                <p><strong>Funding Status:</strong> {faculty.research_lab_info.funding_status}</p>
              )}
              {faculty.research_lab_info.website && (
                <div className="flex items-center gap-2">
                  <strong>Lab Website:</strong>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(faculty.research_lab_info!.website, '_blank')}
                    className="h-6 text-xs p-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Funding & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Student Availability
            </h4>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${faculty.accepting_students ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {faculty.accepting_students ? 'Currently accepting students' : 'Not accepting students'}
              </span>
            </div>
          </div>

          {faculty.funding_availability && (
            <div className="p-3 border rounded-lg">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Funding Status
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    faculty.funding_availability.status === 'available' ? 'bg-green-500' :
                    faculty.funding_availability.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm capitalize">{faculty.funding_availability.status}</span>
                </div>
                {faculty.funding_availability.sources && (
                  <p className="text-xs text-gray-600">
                    Sources: {faculty.funding_availability.sources.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <img
              src={getProfileImage()}
              alt={faculty.name}
              className="w-20 h-20 rounded-lg object-cover border-2 border-gray-100"
              onError={() => setImageError(true)}
            />
            <div className="flex-1">
              <DialogTitle className="text-xl mb-1">{faculty.name}</DialogTitle>
              <p className="text-gray-600 mb-2">{faculty.title}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Building className="h-4 w-4" />
                <span>{faculty.university}</span>
                {faculty.department && (
                  <>
                    <span>•</span>
                    <span>{faculty.department}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  <Star className="h-3 w-3" />
                  {Math.round(faculty.match_score * 100)}% match
                </div>
                <Badge variant="outline" className={getTierColor(faculty.tier)}>
                  {faculty.tier === 'ideal' ? 'Ideal Match' : faculty.tier === 'suitable' ? 'Good Match' : 'Possible Match'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBookmark?.(faculty.id)}
                className={isBookmarked ? 'bg-yellow-50 border-yellow-300' : ''}
              >
                <BookMarked className={`h-4 w-4 ${isBookmarked ? 'text-yellow-600' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => onContact?.(faculty)}
                disabled={!faculty.contact_information.email}
              >
                <Mail className="h-4 w-4 mr-1" />
                Contact
              </Button>
              {onAddToComparison && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddToComparison(faculty)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Compare
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="compatibility" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>

          <TabsContent value="compatibility" className="mt-4">
            {renderCompatibilitySection()}
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            {renderContactSection()}
          </TabsContent>

          <TabsContent value="publications" className="mt-4">
            {renderPublicationsSection()}
          </TabsContent>

          <TabsContent value="research" className="mt-4">
            {renderResearchSection()}
          </TabsContent>
        </Tabs>

        {copiedText && (
          <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
            {copiedText} copied to clipboard!
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FacultyDetailModal;