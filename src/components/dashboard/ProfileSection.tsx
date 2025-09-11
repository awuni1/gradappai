import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Edit2, Save, X, User, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SettingsTab } from "./SettingsTab";
import { 
  AcademicProfile,
  ResearchInterest
} from "@/services/dashboardService";

interface ProfileSectionProps {
  user: any;
  academicProfile: AcademicProfile | null;
  researchInterests: ResearchInterest[];
  onUpdateProfile: (profile: AcademicProfile) => Promise<void>;
  onUpdateResearchInterests: (interests: ResearchInterest[]) => Promise<void>;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  academicProfile,
  researchInterests,
  onUpdateProfile,
  onUpdateResearchInterests,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<AcademicProfile>({
    institution: academicProfile?.institution || "",
    degree: academicProfile?.degree || "",
    field: academicProfile?.field || "",
    graduation_year: academicProfile?.graduation_year || "",
    gpa: academicProfile?.gpa || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [editedNames, setEditedNames] = useState({
    first_name: user?.user_metadata?.first_name || "",
    last_name: user?.user_metadata?.last_name || "",
  });
  const { toast } = useToast();

  // Fetch profile data on component mount
  React.useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) {return;}

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setProfileData(profile);
        setEditedNames({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Update academic profile
      await onUpdateProfile(editedProfile);
      
      // Update names and profile info
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: editedNames.first_name,
          last_name: editedNames.last_name,
          avatar_url: profileData?.avatar_url,
        });

      if (profileError) {throw profileError;}

      await fetchProfileData();
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    setIsUploading(true);
    try {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: editedNames.first_name || user.user_metadata?.first_name || "",
          last_name: editedNames.last_name || user.user_metadata?.last_name || "",
          avatar_url: publicUrl,
        });

      if (updateError) {
        throw updateError;
      }

      await fetchProfileData();
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      institution: academicProfile?.institution || "",
      degree: academicProfile?.degree || "",
      field: academicProfile?.field || "",
      graduation_year: academicProfile?.graduation_year || "",
      gpa: academicProfile?.gpa || "",
    });
    setEditedNames({
      first_name: profileData?.first_name || user?.user_metadata?.first_name || "",
      last_name: profileData?.last_name || user?.user_metadata?.last_name || "",
    });
    setIsEditing(false);
  };

  const displayFirstName = profileData?.first_name || user?.user_metadata?.first_name || "";
  const displayLastName = profileData?.last_name || user?.user_metadata?.last_name || "";
  const avatarUrl = profileData?.avatar_url || user?.user_metadata?.avatar_url || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Profile & Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header with Edit Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Profile Information</h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} alt="Profile picture" />
                  <AvatarFallback>
                    {(displayFirstName?.charAt(0) || "") + (displayLastName?.charAt(0) || "") || user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editedNames.first_name}
                        onChange={(e) =>
                          setEditedNames({ ...editedNames, first_name: e.target.value })
                        }
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editedNames.last_name}
                        onChange={(e) =>
                          setEditedNames({ ...editedNames, last_name: e.target.value })
                        }
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900">
                      {displayFirstName} {displayLastName}
                    </h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </>
                )}
              </div>
            </div>

            {/* Academic Profile */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Academic Background</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  {isEditing ? (
                    <Input
                      id="institution"
                      value={editedProfile.institution}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, institution: e.target.value })
                      }
                      placeholder="Your current institution"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {academicProfile?.institution || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="degree">Degree</Label>
                  {isEditing ? (
                    <Input
                      id="degree"
                      value={editedProfile.degree}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, degree: e.target.value })
                      }
                      placeholder="Your degree"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {academicProfile?.degree || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="field">Field of Study</Label>
                  {isEditing ? (
                    <Input
                      id="field"
                      value={editedProfile.field}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, field: e.target.value })
                      }
                      placeholder="Your field of study"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {academicProfile?.field || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  {isEditing ? (
                    <Input
                      id="graduationYear"
                      value={editedProfile.graduation_year}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, graduation_year: e.target.value })
                      }
                      placeholder="Year of graduation"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {academicProfile?.graduation_year || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  {isEditing ? (
                    <Input
                      id="gpa"
                      value={editedProfile.gpa || ""}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, gpa: e.target.value })
                      }
                      placeholder="Your GPA"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {academicProfile?.gpa || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Research Interests */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Research Interests</h4>
              <div className="flex flex-wrap gap-2">
                {researchInterests.length > 0 ? (
                  researchInterests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest.title}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No research interests specified</p>
                )}
              </div>
            </div>

          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab user={user} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
