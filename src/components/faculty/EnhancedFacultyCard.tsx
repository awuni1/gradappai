import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Mail, 
  MapPin, 
  ExternalLink, 
  BookMarked,
  Award,
  Users,
  Calendar,
  Heart,
  MessageCircle,
  Eye,
  TrendingUp,
  Building,
  Phone,
  Globe
} from 'lucide-react';

interface CompatibilityScores {
  research_alignment: number;
  experience_fit: number;
  collaboration_potential: number;
  mentoring_fit: number;
  availability: number;
}

interface Publication {
  title: string;
  year?: number;
  journal?: string;
  type?: string;
  url?: string;
}

interface ResearchLab {
  name?: string;
  website?: string;
  size?: number;
  funding_status?: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  office?: string;
  website?: string;
  office_hours?: string;
}

export interface EnhancedFacultyData {
  id: string;
  name: string;
  title: string;
  university: string;
  department: string;
  match_score: number;
  tier: 'ideal' | 'suitable' | 'possible';
  research_interests: string[];
  compatibility_scores: CompatibilityScores;
  recent_publications: Publication[];
  current_projects?: string[];
  contact_information: ContactInfo;
  research_lab_info?: ResearchLab;
  funding_availability?: {
    status: 'available' | 'limited' | 'unavailable' | 'unknown';
    sources?: string[];
  };
  accepting_students?: boolean;
  profile_image?: string;
  match_reason?: string;
  last_updated?: string;
  citation_count?: number;
  h_index?: number;
}

interface EnhancedFacultyCardProps {
  faculty: EnhancedFacultyData;
  isBookmarked?: boolean;
  contactStatus?: 'not_contacted' | 'interested' | 'contacted' | 'responded' | 'rejected';
  onBookmark?: (facultyId: string) => void;
  onContact?: (faculty: EnhancedFacultyData) => void;
  onViewProfile?: (faculty: EnhancedFacultyData) => void;
  onCompare?: (faculty: EnhancedFacultyData) => void;
  isComparing?: boolean;
  isSelected?: boolean;
  onSelect?: (facultyId: string) => void;
  showDetailedView?: boolean;
}

