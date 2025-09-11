import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Calendar, 
  Clock,
  BookOpen,
  Target,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SEOHead from '@/components/SEOHead';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  program: string;
  university: string;
  researchArea: string;
  status: 'active' | 'pending' | 'completed';
  startDate: string;
  lastContact?: string;
  meetingsScheduled: number;
  progress: number;
  photo?: string;
}

const MentorStudents: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/mentor/auth');
        return;
      }

      // For now, using mock data since the mentoring relationships table might not exist yet
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '+1 234-567-8901',
          location: 'Boston, MA',
          program: 'PhD in Computer Science',
          university: 'MIT',
          researchArea: 'Machine Learning',
          status: 'active',
          startDate: '2024-01-15',
          lastContact: '2024-01-20',
          meetingsScheduled: 3,
          progress: 65,
          photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          phone: '+1 234-567-8902',
          location: 'San Francisco, CA',
          program: 'MS in Data Science',
          university: 'Stanford University',
          researchArea: 'Natural Language Processing',
          status: 'active',
          startDate: '2024-01-10',
          lastContact: '2024-01-19',
          meetingsScheduled: 2,
          progress: 40,
          photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.r@example.com',
          location: 'New York, NY',
          program: 'PhD in Neuroscience',
          university: 'Columbia University',
          researchArea: 'Cognitive Neuroscience',
          status: 'pending',
          startDate: '2024-01-25',
          meetingsScheduled: 0,
          progress: 0,
          photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'
        }
      ];

      setStudents(mockStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.university.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMessageStudent = (studentId: string) => {
    // Navigate to messaging or open message modal
    toast.info('Messaging feature coming soon!');
  };

  const handleScheduleMeeting = (studentId: string) => {
    // Navigate to scheduling or open calendar
    toast.info('Scheduling feature coming soon!');
  };

  const handleViewProfile = (studentId: string) => {
    // Navigate to student profile
    navigate(`/mentor/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="My Students - Mentor Dashboard"
        description="Manage and connect with your mentees"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-600">Manage and connect with your mentees</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{students.length}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Total Students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {students.filter(s => s.status === 'active').length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Active Mentorships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">
                  {students.reduce((acc, s) => acc + s.meetingsScheduled, 0)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Meetings Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">
                  {students.filter(s => s.status === 'pending').length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search students by name, email, program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'You don\'t have any students yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.photo} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <CardDescription>{student.program}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span>{student.university}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>{student.researchArea}</span>
                    </div>
                    
                    {student.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{student.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{student.email}</span>
                    </div>

                    {student.status === 'active' && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageStudent(student.id);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleMeeting(student.id);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(student.id);
                        }}
                      >
                        View Profile
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Coming Soon Overlay */}
        <ComingSoonOverlay
          feature="Student Management"
          description="The student mentoring system is currently being refined. Soon you'll be able to track mentee progress, schedule meetings, review work, and maintain meaningful mentoring relationships."
          expectedDate="Q2 2025"
          features={[
            "Comprehensive student profile management",
            "Progress tracking and milestone setting",
            "Integrated messaging and video calls",
            "Document review and feedback system",
            "Meeting scheduling and calendar integration",
            "Performance analytics and reporting"
          ]}
          onNotifyMe={() => {
            toast.success("We'll notify you when student management features are ready!");
          }}
          className="absolute inset-0 rounded-lg"
        />
      </div>
    </div>
    </>
  );
};

export default MentorStudents;