import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  TrendingUp, 
  MapPin, 
  GraduationCap,
  Briefcase,
  Calendar,
  Award,
  ExternalLink,
  Search,
  Filter,
  Network,
  Target,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface NetworkingHubProps {
  user: User;
}

const NetworkingHub: React.FC<NetworkingHubProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('connections');

  // Mock connections data
  const connections = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      role: "Mentor",
      title: "Associate Professor",
      university: "Stanford University",
      field: "Computer Science",
      avatar: "/api/placeholder/50/50",
      connectionDate: "Connected 3 months ago",
      mutualConnections: 12,
      status: "Available",
      lastInteraction: "2 days ago",
      expertise: ["Machine Learning", "PhD Mentoring"],
      verified: true
    },
    {
      id: 2,
      name: "Emily Watson",
      role: "Peer",
      title: "PhD Candidate",
      university: "UCLA",
      field: "Psychology",
      avatar: "/api/placeholder/50/50",
      connectionDate: "Connected 1 month ago",
      mutualConnections: 5,
      status: "Busy",
      lastInteraction: "1 week ago",
      expertise: ["Clinical Psychology", "Research Methods"],
      verified: false
    },
    {
      id: 3,
      name: "Prof. Michael Rodriguez",
      role: "Mentor",
      title: "Professor & Department Head",
      university: "Harvard University",
      field: "Biology",
      avatar: "/api/placeholder/50/50",
      connectionDate: "Connected 6 months ago",
      mutualConnections: 18,
      status: "Available",
      lastInteraction: "3 days ago",
      expertise: ["Molecular Biology", "Academic Writing"],
      verified: true
    }
  ];

  // Mock networking suggestions
  const suggestions = [
    {
      id: 4,
      name: "Dr. Lisa Zhang",
      title: "Assistant Professor",
      university: "MIT",
      field: "Computer Science",
      avatar: "/api/placeholder/50/50",
      mutualConnections: 8,
      matchScore: 92,
      reason: "Shares research interests in Data Science Ethics",
      expertise: ["Data Science Ethics", "Machine Learning"],
      verified: true
    },
    {
      id: 5,
      name: "Alex Thompson",
      title: "Graduate Student",
      university: "UC Berkeley",
      field: "Computer Science",
      avatar: "/api/placeholder/50/50",
      mutualConnections: 3,
      matchScore: 87,
      reason: "Similar academic background and goals",
      expertise: ["Deep Learning", "Computer Vision"],
      verified: false
    },
    {
      id: 6,
      name: "Dr. James Park",
      title: "Senior Research Scientist",
      university: "Google Research",
      field: "Engineering",
      avatar: "/api/placeholder/50/50",
      mutualConnections: 15,
      matchScore: 89,
      reason: "Industry mentor with similar research background",
      expertise: ["Robotics", "Industry Transition"],
      verified: true
    }
  ];

  // Mock networking events
  const events = [
    {
      id: 1,
      title: "Virtual PhD Application Workshop",
      description: "Learn from successful PhD students and admissions committee members",
      date: "November 25, 2024",
      time: "2:00 PM - 4:00 PM PST",
      attendees: 156,
      organizer: "GradNet Community",
      type: "Workshop",
      isRegistered: false
    },
    {
      id: 2,
      title: "Computer Science Networking Mixer",
      description: "Connect with CS students and faculty from top universities",
      date: "December 2, 2024",
      time: "6:00 PM - 8:00 PM EST",
      attendees: 89,
      organizer: "CS Graduate Network",
      type: "Social",
      isRegistered: true
    },
    {
      id: 3,
      title: "Research Presentation Bootcamp",
      description: "Master the art of presenting your research effectively",
      date: "December 10, 2024",
      time: "10:00 AM - 12:00 PM PST",
      attendees: 67,
      organizer: "Prof. Sarah Chen",
      type: "Training",
      isRegistered: false
    }
  ];

  const handleConnect = (personId: number) => {
    toast.success('Connection request sent!');
  };

  const handleMessage = (personId: number) => {
    toast.success('Opening message...');
  };

  const handleEventRegister = (eventId: number) => {
    toast.success('Registered for event!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Busy':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) {return 'text-green-600 bg-green-50';}
    if (score >= 80) {return 'text-blue-600 bg-blue-50';}
    return 'text-yellow-600 bg-yellow-50';
  };

  // Ensure we have some fallback if data is missing
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Loading Network...</h2>
        <p className="text-gray-600">Please wait while we load your network.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Network className="h-6 w-6" />
            My Network
          </h2>
          <p className="text-gray-600">Build meaningful connections for your graduate school journey</p>
        </div>
        
        {/* Network Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gradapp-primary">{connections.length}</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradapp-primary">47</div>
            <div className="text-sm text-gray-600">Profile Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradapp-primary">12</div>
            <div className="text-sm text-gray-600">Recommendations</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gradapp-primary focus:border-transparent"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connections List */}
          <div className="grid gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={connection.avatar} />
                      <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{connection.name}</h3>
                        {connection.verified && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                        <Badge className={`text-xs ${getStatusColor(connection.status)}`}>
                          {connection.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 font-medium">{connection.title}</p>
                      <p className="text-gray-600">{connection.university} • {connection.field}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{connection.connectionDate}</span>
                        <span>•</span>
                        <span>{connection.mutualConnections} mutual connections</span>
                        <span>•</span>
                        <span>Last interaction: {connection.lastInteraction}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {connection.expertise.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleMessage(connection.id)}
                        className="bg-gradapp-primary hover:bg-gradapp-accent"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                People You Should Know
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={suggestion.avatar} />
                      <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{suggestion.name}</h3>
                        {suggestion.verified && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                        <Badge className={`text-xs font-bold ${getMatchScoreColor(suggestion.matchScore)}`}>
                          {suggestion.matchScore}% Match
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 font-medium">{suggestion.title}</p>
                      <p className="text-gray-600">{suggestion.university} • {suggestion.field}</p>
                      
                      <p className="text-sm text-gradapp-primary mt-1 font-medium">
                        {suggestion.reason}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{suggestion.mutualConnections} mutual connections</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.expertise.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleConnect(suggestion.id)}
                        className="bg-gradapp-primary hover:bg-gradapp-accent"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Networking Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.isRegistered && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Registered
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{event.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{event.attendees} attendees</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Organized by <span className="font-medium">{event.organizer}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {event.isRegistered ? (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Event
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleEventRegister(event.id)}
                            className="bg-gradapp-primary hover:bg-gradapp-accent"
                          >
                            Register
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Event Button */}
          <div className="text-center">
            <Button variant="outline" className="bg-white">
              <Plus className="h-4 w-4 mr-2" />
              Host Your Own Event
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkingHub;