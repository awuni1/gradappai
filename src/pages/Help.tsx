import React from 'react';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  FileText, 
  ExternalLink,
  Search,
  BookOpen,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const Help: React.FC = () => {
  const navigate = useNavigate();

  const helpCategories = [
    {
      title: "Getting Started",
      icon: BookOpen,
      description: "Learn the basics of using GradApp",
      topics: [
        "Creating your account",
        "Completing your profile",
        "Understanding university matches",
        "Using the CV parser"
      ]
    },
    {
      title: "University Matching",
      icon: Search,
      description: "How our matching algorithm works",
      topics: [
        "How matches are calculated",
        "Improving your match scores",
        "Understanding match reasons",
        "Adding universities to favorites"
      ]
    },
    {
      title: "Profile & Settings",
      icon: Users,
      description: "Managing your account and preferences",
      topics: [
        "Updating your academic profile",
        "Privacy settings",
        "Notification preferences",
        "Account security"
      ]
    }
  ];

  return (
    <>
      <SEOHead 
        title="Help"
        description="Get help and support for using GradApp effectively"
        keywords="help, support, faq, user guide, documentation"
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
            <h1 className="text-3xl font-bold text-gradapp-primary mb-2">Help & Support</h1>
            <p className="text-gray-600">Find answers to common questions and get support</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Need help? Our support team is here to assist you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open('mailto:support@gradapp.com', '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <MessageCircle className="h-5 w-5" />
                  Community Discussion
                </CardTitle>
                <CardDescription className="text-green-600">
                  Connect with other GradApp users and share experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => navigate('/gradnet?tab=messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Join Discussion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Help Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Help Topics</h2>
            
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradapp-primary/10 rounded-lg flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-gradapp-primary" />
                    </div>
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="flex items-center gap-2 text-gray-600 hover:text-gradapp-primary cursor-pointer transition-colors">
                        <FileText className="h-4 w-4" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gradapp-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to the most common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">How does the university matching work?</h3>
                <p className="text-gray-600 text-sm">
                  Our AI-powered matching system analyzes your academic background, research interests, GPA, and test scores to find universities and programs that align with your profile. The match score reflects how well you fit the program's requirements and culture.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">Can I upload my CV for automatic profile completion?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! Our CV parsing feature can extract academic information from your resume to automatically fill your profile. Make sure your database is properly set up by following the setup wizard if you encounter any issues.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">How do I improve my match scores?</h3>
                <p className="text-gray-600 text-sm">
                  Complete your profile with detailed academic information, add specific research interests, and ensure your academic credentials are up to date. The more complete your profile, the better our matching algorithm can work.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Is my data secure and private?</h3>
                <p className="text-gray-600 text-sm">
                  Absolutely. We use enterprise-grade security measures to protect your personal and academic information. Your data is encrypted and never shared with third parties without your explicit consent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Still Need Help */}
          <Card className="mt-8 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-800">Still need help?</CardTitle>
              <CardDescription className="text-purple-600">
                Can't find what you're looking for? Our support team is ready to help.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 flex-1"
                onClick={() => window.open('mailto:support@gradapp.com?subject=Help Request', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button 
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100 flex-1"
                onClick={() => window.open('https://docs.gradapp.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Help;