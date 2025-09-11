import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Users, 
  Calendar, 
  BookOpen, 
  Star, 
  Clock, 
  Send,
  Search,
  Filter,
  Video,
  Phone,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle
} from 'lucide-react';
import MessageMentorModal from '@/components/mentorship/MessageMentorModal';
import BookSessionModal from '@/components/mentorship/BookSessionModal';
import SetGoalModal from '@/components/mentorship/SetGoalModal';
import { useToast } from '@/hooks/use-toast';

const DiscussionRoomSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedRoom, setSelectedRoom] = useState("general");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([
    {
      id: 1,
      title: "Complete Personal Statement",
      description: "Write and refine personal statement for graduate applications",
      targetDate: new Date('2024-11-30'),
      priority: "High",
      category: "Application Preparation",
      progress: 75,
      completed: false
    },
    {
      id: 2,
      title: "Research Three Universities",
      description: "Thoroughly research target universities and programs",
      targetDate: new Date('2024-11-25'),
      priority: "Medium",
      category: "Research",
      progress: 100,
      completed: true
    }
  ]);
  const { toast } = useToast();

  // Mock data for demonstration
  const mentorshipRooms = [
    {
      id: "general",
      name: "General Discussion",
      participants: 124,
      description: "Open forum for all graduate school discussions",
      category: "General",
      lastActivity: "2 min ago"
    },
    {
      id: "cs-phd",
      name: "Computer Science PhD",
      participants: 89,
      description: "Discussions for CS PhD applicants and students",
      category: "Field-Specific",
      lastActivity: "5 min ago"
    },
    {
      id: "funding",
      name: "Funding & Scholarships",
      participants: 156,
      description: "Share funding opportunities and tips",
      category: "Resources",
      lastActivity: "1 min ago"
    },
    {
      id: "international",
      name: "International Students",
      participants: 203,
      description: "Support for international applicants",
      category: "Community",
      lastActivity: "3 min ago"
    }
  ];

  const messages = [
    {
      id: 1,
      user: "Dr. Sarah Chen",
      role: "Mentor",
      avatar: "/api/placeholder/32/32",
      message: "Remember that your personal statement should tell a story, not just list achievements. What drives your passion for research?",
      timestamp: "10:30 AM",
      likes: 12,
      replies: 3
    },
    {
      id: 2,
      user: "Alex Thompson",
      role: "Mentee",
      avatar: "/api/placeholder/32/32",
      message: "I'm struggling with choosing between two research areas. How did you decide on your specialization?",
      timestamp: "10:25 AM",
      likes: 8,
      replies: 5
    },
    {
      id: 3,
      user: "Prof. Michael Rodriguez",
      role: "Mentor",
      avatar: "/api/placeholder/32/32",
      message: "Great question! I recommend shadowing labs in both areas if possible. Also, consider which field has more growth potential in the next decade.",
      timestamp: "10:20 AM",
      likes: 15,
      replies: 2
    }
  ];

  const mentors = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      field: "Computer Science",
      university: "Stanford University",
      rating: 4.9,
      sessions: 156,
      expertise: ["Machine Learning", "PhD Applications", "Research Methods"],
      available: true
    },
    {
      id: 2,
      name: "Prof. Michael Rodriguez",
      field: "Biology",
      university: "Harvard University",
      rating: 4.8,
      sessions: 203,
      expertise: ["Graduate School Prep", "Research Proposals", "Academic Writing"],
      available: false
    },
    {
      id: 3,
      name: "Dr. Emily Watson",
      field: "Psychology",
      university: "UCLA",
      rating: 4.9,
      sessions: 127,
      expertise: ["Clinical Psychology", "Thesis Writing", "Career Planning"],
      available: true
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: "Personal Statement Workshop",
      mentor: "Dr. Sarah Chen",
      date: "Nov 20, 2024",
      time: "2:00 PM - 3:30 PM",
      type: "Group Session",
      participants: 12
    },
    {
      id: 2,
      title: "Research Proposal Review",
      mentor: "Prof. Michael Rodriguez",
      date: "Nov 22, 2024",
      time: "10:00 AM - 11:00 AM",
      type: "1-on-1 Session",
      participants: 1
    }
  ];

  const resources = [
    {
      id: 1,
      title: "Graduate School Application Timeline",
      type: "Guide",
      author: "GradPath Team",
      downloads: 1250,
      rating: 4.8,
      url: "https://www.petersons.com/blog/graduate-school-application-timeline/"
    },
    {
      id: 2,
      title: "SOP Writing Masterclass",
      type: "Video",
      author: "Dr. Sarah Chen",
      downloads: 890,
      rating: 4.9,
      url: "https://www.scribbr.com/academic-writing/how-to-write-a-statement-of-purpose/"
    },
    {
      id: 3,
      title: "Research Proposal Template",
      type: "Template",
      author: "Prof. Michael Rodriguez",
      downloads: 670,
      rating: 4.7,
      url: "https://www.indeed.com/career-advice/career-development/how-to-write-a-research-proposal"
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      toast({
        title: "Message Sent",
        description: "Your message has been posted to the discussion room.",
      });
      setMessage("");
    }
  };

  const handleMessageMentor = (mentor: any) => {
    setSelectedMentor(mentor);
    setMessageModalOpen(true);
  };

  const handleBookSession = (mentor: any) => {
    setSelectedMentor(mentor);
    setBookingModalOpen(true);
  };

  const handleResourceClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleGoalAdded = (newGoal: any) => {
    setGoals([...goals, newGoal]);
  };

  const handleCompleteGoal = (goalId: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: true, progress: 100 }
        : goal
    ));
    toast({
      title: "Goal Completed!",
      description: "Congratulations on achieving your goal!",
    });
  };

  const handleDeleteGoal = (goalId: number) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
    toast({
      title: "Goal Deleted",
      description: "The goal has been removed from your list.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradapp-primary mb-2">Mentorship Hub</h2>
          <p className="text-gray-600">Connect, learn, and grow with mentors and peers</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setActiveTab("sessions")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Discussion Rooms
          </TabsTrigger>
          <TabsTrigger value="mentors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Find Mentors
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals & Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Room Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Discussion Rooms
                </CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {mentorshipRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedRoom === room.id 
                            ? 'bg-gradapp-primary text-white' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{room.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {room.participants}
                          </Badge>
                        </div>
                        <p className={`text-xs ${selectedRoom === room.id ? 'text-white/80' : 'text-gray-600'}`}>
                          {room.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {room.category}
                          </Badge>
                          <span className={`text-xs ${selectedRoom === room.id ? 'text-white/60' : 'text-gray-400'}`}>
                            {room.lastActivity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {mentorshipRooms.find(r => r.id === selectedRoom)?.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {mentorshipRooms.find(r => r.id === selectedRoom)?.participants} members
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 mb-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.user}</span>
                            <Badge 
                              variant={msg.role === 'Mentor' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {msg.role}
                            </Badge>
                            <span className="text-xs text-gray-500">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <button className="flex items-center gap-1 hover:text-gradapp-primary">
                              <Star className="w-3 h-3" />
                              {msg.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-gradapp-primary">
                              <MessageCircle className="w-3 h-3" />
                              {msg.replies} replies
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Share your thoughts, ask questions, or offer advice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} className="bg-gradapp-primary hover:bg-gradapp-accent">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mentors" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Available Mentors</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Search by field or expertise..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{mentor.name}</h4>
                      <p className="text-sm text-gray-600">{mentor.field}</p>
                      <p className="text-xs text-gray-500">{mentor.university}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${mentor.available ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{mentor.rating}</span>
                      </div>
                      <span className="text-gray-600">{mentor.sessions} sessions</span>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600">Expertise:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mentor.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                        onClick={() => handleMessageMentor(mentor)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleBookSession(mentor)}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Book Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Upcoming Sessions</h3>
            <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule New Session
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <Badge variant="outline">{session.type}</Badge>
                  </div>
                  <CardDescription>with {session.mentor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{session.participants} participant{session.participants > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <Button size="sm" className="bg-gradapp-primary hover:bg-gradapp-accent">
                        <Video className="w-4 h-4 mr-1" />
                        Join Session
                      </Button>
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Learning Resources</h3>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <Badge variant="secondary">{resource.type}</Badge>
                  </div>
                  <CardDescription>by {resource.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{resource.rating}</span>
                      </div>
                      <span className="text-gray-600">{resource.downloads} downloads</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full bg-gradapp-primary hover:bg-gradapp-accent"
                      onClick={() => handleResourceClick(resource.url)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Access Resource
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Goals & Progress Tracking</h3>
            <Button 
              className="bg-gradapp-primary hover:bg-gradapp-accent"
              onClick={() => setGoalModalOpen(true)}
            >
              <Target className="w-4 h-4 mr-2" />
              Set New Goal
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Current Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.filter(goal => !goal.completed).map((goal) => (
                    <div key={goal.id} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleCompleteGoal(goal.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{width: `${goal.progress}%`}}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          {goal.category}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          Due: {goal.targetDate.toDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Completed Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goals.filter(goal => goal.completed).map((goal) => (
                    <div key={goal.id} className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{goal.title}</h4>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                  ))}
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Schedule Mock Interview</h4>
                    <p className="text-xs text-gray-600">Based on your upcoming deadlines</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Review Research Statement</h4>
                    <p className="text-xs text-gray-600">Recommended by Dr. Sarah Chen</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Connect with Alumni</h4>
                    <p className="text-xs text-gray-600">From your target universities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedMentor && (
        <MessageMentorModal
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          mentorName={selectedMentor.name}
          mentorField={selectedMentor.field}
        />
      )}

      {selectedMentor && (
        <BookSessionModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentorName={selectedMentor.name}
          mentorField={selectedMentor.field}
        />
      )}

      <SetGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onGoalAdded={handleGoalAdded}
      />
    </div>
  );
};

export default DiscussionRoomSection;
