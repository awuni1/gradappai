import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Star, 
  Award,
  Users,
  Calendar,
  Heart,
  MessageCircle,
  Building,
  Mail,
  Phone,
  Globe,
  BookMarked,
  Download,
  Share,
  Copy,
  ExternalLink,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { EnhancedFacultyData } from './EnhancedFacultyCard';

interface FacultyComparisonProps {
  faculty: EnhancedFacultyData[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFaculty: (facultyId: string) => void;
  onContact?: (faculty: EnhancedFacultyData) => void;
  onBookmark?: (facultyId: string) => void;
  bookmarkedIds?: string[];
}

interface ComparisonMetric {
  key: keyof EnhancedFacultyData['compatibility_scores'];
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const comparisonMetrics: ComparisonMetric[] = [
  {
    key: 'research_alignment',
    label: 'Research Alignment',
    icon: Award,
    description: 'How well research interests match'
  },
  {
    key: 'experience_fit',
    label: 'Experience Fit',
    icon: Users,
    description: 'Compatibility with experience level'
  },
  {
    key: 'collaboration_potential',
    label: 'Collaboration Potential',
    icon: MessageCircle,
    description: 'Likelihood of successful collaboration'
  },
  {
    key: 'mentoring_fit',
    label: 'Mentoring Fit',
    icon: Heart,
    description: 'Compatibility with mentoring style'
  },
  {
    key: 'availability',
    label: 'Availability',
    icon: Calendar,
    description: 'Current availability for new students'
  }
];

export const FacultyComparison: React.FC<FacultyComparisonProps> = ({
  faculty,
  isOpen,
  onClose,
  onRemoveFaculty,
  onContact,
  onBookmark,
  bookmarkedIds = []
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'research' | 'publications' | 'contact'>('overview');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (facultyId: string) => {
    setImageErrors(prev => new Set(prev).add(facultyId));
  };

  const getProfileImage = (faculty: EnhancedFacultyData) => {
    if (faculty.profile_image && !imageErrors.has(faculty.id)) {
      return faculty.profile_image;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=random&color=fff&size=300`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ideal': return 'bg-green-50 text-green-700 border-green-200';
      case 'suitable': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'possible': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const exportComparison = () => {
    const comparisonData = faculty.map(f => ({
      name: f.name,
      university: f.university,
      department: f.department,
      match_score: Math.round(f.match_score * 100),
      tier: f.tier,
      research_interests: f.research_interests.join(', '),
      email: f.contact_information.email,
      accepting_students: f.accepting_students,
      compatibility_scores: Object.entries(f.compatibility_scores).map(
        ([key, value]) => `${key}: ${Math.round(value * 100)}%`
      ).join(', ')
    }));

    const csvContent = [
      Object.keys(comparisonData[0]).join(','),
      ...comparisonData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareComparison = async () => {
    const comparisonText = faculty.map(f => 
      `${f.name} (${f.university}) - ${Math.round(f.match_score * 100)}% match`
    ).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Faculty Comparison',
          text: comparisonText
        });
      } catch (error) {
        // Fall back to clipboard
        navigator.clipboard.writeText(comparisonText);
      }
    } else {
      navigator.clipboard.writeText(comparisonText);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Match Score Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Overall Match Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faculty.map((f) => (
              <div key={f.id} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium truncate">{f.name}</div>
                <div className="flex-1">
                  <Progress value={f.match_score * 100} className="h-3" />
                </div>
                <div className="w-16 text-sm font-bold text-right">
                  {Math.round(f.match_score * 100)}%
                </div>
                <Badge variant="outline" className={getTierColor(f.tier)}>
                  {f.tier}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compatibility Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detailed Compatibility Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {comparisonMetrics.map((metric) => (
              <div key={metric.key}>
                <div className="flex items-center gap-2 mb-3">
                  <metric.icon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{metric.label}</span>
                  <span className="text-xs text-gray-500">({metric.description})</span>
                </div>
                <div className="space-y-2">
                  {faculty.map((f) => {
                    const score = f.compatibility_scores[metric.key] * 100;
                    return (
                      <div key={f.id} className="flex items-center gap-4">
                        <div className="w-24 text-sm truncate">{f.name}</div>
                        <div className="flex-1">
                          <Progress value={score} className="h-2" />
                        </div>
                        <div className="w-12 text-xs font-medium text-right">
                          {Math.round(score)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Faculty</th>
                  <th className="text-center py-2">Accepting Students</th>
                  <th className="text-center py-2">Funding Status</th>
                  <th className="text-center py-2">Lab Size</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td className="text-center py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        f.accepting_students 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          f.accepting_students ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {f.accepting_students ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="text-center py-2">
                      {f.funding_availability ? (
                        <Badge variant="outline" className={
                          f.funding_availability.status === 'available' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : f.funding_availability.status === 'limited'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }>
                          {f.funding_availability.status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="text-center py-2">
                      {f.research_lab_info?.size ? `${f.research_lab_info.size} members` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResearchTab = () => (
    <div className="space-y-6">
      {faculty.map((f) => (
        <Card key={f.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <img
                src={getProfileImage(f)}
                alt={f.name}
                className="w-10 h-10 rounded-lg object-cover"
                onError={() => handleImageError(f.id)}
              />
              <div>
                <span>{f.name}</span>
                <p className="text-sm text-gray-500 font-normal">{f.university}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Research Interests</h4>
                <div className="flex flex-wrap gap-1">
                  {f.research_interests.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {f.current_projects && f.current_projects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Current Projects</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {f.current_projects.map((project, idx) => (
                      <li key={idx}>{project}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {f.research_lab_info && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Research Lab</h4>
                  <div className="space-y-1 text-sm">
                    {f.research_lab_info.name && (
                      <p><strong>Lab:</strong> {f.research_lab_info.name}</p>
                    )}
                    {f.research_lab_info.size && (
                      <p><strong>Size:</strong> {f.research_lab_info.size} members</p>
                    )}
                    {f.research_lab_info.funding_status && (
                      <p><strong>Funding:</strong> {f.research_lab_info.funding_status}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPublicationsTab = () => (
    <div className="space-y-6">
      {faculty.map((f) => (
        <Card key={f.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getProfileImage(f)}
                  alt={f.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={() => handleImageError(f.id)}
                />
                <span>{f.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {f.recent_publications && (
                  <Badge variant="secondary">
                    {f.recent_publications.length} publications
                  </Badge>
                )}
                {f.citation_count && (
                  <Badge variant="outline">
                    {f.citation_count} citations
                  </Badge>
                )}
                {f.h_index && (
                  <Badge variant="outline">
                    h-index: {f.h_index}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {f.recent_publications && f.recent_publications.length > 0 ? (
              <div className="space-y-3">
                {f.recent_publications.slice(0, 5).map((pub, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">{pub.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      {pub.year && <span>{pub.year}</span>}
                      {pub.journal && <span>• {pub.journal}</span>}
                      {pub.type && <span>• {pub.type}</span>}
                    </div>
                    {pub.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(pub.url, '_blank')}
                        className="h-6 text-xs p-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Paper
                      </Button>
                    )}
                  </div>
                ))}
                {f.recent_publications.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{f.recent_publications.length - 5} more publications
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent publications available</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      {faculty.map((f) => (
        <Card key={f.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getProfileImage(f)}
                  alt={f.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={() => handleImageError(f.id)}
                />
                <div>
                  <span>{f.name}</span>
                  <p className="text-sm text-gray-500 font-normal">{f.title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBookmark?.(f.id)}
                  className={bookmarkedIds.includes(f.id) ? 'bg-yellow-50 border-yellow-300' : ''}
                >
                  <BookMarked className={`h-3 w-3 ${bookmarkedIds.includes(f.id) ? 'text-yellow-600' : ''}`} />
                </Button>
                {onContact && (
                  <Button
                    size="sm"
                    onClick={() => onContact(f)}
                    disabled={!f.contact_information.email}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {f.contact_information.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium">Email</p>
                    <p className="text-sm text-blue-600">{f.contact_information.email}</p>
                  </div>
                </div>
              )}
              
              {f.contact_information.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium">Phone</p>
                    <p className="text-sm">{f.contact_information.phone}</p>
                  </div>
                </div>
              )}
              
              {f.contact_information.office && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium">Office</p>
                    <p className="text-sm">{f.contact_information.office}</p>
                  </div>
                </div>
              )}
              
              {f.contact_information.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium">Website</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(f.contact_information.website, '_blank')}
                      className="h-6 text-xs p-1 text-blue-600"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!isOpen || faculty.length === 0) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Faculty Comparison ({faculty.length})
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportComparison}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareComparison}
              >
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Faculty Header Cards */}
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg overflow-x-auto">
          {faculty.map((f) => (
            <div key={f.id} className="flex-shrink-0 w-48">
              <div className="relative bg-white p-3 rounded-lg border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFaculty(f.id)}
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="text-center">
                  <img
                    src={getProfileImage(f)}
                    alt={f.name}
                    className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                    onError={() => handleImageError(f.id)}
                  />
                  <h3 className="font-medium text-sm truncate">{f.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{f.university}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">
                      {Math.round(f.match_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'research', label: 'Research', icon: Award },
            { id: 'publications', label: 'Publications', icon: BookMarked },
            { id: 'contact', label: 'Contact', icon: Mail }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedView === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedView === 'overview' && renderOverviewTab()}
            {selectedView === 'research' && renderResearchTab()}
            {selectedView === 'publications' && renderPublicationsTab()}
            {selectedView === 'contact' && renderContactTab()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyComparison;