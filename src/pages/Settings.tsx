import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User as UserIcon, 
  CreditCard, 
  Bell, 
  Shield, 
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  FileText,
  Award,
  BookOpen,
  Briefcase,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { AcademicProfileService, AcademicProfile, EducationDetail, AcademicPublication, AcademicAward } from '@/services/academicProfileService';
import SEOHead from '@/components/SEOHead';

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { section } = useParams();

  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: ''
  });

  // Academic profile states
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null);
  const [education, setEducation] = useState<EducationDetail[]>([]);
  const [publications, setPublications] = useState<AcademicPublication[]>([]);
  const [awards, setAwards] = useState<AcademicAward[]>([]);
  const [researchInterests, setResearchInterests] = useState<any[]>([]);
  const [academicLoading, setAcademicLoading] = useState(false);

  useEffect(() => {
    // Get initial user and set active tab from URL
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        setUser(user);
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          bio: user.user_metadata?.bio || ''
        });
        
        if (section) {
          setActiveTab(section);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Add a timeout to avoid hanging indefinitely (increased timeout)
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Settings page loading timeout');
        setLoading(false);
      }
    }, 10000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/');
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, section]);

  // Load academic profile data with error handling and timeout
  const loadAcademicProfile = async () => {
    if (!user) {return;}
    
    setAcademicLoading(true);
    
    // Add timeout to prevent infinite loading (increased timeout)
    const timeoutId = setTimeout(() => {
      console.warn('Academic profile loading timeout');
      setAcademicLoading(false);
    }, 12000);

    try {
      const result = await AcademicProfileService.getAcademicProfile(user.id);
      clearTimeout(timeoutId);
      
      if (!result.error) {
        setAcademicProfile(result.profile);
        setEducation(result.education);
        setPublications(result.publications);
        setAwards(result.awards);
        setResearchInterests(result.researchInterests);
      } else {
        console.warn('Academic profile load error:', result.error);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error loading academic profile:', error);
    } finally {
      setAcademicLoading(false);
    }
  };

  // Load academic profile when user is set and academic tab is active (with caching)
  useEffect(() => {
    if (user && activeTab === 'academic' && !academicProfile) {
      loadAcademicProfile();
    }
  }, [user, activeTab]);

  const handleProfileSave = async () => {
    if (!user) {return;}

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          bio: profileData.bio
        }
      });

      if (error) {throw error;}
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading settings..." />;
  }

  if (!user) {return null;}

  return (
    <>
      <SEOHead 
        title="Settings"
        description="Manage your account settings and preferences"
        keywords="settings, account management, profile settings, academic profile"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-gray-600 hover:text-gradapp-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gradapp-primary mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and settings</p>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border-0 p-2">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-gray-50">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                  onClick={() => navigate('/settings/profile')}
                >
                  <UserIcon className="w-4 h-4 mr-2" /> Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="academic" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                  onClick={() => navigate('/settings/academic')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" /> Academic
                </TabsTrigger>
                <TabsTrigger 
                  value="account" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                  onClick={() => navigate('/settings/account')}
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Account
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                  onClick={() => navigate('/settings/notifications')}
                >
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                  onClick={() => navigate('/settings/privacy')}
                >
                  <Shield className="w-4 h-4 mr-2" /> Privacy
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gradapp-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed from this page</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gradapp-primary focus:border-transparent resize-none"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us a bit about yourself..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">{profileData.bio.length}/500 characters</p>
                  </div>

                  <Button 
                    onClick={handleProfileSave} 
                    disabled={saving}
                    className="bg-gradapp-primary hover:bg-gradapp-accent"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Profile Settings */}
            <TabsContent value="academic" className="space-y-6">
              {academicLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="md" message="Loading academic profile..." />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Academic Profile Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-gradapp-primary" />
                        Academic Profile Overview
                      </CardTitle>
                      <CardDescription>
                        Your academic profile extracted from your CV/resume
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {academicProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                              <p className="text-lg font-semibold">{academicProfile.full_name || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Current Position</Label>
                              <p>{academicProfile.current_position || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Institution</Label>
                              <p>{academicProfile.current_institution || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Publications</Label>
                              <p className="text-lg font-semibold">{academicProfile.publication_count || 0}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">H-Index</Label>
                              <p className="text-lg font-semibold">{academicProfile.h_index || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Total Citations</Label>
                              <p className="text-lg font-semibold">{academicProfile.total_citations || 0}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            No academic profile found. Upload your CV in the onboarding process to automatically populate this section.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Education Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-gradapp-primary" />
                        Education
                      </CardTitle>
                      <CardDescription>
                        Your educational background and degrees
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {education.length > 0 ? (
                        <div className="space-y-4">
                          {education.map((edu, index) => (
                            <div key={edu.id || index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{edu.degree_type} {edu.major_field && `in ${edu.major_field}`}</h3>
                                {edu.graduation_date && (
                                  <Badge variant="secondary">
                                    {new Date(edu.graduation_date).getFullYear()}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gradapp-primary font-medium">{edu.institution_name}</p>
                              {edu.gpa && (
                                <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
                              )}
                              {edu.honors && edu.honors.length > 0 && (
                                <div className="mt-2">
                                  <Label className="text-xs font-medium text-gray-500">Honors:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {edu.honors.map((honor, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {honor}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <BookOpen className="h-4 w-4" />
                          <AlertDescription>
                            No education information found. This will be populated when you upload your CV.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Publications Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gradapp-primary" />
                        Publications
                      </CardTitle>
                      <CardDescription>
                        Your research publications and papers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {publications.length > 0 ? (
                        <div className="space-y-4">
                          {publications.slice(0, 5).map((pub, index) => (
                            <div key={pub.id || index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-sm leading-tight">{pub.title}</h3>
                                <Badge variant="outline" className="ml-2 shrink-0">
                                  {pub.venue_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gradapp-primary">{pub.journal_name || pub.conference_name}</p>
                              {pub.publication_year && (
                                <p className="text-xs text-gray-500 mt-1">Published: {pub.publication_year}</p>
                              )}
                              {pub.doi && (
                                <p className="text-xs text-gray-500">DOI: {pub.doi}</p>
                              )}
                            </div>
                          ))}
                          {publications.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              And {publications.length - 5} more publications...
                            </p>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            No publications found. This will be populated when you upload your CV.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Awards and Recognition */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-gradapp-primary" />
                        Awards & Recognition
                      </CardTitle>
                      <CardDescription>
                        Your academic awards, fellowships, and grants
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {awards.length > 0 ? (
                        <div className="space-y-4">
                          {awards.map((award, index) => (
                            <div key={award.id || index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">{award.title}</h3>
                                <Badge variant="secondary">
                                  {award.award_type}
                                </Badge>
                              </div>
                              <p className="text-gradapp-primary font-medium">{award.organization}</p>
                              {award.award_date && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Awarded: {new Date(award.award_date).getFullYear()}
                                </p>
                              )}
                              {award.description && (
                                <p className="text-sm text-gray-700 mt-2">{award.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <Award className="h-4 w-4" />
                          <AlertDescription>
                            No awards or recognition found. This will be populated when you upload your CV.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Research Interests */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-gradapp-primary" />
                        Research Interests
                      </CardTitle>
                      <CardDescription>
                        Your research areas and interests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {researchInterests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {researchInterests.map((interest, index) => (
                            <Badge key={index} variant="default" className="bg-gradapp-primary/10 text-gradapp-primary">
                              {interest.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            No research interests found. This will be populated when you upload your CV.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gradapp-primary" />
                    Account Management
                  </CardTitle>
                  <CardDescription>
                    Manage your account settings and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Account management features are coming soon. For now, you can update your profile information in the Profile tab.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium">Account Status</h3>
                        <p className="text-sm text-gray-500">Your account is active and verified</p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gradapp-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>
                      Notification settings will be available in a future update. Stay tuned!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Security */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gradapp-primary" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>
                    Control your privacy settings and account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Privacy and security settings will be available in a future update. Your data is secure and protected.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Settings;