export const EnhancedFacultyCard: React.FC<EnhancedFacultyCardProps> = ({
  faculty,
  isBookmarked = false,
  contactStatus = 'not_contacted',
  onBookmark,
  onContact,
  onViewProfile,
  onCompare,
  isComparing = false,
  isSelected = false,
  onSelect,
  showDetailedView = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ideal': return 'bg-green-50 text-green-700 border-green-200';
      case 'suitable': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'possible': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'ideal': return 'Ideal Match';
      case 'suitable': return 'Good Match';
      case 'possible': return 'Possible Match';
      default: return 'Match';
    }
  };

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'interested': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'contacted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'responded': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getContactStatusText = (status: string) => {
    switch (status) {
      case 'interested': return 'Interested';
      case 'contacted': return 'Contacted';
      case 'responded': return 'Responded';
      case 'rejected': return 'Not Available';
      default: return 'Not Contacted';
    }
  };

  const getFundingStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'limited': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getProfileImage = () => {
    if (faculty.profile_image && !imageError) {
      return faculty.profile_image;
    }
    // Generate a placeholder based on faculty name
    const initials = faculty.name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=random&color=fff&size=200`;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) {return 'text-green-600';}
    if (score >= 80) {return 'text-blue-600';}
    if (score >= 70) {return 'text-orange-600';}
    return 'text-gray-600';
  };

  const renderCompatibilityScore = (label: string, score: number, icon: React.ComponentType<any>) => {
    const IconComponent = icon;
    return (
      <div className="flex items-center gap-2">
        <IconComponent className="h-3 w-3 text-gray-500" />
        <span className="text-xs text-gray-600 min-w-[60px]">{label}:</span>
        <div className="flex-1">
          <Progress value={score * 100} className="h-2" />
        </div>
        <span className="text-xs font-medium min-w-[30px]">{Math.round(score * 100)}%</span>
      </div>
    );
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${
      isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
    } ${isComparing ? 'ring-1 ring-orange-300' : ''}`}>
      <CardContent className="p-6">
        {/* Selection checkbox for comparison mode */}
        {isComparing && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(faculty.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex gap-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <img
              src={getProfileImage()}
              alt={faculty.name}
              className="w-24 h-24 rounded-lg object-cover border-2 border-gray-100"
              onError={() => setImageError(true)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with name, title, and badges */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 truncate">{faculty.name}</h3>
                <p className="text-sm text-gray-600 truncate">{faculty.title}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{faculty.university}</span>
                  {faculty.department && (
                    <>
                      <span>•</span>
                      <span className="truncate">{faculty.department}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 ml-4">
                {/* Match Score */}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white border ${getMatchScoreColor(faculty.match_score * 100)}`}>
                  <Star className="h-3 w-3" />
                  {Math.round(faculty.match_score * 100)}% match
                </div>
                
                {/* Tier Badge */}
                <Badge variant="outline" className={getTierColor(faculty.tier)}>
                  {getTierDisplayName(faculty.tier)}
                </Badge>
                
                {/* Contact Status */}
                {contactStatus !== 'not_contacted' && (
                  <Badge variant="outline" className={`text-xs ${getContactStatusColor(contactStatus)}`}>
                    {getContactStatusText(contactStatus)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Research Areas */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {faculty.research_interests.slice(0, 4).map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {faculty.research_interests.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{faculty.research_interests.length - 4} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Match Reason */}
            {faculty.match_reason && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Why this match?</span>
                </div>
                <p className="text-xs text-blue-700">{faculty.match_reason}</p>
              </div>
            )}

            {/* Compatibility Scores */}
            <div 
              className="mb-4 cursor-pointer"
              onClick={() => setShowCompatibilityDetails(!showCompatibilityDetails)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Compatibility Breakdown</span>
                <Button variant="ghost" size="sm" className="h-4 p-0 text-xs">
                  {showCompatibilityDetails ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {showCompatibilityDetails ? (
                <div className="space-y-2 p-2 bg-gray-50 rounded-lg">
                  {renderCompatibilityScore('Research Fit', faculty.compatibility_scores.research_alignment, Award)}
                  {renderCompatibilityScore('Experience', faculty.compatibility_scores.experience_fit, Users)}
                  {renderCompatibilityScore('Collaboration', faculty.compatibility_scores.collaboration_potential, MessageCircle)}
                  {renderCompatibilityScore('Mentoring', faculty.compatibility_scores.mentoring_fit, Heart)}
                  {renderCompatibilityScore('Availability', faculty.compatibility_scores.availability, Calendar)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Research Fit:</span>
                    <span className="font-medium">{Math.round(faculty.compatibility_scores.research_alignment * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-medium">{Math.round(faculty.compatibility_scores.experience_fit * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-gray-600">
              {/* Publications */}
              {faculty.recent_publications && faculty.recent_publications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Award className="h-3 w-3" />
                    <span className="font-medium">Recent Publications</span>
                  </div>
                  <div className="space-y-1">
                    {faculty.recent_publications.slice(0, 2).map((pub, idx) => (
                      <div key={idx} className="truncate">
                        <span className="text-gray-900">{pub.title}</span>
                        {pub.year && <span className="text-gray-500"> ({pub.year})</span>}
                      </div>
                    ))}
                    {faculty.recent_publications.length > 2 && (
                      <span className="text-gray-500">+{faculty.recent_publications.length - 2} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact & Availability */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">Availability</span>
                </div>
                <div className="space-y-1">
                  {faculty.accepting_students !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${faculty.accepting_students ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>{faculty.accepting_students ? 'Accepting Students' : 'Not Accepting'}</span>
                    </div>
                  )}
                  {faculty.funding_availability && (
                    <div className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${getFundingStatusColor(faculty.funding_availability.status)}`}></span>
                      <span className={getFundingStatusColor(faculty.funding_availability.status)}>
                        Funding {faculty.funding_availability.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => onContact?.(faculty)}
                disabled={!faculty.contact_information.email}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="h-3 w-3 mr-1" />
                Contact
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBookmark?.(faculty.id)}
                className={isBookmarked ? 'bg-yellow-50 border-yellow-300' : ''}
              >
                <BookMarked className={`h-3 w-3 mr-1 ${isBookmarked ? 'text-yellow-600' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewProfile?.(faculty)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Profile
              </Button>
              
              {onCompare && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCompare(faculty)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Compare
                </Button>
              )}
              
              {faculty.contact_information.website && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(faculty.contact_information.website, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedFacultyCard;