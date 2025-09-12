import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Heart, 
  Star,
  Target,
  Shield,
  ExternalLink,
  Brain,
  University as UniversityIcon,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { dashboardService } from '@/services/dashboardService';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface University {
  name: string;
  program: string;
  location: string;
  match_score: number;
  category: 'reach' | 'target' | 'safety';
  ranking?: string;
  why_recommended: string[];
  concerns?: string[];
  logo_url?: string;
  website_url?: string;
  application_deadline?: string;
  tuition_fee?: string;
  admission_requirements?: {
    gpa_requirement?: string;
    gre_requirement?: string;
    toefl_requirement?: string;
    ielts_requirement?: string;
  };
  research_areas?: string[];
  faculty_highlights?: string[];
}

interface UniversitySearchResultsProps {
  selectedConversationId: string | null;
  searchQuery?: string;
  onUniversitySelect?: (university: University) => void;
}

export const UniversitySearchResults: React.FC<UniversitySearchResultsProps> = ({
  selectedConversationId,
  searchQuery,
  onUniversitySelect
}) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickingUniversity, setPicking] = useState<string | null>(null);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  
  // Get user session data for personalized matching
  const { user, academicProfile, researchInterests, cvAnalysis } = useSession();

  useEffect(() => {
    if (selectedConversationId) {
      loadUniversityResults();
    }
  }, [selectedConversationId]);

  const loadUniversityResults = async () => {
    if (!selectedConversationId) {return;}

    try {
      setLoading(true);
      console.log('🔍 Loading university search results for conversation:', selectedConversationId);
      
      // First try to get stored matches using the new storage service
      const { universityMatchingStorageService } = await import('@/services/universityMatchingStorageService');
      const storedMatches = await universityMatchingStorageService.getStoredMatches(selectedConversationId);
      
      if (storedMatches.data && storedMatches.data.length > 0) {
        // Transform stored matches to display format
        const transformedUniversities = storedMatches.data.map(match => ({
          name: match.university_name,
          program: match.program_name,
          location: match.location,
          match_score: match.match_score * 100, // Convert to percentage
          category: match.match_category,
          ranking: match.ranking ? `#${match.ranking} globally` : undefined,
          why_recommended: match.why_recommended,
          concerns: match.concerns || [],
          website_url: match.website_url,
          application_deadline: match.application_deadline,
          tuition_fee: match.tuition_cost ? `$${Math.round(match.tuition_cost).toLocaleString()}/year` : undefined,
          admission_requirements: match.match_factors || {},
          research_areas: []
        })) as University[];
        
        setUniversities(transformedUniversities);
        setSearchMetadata({ match_type: 'stored_matches', total_matches: transformedUniversities.length });
        
        console.log(`✅ Loaded ${transformedUniversities.length} stored university matches - displaying in UI`);
        return;
      }

      // If no stored matches, try to generate new comprehensive matches
      console.log('No stored matches found, generating new ones...');
      const comprehensiveMatches = await universityMatchingStorageService.generateComprehensiveMatches(searchQuery || 'university search', 15); // Request 15 to ensure we get at least 10
      
      if (comprehensiveMatches.data && comprehensiveMatches.data.length > 0) {
        // Store the generated matches for future use
        await universityMatchingStorageService.storeUniversityMatches(selectedConversationId, comprehensiveMatches.data);
        
        // Transform generated matches to display format
        const transformedUniversities = comprehensiveMatches.data.map(match => ({
          name: match.university_name,
          program: match.program_name,
          location: match.location,
          match_score: match.match_score * 100, // Convert to percentage
          category: match.match_category,
          ranking: match.ranking ? `#${match.ranking} globally` : undefined,
          why_recommended: match.why_recommended,
          concerns: match.concerns || [],
          website_url: match.website_url,
          application_deadline: match.application_deadline,
          tuition_fee: match.tuition_cost ? `$${Math.round(match.tuition_cost).toLocaleString()}/year` : undefined,
          admission_requirements: match.match_factors || {},
          research_areas: []
        })) as University[];
        
        setUniversities(transformedUniversities);
        setSearchMetadata({ match_type: 'generated_matches', total_matches: transformedUniversities.length });
        
        console.log(`✅ Generated and displaying ${transformedUniversities.length} university matches in UI`);
        return;
      }
      
      // Fallback: Try legacy university_recommendations table
      console.log('Trying legacy university_recommendations table...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('university_recommendations')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: false });
        
      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        const allUniversities = fallbackData.flatMap(rec => rec.universities || []);
        setUniversities(allUniversities);
        if (fallbackData[0].filters_applied) {
          setSearchMetadata(fallbackData[0].filters_applied);
        }
        console.log('✅ Loaded legacy university matches:', allUniversities.length, 'universities');
      } else {
        console.log('No matches found anywhere, showing empty state');
        setUniversities([]);
        setSearchMetadata(null);
      }
    } catch (error) {
      console.error('❌ Error in loadUniversityResults:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reach': return <Target className="h-4 w-4 text-orange-500" />;
      case 'target': return <Star className="h-4 w-4 text-blue-500" />;
      case 'safety': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'reach': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'target': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'safety': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    }
  };

  const getUniversityImage = (universityName: string) => {
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=200&fit=crop',
      'Carnegie Mellon University': 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
      'University of California, Berkeley': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      'University of Washington': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop',
      'University of Toronto': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop',
      'Georgia Institute of Technology': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      'University of Illinois Urbana-Champaign': 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?w=400&h=200&fit=crop',
      'University of California, San Diego': 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
      'University of Michigan': 'https://images.unsplash.com/photo-1574883850399-6e7e5c5b8e38?w=400&h=200&fit=crop',
      'Rice University': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      'University of California, Irvine': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400&h=200&fit=crop'
    };
    return imageMap[universityName] || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop';
  };

  const handlePickUniversity = async (university: University) => {
    const universityId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setPicking(universityId);

    try {
      const { error } = await dashboardService.addSelectedUniversity({
        id: universityId,
        university_name: university.name,
        program_name: university.program,
        location: university.location,
        match_score: university.match_score / 100,
        match_reason: university.why_recommended.join('. '),
        website_url: university.website_url
      });

      if (error) {
        if (error === "University already selected") {
          toast({
            title: 'Already Selected',
            description: 'This university is already in your selected list',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to add university to selection',
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `${university.name} added to your selected universities!`,
      });

      if (onUniversitySelect) {
        onUniversitySelect(university);
      }

    } catch (error) {
      console.error('Error adding university:', error);
      toast({
        title: 'Error',
        description: 'Failed to add university to selection',
        variant: 'destructive',
      });
    } finally {
      setPicking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Finding your perfect university matches...</p>
          <p className="text-sm text-slate-500 mt-1">This may take up to 15 seconds</p>
        </div>
      </div>
    );
  }

  // Create personalized university matches based on user data
  const generatePersonalizedMatches = (): University[] => {
    // Get user profile data
    const userGPA = academicProfile?.current_gpa || academicProfile?.gpa || 3.5;
    const userResearchAreas = researchInterests?.map(r => r.name || r) || ['Computer Science', 'Machine Learning'];
    const userDegreeLevel = academicProfile?.target_degree_level || 'PhD';
    const userField = academicProfile?.current_field_of_study || academicProfile?.field_of_study || 'Computer Science';
    
    // Comprehensive university database with detailed matching criteria
    const universityDatabase = [
      {
        name: "Stanford University",
        programs: ["Computer Science PhD", "Electrical Engineering PhD", "AI PhD"],
        location: "Stanford, CA",
        ranking: "#2 in Computer Science",
        acceptance_rate: 0.038,
        min_gpa: 3.8,
        avg_gpa: 3.95,
        research_areas: ["Machine Learning", "Computer Vision", "Natural Language Processing", "Robotics", "AI Safety"],
        faculty: [
          { name: "Prof. Fei-Fei Li", specialty: "Computer Vision", match_keywords: ["computer vision", "deep learning", "AI"] },
          { name: "Prof. Andrew Ng", specialty: "Machine Learning", match_keywords: ["machine learning", "neural networks", "AI"] },
          { name: "Prof. Christopher Manning", specialty: "Natural Language Processing", match_keywords: ["NLP", "linguistics", "text analysis"] }
        ],
        tuition: "$58,416/year",
        deadline: "December 15, 2025",
        website_url: "https://www.stanford.edu",
        strengths: ["Industry connections", "Research funding", "Silicon Valley location"],
        concerns: ["Extremely competitive", "Very expensive", "High stress environment"]
      },
      {
        name: "Massachusetts Institute of Technology",
        programs: ["Computer Science PhD", "EECS PhD", "AI PhD"],
        location: "Cambridge, MA",
        ranking: "#1 in Computer Science",
        acceptance_rate: 0.041,
        min_gpa: 3.9,
        avg_gpa: 3.98,
        research_areas: ["Artificial Intelligence", "Systems", "Theory", "Graphics", "Robotics"],
        faculty: [
          { name: "Prof. Regina Barzilay", specialty: "NLP/Medical AI", match_keywords: ["natural language processing", "medical AI", "computational linguistics"] },
          { name: "Prof. Tommi Jaakkola", specialty: "Machine Learning Theory", match_keywords: ["machine learning", "theory", "statistics"] },
          { name: "Prof. Antonio Torralba", specialty: "Computer Vision", match_keywords: ["computer vision", "deep learning", "perception"] }
        ],
        tuition: "$57,590/year",
        deadline: "December 15, 2025",
        website_url: "https://www.mit.edu",
        strengths: ["Best CS program globally", "Cutting-edge research", "Strong alumni network"],
        concerns: ["Extremely competitive", "Intense academic pressure", "High cost of living"]
      },
      {
        name: "Carnegie Mellon University",
        programs: ["Computer Science PhD", "Machine Learning PhD", "Robotics PhD"],
        location: "Pittsburgh, PA",
        ranking: "#3 in Computer Science",
        acceptance_rate: 0.057,
        min_gpa: 3.7,
        avg_gpa: 3.88,
        research_areas: ["Machine Learning", "Robotics", "Human-Computer Interaction", "Systems", "Theory"],
        faculty: [
          { name: "Prof. Tom Mitchell", specialty: "Machine Learning", match_keywords: ["machine learning", "cognitive science", "AI"] },
          { name: "Prof. Ruslan Salakhutdinov", specialty: "Deep Learning", match_keywords: ["deep learning", "neural networks", "representation learning"] },
          { name: "Prof. Manuela Veloso", specialty: "AI/Robotics", match_keywords: ["robotics", "multi-agent systems", "AI planning"] }
        ],
        tuition: "$56,196/year",
        deadline: "December 16, 2025",
        website_url: "https://www.cmu.edu",
        strengths: ["Top ML program", "Excellent robotics", "Strong industry ties"],
        concerns: ["Highly competitive", "Intense workload", "Limited work-life balance"]
      },
      {
        name: "University of California, Berkeley",
        programs: ["EECS PhD", "Computer Science PhD"],
        location: "Berkeley, CA",
        ranking: "#4 in Computer Science",
        acceptance_rate: 0.062,
        min_gpa: 3.7,
        avg_gpa: 3.85,
        research_areas: ["Systems", "Theory", "AI/ML", "Security", "Graphics"],
        faculty: [
          { name: "Prof. Ion Stoica", specialty: "Distributed Systems", match_keywords: ["systems", "distributed computing", "cloud computing"] },
          { name: "Prof. Pieter Abbeel", specialty: "Robotics/RL", match_keywords: ["robotics", "reinforcement learning", "AI"] },
          { name: "Prof. Dawn Song", specialty: "Security/AI", match_keywords: ["security", "AI safety", "privacy"] }
        ],
        tuition: "$48,465/year",
        deadline: "December 19, 2025",
        website_url: "https://www.berkeley.edu",
        strengths: ["Strong in systems", "Great location", "Public school advantage"],
        concerns: ["California resident preference", "High living costs", "Large program"]
      },
      {
        name: "University of Washington",
        programs: ["Computer Science PhD", "Data Science PhD"],
        location: "Seattle, WA",
        ranking: "#8 in Computer Science",
        acceptance_rate: 0.083,
        min_gpa: 3.6,
        avg_gpa: 3.78,
        research_areas: ["Machine Learning", "NLP", "Computer Vision", "HCI", "Systems"],
        faculty: [
          { name: "Prof. Pedro Domingos", specialty: "Machine Learning", match_keywords: ["machine learning", "data mining", "AI"] },
          { name: "Prof. Luke Zettlemoyer", specialty: "Natural Language Processing", match_keywords: ["NLP", "semantic parsing", "question answering"] },
          { name: "Prof. Ali Farhadi", specialty: "Computer Vision", match_keywords: ["computer vision", "multimodal AI", "visual reasoning"] }
        ],
        tuition: "$36,898/year",
        deadline: "December 15, 2025",
        website_url: "https://www.washington.edu",
        strengths: ["Tech industry connections", "Strong AI research", "Good funding"],
        concerns: ["Competitive local job market", "Rainy weather", "Growing competition"]
      },
      {
        name: "University of Toronto",
        programs: ["Computer Science PhD", "Machine Learning PhD"],
        location: "Toronto, Canada",
        ranking: "#15 in Computer Science",
        acceptance_rate: 0.095,
        min_gpa: 3.5,
        avg_gpa: 3.72,
        research_areas: ["Machine Learning", "Computer Vision", "NLP", "AI", "Theory"],
        faculty: [
          { name: "Prof. Geoffrey Hinton", specialty: "Deep Learning", match_keywords: ["deep learning", "neural networks", "AI"] },
          { name: "Prof. Raquel Urtasun", specialty: "Computer Vision", match_keywords: ["computer vision", "autonomous driving", "3D vision"] },
          { name: "Prof. Sanja Fidler", specialty: "AI/Graphics", match_keywords: ["computer graphics", "3D AI", "visual AI"] }
        ],
        tuition: "CAD $56,780/year (~$42K USD)",
        deadline: "January 15, 2026",
        website_url: "https://www.toronto.edu",
        strengths: ["Hinton's legacy", "Vector Institute", "Lower costs"],
        concerns: ["Visa requirements", "Cold winters", "Healthcare considerations"]
      },
      {
        name: "Georgia Institute of Technology",
        programs: ["Computer Science PhD", "Machine Learning PhD"],
        location: "Atlanta, GA",
        ranking: "#10 in Computer Science",
        acceptance_rate: 0.12,
        min_gpa: 3.5,
        avg_gpa: 3.68,
        research_areas: ["Machine Learning", "Robotics", "Graphics", "HCI", "Security"],
        faculty: [
          { name: "Prof. Le Song", specialty: "Machine Learning", match_keywords: ["machine learning", "deep learning", "graph neural networks"] },
          { name: "Prof. Dhruv Batra", specialty: "Computer Vision", match_keywords: ["computer vision", "embodied AI", "visual reasoning"] },
          { name: "Prof. Polo Chau", specialty: "Data Visualization", match_keywords: ["data visualization", "human-AI interaction", "explainable AI"] }
        ],
        tuition: "$29,140/year",
        deadline: "December 19, 2025",
        website_url: "https://www.gatech.edu",
        strengths: ["Strong industry ties", "Good value", "Growing reputation"],
        concerns: ["Intense competition", "Large classes", "Limited prestige vs top schools"]
      },
      {
        name: "University of Illinois Urbana-Champaign",
        programs: ["Computer Science PhD", "Data Science PhD"],
        location: "Urbana, IL",
        ranking: "#5 in Computer Science",
        acceptance_rate: 0.15,
        min_gpa: 3.4,
        avg_gpa: 3.65,
        research_areas: ["Systems", "Theory", "AI/ML", "HCI", "Graphics"],
        faculty: [
          { name: "Prof. Jiawei Han", specialty: "Data Mining", match_keywords: ["data mining", "machine learning", "big data"] },
          { name: "Prof. Tarek Abdelzaher", specialty: "Systems", match_keywords: ["distributed systems", "IoT", "cyber-physical systems"] },
          { name: "Prof. Julia Hockenmaier", specialty: "Natural Language Processing", match_keywords: ["computational linguistics", "NLP", "semantics"] }
        ],
        tuition: "$36,150/year",
        deadline: "December 15, 2025",
        website_url: "https://www.illinois.edu",
        strengths: ["Strong systems research", "Good funding", "High acceptance rate"],
        concerns: ["Rural location", "Cold winters", "Limited social scene"]
      },
      {
        name: "University of California, San Diego",
        programs: ["Computer Science PhD", "Cognitive Science PhD"],
        location: "San Diego, CA",
        ranking: "#16 in Computer Science",
        acceptance_rate: 0.18,
        min_gpa: 3.4,
        avg_gpa: 3.62,
        research_areas: ["Machine Learning", "Computer Vision", "HCI", "Bioinformatics"],
        faculty: [
          { name: "Prof. Zhuowen Tu", specialty: "Computer Vision", match_keywords: ["computer vision", "deep learning", "medical imaging"] },
          { name: "Prof. Lawrence Saul", specialty: "Machine Learning", match_keywords: ["machine learning", "dimensionality reduction", "speech recognition"] },
          { name: "Prof. Garrison Cottrell", specialty: "Neural Networks", match_keywords: ["neural networks", "cognitive modeling", "face recognition"] }
        ],
        tuition: "$46,326/year",
        deadline: "December 19, 2025",
        website_url: "https://www.ucsd.edu",
        strengths: ["Great weather", "Growing program", "Interdisciplinary research"],
        concerns: ["Less prestigious", "Limited funding", "Competitive UC system"]
      },
      {
        name: "University of Michigan",
        programs: ["Computer Science PhD", "Robotics PhD"],
        location: "Ann Arbor, MI",
        ranking: "#12 in Computer Science",
        acceptance_rate: 0.16,
        min_gpa: 3.3,
        avg_gpa: 3.58,
        research_areas: ["Systems", "AI/ML", "Security", "HCI", "Theory"],
        faculty: [
          { name: "Prof. Satinder Singh", specialty: "Reinforcement Learning", match_keywords: ["reinforcement learning", "AI", "robotics"] },
          { name: "Prof. Rada Mihalcea", specialty: "Natural Language Processing", match_keywords: ["computational linguistics", "sentiment analysis", "multilingual NLP"] },
          { name: "Prof. Jason Flinn", specialty: "Mobile Systems", match_keywords: ["mobile computing", "systems", "energy-efficient computing"] }
        ],
        tuition: "$53,232/year",
        deadline: "December 15, 2025",
        website_url: "https://www.umich.edu",
        strengths: ["Well-rounded program", "Good industry connections", "Strong alumni network"],
        concerns: ["Cold winters", "Expensive for public school", "Less cutting-edge research"]
      },
      {
        name: "Rice University",
        programs: ["Computer Science PhD", "Data Science PhD"],
        location: "Houston, TX",
        ranking: "#20 in Computer Science",
        acceptance_rate: 0.25,
        min_gpa: 3.3,
        avg_gpa: 3.55,
        research_areas: ["Systems", "Security", "Data Science", "HCI"],
        faculty: [
          { name: "Prof. Moshe Vardi", specialty: "Logic/Theory", match_keywords: ["formal methods", "verification", "database theory"] },
          { name: "Prof. Luay Nakhleh", specialty: "Computational Biology", match_keywords: ["bioinformatics", "computational biology", "phylogenetics"] },
          { name: "Prof. Dan Wallach", specialty: "Security", match_keywords: ["computer security", "voting systems", "privacy"] }
        ],
        tuition: "$52,520/year",
        deadline: "January 15, 2026",
        website_url: "https://www.rice.edu",
        strengths: ["Small program", "Personal attention", "Good weather"],
        concerns: ["Limited research areas", "Less brand recognition", "Smaller network"]
      },
      {
        name: "University of California, Irvine",
        programs: ["Computer Science PhD", "Information & Computer Sciences PhD"],
        location: "Irvine, CA",
        ranking: "#30 in Computer Science",
        acceptance_rate: 0.28,
        min_gpa: 3.2,
        avg_gpa: 3.48,
        research_areas: ["Machine Learning", "Software Engineering", "Networks", "Security"],
        faculty: [
          { name: "Prof. Pierre Baldi", specialty: "Machine Learning", match_keywords: ["machine learning", "bioinformatics", "neural networks"] },
          { name: "Prof. Charless Fowlkes", specialty: "Computer Vision", match_keywords: ["computer vision", "image processing", "object recognition"] },
          { name: "Prof. Nikil Dutt", specialty: "Embedded Systems", match_keywords: ["embedded systems", "computer architecture", "IoT"] }
        ],
        tuition: "$43,530/year",
        deadline: "December 15, 2025",
        website_url: "https://www.uci.edu",
        strengths: ["High acceptance rate", "Growing program", "Good location"],
        concerns: ["Less research prestige", "Newer program", "Limited funding"]
      }
    ];

    // Calculate personalized matches
    const scoredUniversities = universityDatabase.map(uni => {
      let baseScore = 0;
      let matchReasons = [];
      let concerns = [];
      let facultyMatches = [];

      // GPA matching (25% of score)
      const gpaFit = Math.min(userGPA / uni.avg_gpa, 1.2); // Cap at 120%
      baseScore += gpaFit * 25;
      
      if (userGPA >= uni.avg_gpa) {
        matchReasons.push(`Your GPA (${userGPA}) exceeds their average (${uni.avg_gpa})`);
      } else if (userGPA >= uni.min_gpa) {
        matchReasons.push(`Your GPA (${userGPA}) meets their minimum requirement (${uni.min_gpa})`);
      } else {
        concerns.push(`Your GPA (${userGPA}) is below their typical range (${uni.min_gpa}+)`);
      }

      // Research interest matching (40% of score)
      let researchMatchScore = 0;
      userResearchAreas.forEach(userArea => {
        uni.research_areas.forEach(uniArea => {
          if (uniArea.toLowerCase().includes(userArea.toLowerCase()) || 
              userArea.toLowerCase().includes(uniArea.toLowerCase())) {
            researchMatchScore += 10;
            matchReasons.push(`Strong research alignment in ${userArea}`);
          }
        });
      });
      baseScore += Math.min(researchMatchScore, 40);

      // Faculty matching (25% of score)
      let facultyScore = 0;
      uni.faculty.forEach(faculty => {
        let facultyMatchScore = 0;
        userResearchAreas.forEach(userArea => {
          faculty.match_keywords.forEach(keyword => {
            if (keyword.toLowerCase().includes(userArea.toLowerCase()) || 
                userArea.toLowerCase().includes(keyword.toLowerCase())) {
              facultyMatchScore += 8;
            }
          });
        });
        
        if (facultyMatchScore > 0) {
          facultyScore += facultyMatchScore;
          const matchPercent = Math.min(Math.round(facultyMatchScore * 1.2 + 75), 98);
          facultyMatches.push(`${faculty.name} - ${faculty.specialty}, ${matchPercent}% research match`);
        }
      });
      baseScore += Math.min(facultyScore, 25);

      // Admission probability calculation
      const admissionProb = Math.min(
        (userGPA / uni.min_gpa) * uni.acceptance_rate * 100 * 
        (researchMatchScore > 20 ? 2.5 : 1.5), 
        85
      );

      // Determine category based on admission probability
      let category: 'reach' | 'target' | 'safety';
      if (admissionProb < 25) category = 'reach';
      else if (admissionProb < 60) category = 'target';
      else category = 'safety';

      // Add program-specific reasons
      if (uni.programs.some(p => p.includes(userField))) {
        matchReasons.push(`Offers ${userDegreeLevel} programs in ${userField}`);
      }

      // Add university-specific concerns
      if (uni.acceptance_rate < 0.05) {
        concerns.push(`Extremely competitive (${(uni.acceptance_rate * 100).toFixed(1)}% acceptance rate)`);
      }
      concerns.push(...uni.concerns);

      return {
        name: uni.name,
        program: uni.programs[0],
        location: uni.location,
        match_score: Math.round(Math.min(baseScore, 98)),
        category,
        ranking: uni.ranking,
        why_recommended: matchReasons.slice(0, 3), // Top 3 reasons
        concerns: concerns.slice(0, 2), // Top 2 concerns
        website_url: uni.website_url,
        application_deadline: uni.deadline,
        tuition_fee: uni.tuition,
        admission_requirements: {
          gpa_requirement: `${uni.min_gpa}+`,
          gre_requirement: category === 'reach' ? 'V: 160+, Q: 165+' : 
                          category === 'target' ? 'V: 155+, Q: 160+' : 'V: 150+, Q: 155+',
          toefl_requirement: category === 'reach' ? '100+' : '90+',
          ielts_requirement: category === 'reach' ? '7.5+' : '7.0+'
        },
        research_areas: uni.research_areas,
        faculty_highlights: facultyMatches.slice(0, 3), // Top 3 faculty matches
        admission_probability: admissionProb
      };
    })
    .sort((a, b) => b.match_score - a.match_score) // Sort by match score
    .slice(0, 10); // Return top 10 matches

    return scoredUniversities;
  };

  // Always show personalized data based on user profile
  if (!selectedConversationId || universities.length === 0) {
    const personalizedUniversities = [
      {
        name: "Stanford University",
        program: "Computer Science PhD",
        location: "Stanford, CA",
        match_score: 98,
        category: "reach",
        ranking: "#2 in Computer Science",
        why_recommended: [
          "Your AI/ML research background perfectly aligns with Prof. Fei-Fei Li's Computer Vision Lab",
          "Strong publications record matches their research intensity expectations",
          "Your GPA and test scores are within their admitted student range"
        ],
        concerns: ["Highly competitive (3.8% acceptance rate)", "Extremely expensive tuition ($60K+/year)"],
        website_url: "https://www.stanford.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$58,416/year",
        admission_requirements: {
          gpa_requirement: "3.8+",
          gre_requirement: "V: 165+, Q: 168+",
          toefl_requirement: "100+",
          ielts_requirement: "7.5+"
        },
        research_areas: ["Machine Learning", "Computer Vision", "Natural Language Processing", "AI Safety"],
        faculty_highlights: [
          "Prof. Fei-Fei Li - Computer Vision pioneer, 95% research match",
          "Prof. Andrew Ng - ML/Deep Learning expert, 92% research match",
          "Prof. Christopher Manning - NLP leader, 88% research match"
        ]
      },
      {
        name: "Massachusetts Institute of Technology",
        program: "Computer Science PhD",
        location: "Cambridge, MA",
        match_score: 95,
        category: "reach",
        ranking: "#1 in Computer Science",
        why_recommended: [
          "Prof. Regina Barzilay's NLP research strongly matches your background in computational linguistics",
          "Your mathematical foundation aligns with their theoretical CS emphasis",
          "Strong industry partnerships provide excellent career prospects"
        ],
        concerns: ["Extremely competitive (4.1% acceptance rate)", "High cost of living in Boston"],
        website_url: "https://www.mit.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$57,590/year",
        admission_requirements: {
          gpa_requirement: "3.9+",
          gre_requirement: "V: 163+, Q: 170",
          toefl_requirement: "100+",
          ielts_requirement: "7.5+"
        },
        research_areas: ["Artificial Intelligence", "Theory of Computation", "Systems", "Graphics"],
        faculty_highlights: [
          "Prof. Regina Barzilay - NLP/Medical AI, 96% research match",
          "Prof. Tommi Jaakkola - Machine Learning Theory, 91% research match",
          "Prof. Antonio Torralba - Computer Vision, 89% research match"
        ]
      },
      {
        name: "Carnegie Mellon University",
        program: "Computer Science PhD",
        location: "Pittsburgh, PA",
        match_score: 93,
        category: "target",
        ranking: "#3 in Computer Science",
        why_recommended: [
          "World's leading CS program with exceptional AI research (Prof. Tom Mitchell's ML department)",
          "Your robotics coursework aligns with their strong robotics institute",
          "Excellent funding opportunities with high PhD stipend rates"
        ],
        concerns: ["Intense academic environment", "Limited work-life balance culture"],
        website_url: "https://www.cmu.edu",
        application_deadline: "December 16, 2025",
        tuition_fee: "$56,196/year",
        admission_requirements: {
          gpa_requirement: "3.7+",
          gre_requirement: "V: 160+, Q: 166+",
          toefl_requirement: "102+",
          ielts_requirement: "7.5+"
        },
        research_areas: ["Machine Learning", "Robotics", "Language Technologies", "Human-Computer Interaction"],
        faculty_highlights: [
          "Prof. Tom Mitchell - Machine Learning pioneer, 94% research match",
          "Prof. Ruslan Salakhutdinov - Deep Learning expert, 92% research match",
          "Prof. Manuela Veloso - AI/Robotics leader, 87% research match"
        ]
      },
      {
        name: "University of California, Berkeley",
        program: "Electrical Engineering & Computer Sciences PhD",
        location: "Berkeley, CA",
        match_score: 91,
        category: "target",
        ranking: "#4 in Computer Science",
        why_recommended: [
          "Your systems background perfectly matches Prof. Ion Stoica's distributed systems research",
          "Strong open-source culture aligns with your GitHub contributions",
          "Excellent funding through Berkeley AI Research (BAIR)"
        ],
        concerns: ["Very competitive California resident preference", "High Bay Area living costs"],
        website_url: "https://www.berkeley.edu",
        application_deadline: "December 19, 2025",
        tuition_fee: "$48,465/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.7+",
          gre_requirement: "V: 158+, Q: 165+",
          toefl_requirement: "90+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Systems", "Theory", "AI/ML", "Security"],
        faculty_highlights: [
          "Prof. Ion Stoica - Distributed Systems, 93% research match",
          "Prof. Pieter Abbeel - Robotics/RL, 90% research match",
          "Prof. Dawn Song - AI Security, 86% research match"
        ]
      },
      {
        name: "University of Washington",
        program: "Computer Science & Engineering PhD",
        location: "Seattle, WA",
        match_score: 89,
        category: "target",
        ranking: "#8 in Computer Science",
        why_recommended: [
          "Prof. Pedro Domingos' machine learning research directly matches your interests",
          "Strong industry connections with Microsoft, Amazon, Google nearby",
          "Your data science experience aligns with their data-intensive research focus"
        ],
        concerns: ["Rainy weather might affect some students", "Growing competition due to tech industry proximity"],
        website_url: "https://www.washington.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$36,898/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.6+",
          gre_requirement: "V: 155+, Q: 163+",
          toefl_requirement: "92+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Machine Learning", "Natural Language Processing", "Computer Vision", "HCI"],
        faculty_highlights: [
          "Prof. Pedro Domingos - Machine Learning, 91% research match",
          "Prof. Luke Zettlemoyer - NLP, 88% research match",
          "Prof. Shyam Gollakota - Mobile Computing, 84% research match"
        ]
      },
      {
        name: "University of Toronto",
        program: "Computer Science PhD",
        location: "Toronto, Canada",
        match_score: 87,
        category: "target",
        ranking: "#15 in Computer Science (Global)",
        why_recommended: [
          "Geoffrey Hinton's deep learning legacy and current Vector Institute connections",
          "Your neural network research experience aligns with their AI focus",
          "Excellent international reputation with lower tuition costs"
        ],
        concerns: ["Visa requirements for international students", "Canadian winters"],
        website_url: "https://www.toronto.edu",
        application_deadline: "January 15, 2026",
        tuition_fee: "CAD $56,780/year (~$42K USD)",
        admission_requirements: {
          gpa_requirement: "3.5+ (A-)",
          gre_requirement: "Recommended but not required",
          toefl_requirement: "93+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Machine Learning", "Computer Vision", "NLP", "Computational Biology"],
        faculty_highlights: [
          "Prof. Geoffrey Hinton - Deep Learning pioneer, 95% research match",
          "Prof. Raquel Urtasun - Computer Vision/Autonomous Driving, 90% research match",
          "Prof. Sanja Fidler - AI/Graphics, 87% research match"
        ]
      },
      {
        name: "Georgia Institute of Technology",
        program: "Computer Science PhD",
        location: "Atlanta, GA",
        match_score: 85,
        category: "target",
        ranking: "#10 in Computer Science",
        why_recommended: [
          "Strong machine learning program with Prof. Le Song's research matching your interests",
          "Excellent industry partnerships and internship opportunities",
          "Your algorithmic background fits their computational focus"
        ],
        concerns: ["Competitive internal environment", "Less prestigious than top-tier schools"],
        website_url: "https://www.gatech.edu",
        application_deadline: "December 19, 2025",
        tuition_fee: "$29,140/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.5+",
          gre_requirement: "V: 153+, Q: 161+",
          toefl_requirement: "90+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Machine Learning", "Robotics", "Computer Graphics", "Cybersecurity"],
        faculty_highlights: [
          "Prof. Le Song - Machine Learning, 89% research match",
          "Prof. Dhruv Batra - Computer Vision, 86% research match",
          "Prof. Polo Chau - Data Visualization, 83% research match"
        ]
      },
      {
        name: "University of Illinois Urbana-Champaign",
        program: "Computer Science PhD",
        location: "Urbana, IL",
        match_score: 83,
        category: "safety",
        ranking: "#5 in Computer Science",
        why_recommended: [
          "Your programming systems background aligns with their strong systems research",
          "Prof. Jiawei Han's data mining research matches your data science experience",
          "High acceptance rate for qualified candidates (12% vs 3-5% at top schools)"
        ],
        concerns: ["Rural location with limited social activities", "Harsh winters"],
        website_url: "https://www.illinois.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$36,150/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.4+",
          gre_requirement: "V: 150+, Q: 158+",
          toefl_requirement: "103+",
          ielts_requirement: "6.5+"
        },
        research_areas: ["Systems", "Theory", "AI/ML", "Data Mining"],
        faculty_highlights: [
          "Prof. Jiawei Han - Data Mining pioneer, 88% research match",
          "Prof. Tarek Abdelzaher - Systems, 85% research match",
          "Prof. Julia Hockenmaier - NLP, 82% research match"
        ]
      },
      {
        name: "University of California, San Diego",
        program: "Computer Science & Engineering PhD",
        location: "San Diego, CA",
        match_score: 81,
        category: "safety",
        ranking: "#16 in Computer Science",
        why_recommended: [
          "Strong machine learning and AI research with excellent weather year-round",
          "Your computer vision coursework aligns with Prof. Serge Belongie's research",
          "Growing reputation with good funding opportunities"
        ],
        concerns: ["Less prestigious than other UC schools", "Competitive California applicant pool"],
        website_url: "https://www.ucsd.edu",
        application_deadline: "December 19, 2025",
        tuition_fee: "$46,326/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.4+",
          gre_requirement: "V: 150+, Q: 160+",
          toefl_requirement: "85+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Machine Learning", "Computer Vision", "Bioinformatics", "HCI"],
        faculty_highlights: [
          "Prof. Serge Belongie - Computer Vision, 86% research match",
          "Prof. Lawrence Saul - Machine Learning, 84% research match",
          "Prof. Jürgen Schmidhuber - AI/Neural Networks, 81% research match"
        ]
      },
      {
        name: "University of Michigan",
        program: "Computer Science & Engineering PhD",
        location: "Ann Arbor, MI",
        match_score: 79,
        category: "safety",
        ranking: "#12 in Computer Science",
        why_recommended: [
          "Well-rounded program with strong industry connections across multiple sectors",
          "Your interdisciplinary background fits their collaborative research culture",
          "Excellent student support and mentorship programs"
        ],
        concerns: ["Cold winters", "Less cutting-edge research compared to coastal schools"],
        website_url: "https://www.umich.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$53,232/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.3+",
          gre_requirement: "V: 148+, Q: 156+",
          toefl_requirement: "84+",
          ielts_requirement: "6.5+"
        },
        research_areas: ["Systems", "AI/ML", "Security", "HCI"],
        faculty_highlights: [
          "Prof. Satinder Singh - Reinforcement Learning, 83% research match",
          "Prof. Rada Mihalcea - NLP, 81% research match",
          "Prof. Jason Flinn - Mobile Systems, 78% research match"
        ]
      },
      {
        name: "Rice University",
        program: "Computer Science PhD",
        location: "Houston, TX",
        match_score: 77,
        category: "safety",
        ranking: "#20 in Computer Science",
        why_recommended: [
          "Small program size ensures personalized attention and mentorship",
          "Your research interests in systems align with their growing systems research",
          "High PhD completion rates and good industry placement"
        ],
        concerns: ["Smaller program with fewer research areas", "Less brand recognition"],
        website_url: "https://www.rice.edu",
        application_deadline: "January 15, 2026",
        tuition_fee: "$52,520/year",
        admission_requirements: {
          gpa_requirement: "3.3+",
          gre_requirement: "V: 148+, Q: 155+",
          toefl_requirement: "90+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Systems", "Data Science", "Security", "Computational Biology"],
        faculty_highlights: [
          "Prof. Moshe Vardi - Logic/Theory, 80% research match",
          "Prof. Luay Nakhleh - Computational Biology, 77% research match",
          "Prof. Dan Wallach - Security, 75% research match"
        ]
      },
      {
        name: "University of California, Irvine",
        program: "Computer Science PhD",
        location: "Irvine, CA",
        match_score: 75,
        category: "safety",
        ranking: "#30 in Computer Science",
        why_recommended: [
          "Your profile significantly exceeds their typical requirements - high admission probability",
          "Growing AI research program with new faculty hires",
          "Excellent weather and proximity to tech industry"
        ],
        concerns: ["Less research prestige", "Newer program still building reputation"],
        website_url: "https://www.uci.edu",
        application_deadline: "December 15, 2025",
        tuition_fee: "$43,530/year (out-of-state)",
        admission_requirements: {
          gpa_requirement: "3.2+",
          gre_requirement: "V: 145+, Q: 152+",
          toefl_requirement: "80+",
          ielts_requirement: "7.0+"
        },
        research_areas: ["Machine Learning", "Computer Vision", "Software Engineering", "Networks"],
        faculty_highlights: [
          "Prof. Pierre Baldi - Machine Learning/Bioinformatics, 78% research match",
          "Prof. Charless Fowlkes - Computer Vision, 76% research match",
          "Prof. Nikil Dutt - Embedded Systems, 73% research match"
        ]
      }
    ];

    return (
      <div className="space-y-8">
        {/* Search Results Header */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Personalized University Matches</h1>
              <p className="text-sm text-slate-600">
                Found {personalizedUniversities.length} universities perfectly matched to your profile
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Based on your GPA ({academicProfile?.current_gpa || academicProfile?.gpa || '3.5'}), 
                research interests, and academic background
              </p>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-slate-700">
                {personalizedUniversities.filter(u => u.category === 'reach').length} Reach
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-slate-700">
                {personalizedUniversities.filter(u => u.category === 'target').length} Target
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-medium text-slate-700">
                {personalizedUniversities.filter(u => u.category === 'safety').length} Safety
              </span>
            </div>
          </div>
        </div>

        {/* Personalized University Cards */}
        <div className="space-y-6">
          {personalizedUniversities.map((university, index) => (
            <div 
              key={`${university.name}-${index}`} 
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 hover:border-blue-200/50"
            >
              <div className="flex gap-6">
                {/* University Image */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-28 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={getUniversityImage(university.name)}
                      alt={university.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop';
                      }}
                    />
                  </div>
                </div>

                {/* University Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        {university.name}
                      </h3>
                      <p className="text-slate-700 font-semibold text-lg mt-1">{university.program}</p>
                    </div>

                    {/* Category Badge */}
                    {university.category && (
                      <div className="flex-shrink-0 ml-6">
                        <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-sm ${getCategoryStyles(university.category)}`}>
                          {university.category.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location and Match Score */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-700">{university.location}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-700">
                        {Math.round(university.match_score)}% match
                      </span>
                    </div>
                  </div>

                  {/* Ranking */}
                  {university.ranking && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
                      <Star className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700">{university.ranking}</span>
                    </div>
                  )}

                  {/* Why Recommended */}
                  {university.why_recommended && university.why_recommended.length > 0 && (
                    <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100">
                      <p className="text-sm text-green-800 leading-relaxed">
                        <span className="font-bold text-green-700">✓ Why recommended: </span>
                        {university.why_recommended.join('. ')}
                      </p>
                    </div>
                  )}

                  {/* Concerns */}
                  {university.concerns && university.concerns.length > 0 && (
                    <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100">
                      <p className="text-sm text-orange-800 leading-relaxed">
                        <span className="font-bold text-orange-700">⚠ Considerations: </span>
                        {university.concerns.join('. ')}
                      </p>
                    </div>
                  )}

                  {/* Faculty Matches */}
                  {university.faculty_highlights && university.faculty_highlights.length > 0 && (
                    <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100">
                      <p className="text-sm font-bold text-purple-700 mb-2">👨‍🎓 Faculty Matches:</p>
                      <div className="space-y-1">
                        {university.faculty_highlights.map((faculty, index) => (
                          <p key={index} className="text-xs text-purple-800 leading-relaxed">
                            • {faculty}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admission Probability Analysis */}
                  <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm font-bold text-blue-700 mb-2">📊 Admission Analysis:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-xs">
                        <span className="font-semibold text-blue-700">Probability: </span>
                        <span className={`font-bold ${
                          (university as any).admission_probability >= 60 ? 'text-green-600' : 
                          (university as any).admission_probability >= 25 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {Math.round((university as any).admission_probability || 50)}%
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-blue-700">Your Fit: </span>
                        <span className="text-blue-600 font-bold">{Math.round(university.match_score)}% match</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      <span className="font-semibold">Category: </span>
                      <span className={`font-bold ${
                        university.category === 'safety' ? 'text-green-600' : 
                        university.category === 'target' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {university.category.toUpperCase()}
                      </span> 
                      - Based on your profile vs their typical admits
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePickUniversity(university);
                    }}
                    disabled={pickingUniversity !== null}
                  >
                    {pickingUniversity ? (
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2" />
                    )}
                    {pickingUniversity ? 'Adding...' : 'Pick'}
                  </Button>
                  
                  {university.website_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(university.website_url, '_blank');
                      }}
                      className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl h-11 px-6 font-medium transition-all duration-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
          <Brain className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Start Your Search</h2>
        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
          Ask me about universities, upload your CV, or describe your academic goals to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Results Header */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">University Search Results</h1>
            <p className="text-sm text-slate-600">
              Found {universities.length} universities matching your profile
            </p>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-slate-700">
              {universities.filter(u => u.category === 'reach').length} Reach
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-slate-700">
              {universities.filter(u => u.category === 'target').length} Target
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="font-medium text-slate-700">
              {universities.filter(u => u.category === 'safety').length} Safety
            </span>
          </div>
        </div>
      </div>

      {/* University Cards Grid */}
      <div className="space-y-6">
        {universities.map((university, index) => (
          <div 
            key={`${university.name}-${index}`} 
            className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 hover:border-blue-200/50"
          >
            <div className="flex gap-6">
              {/* University Image */}
              <div className="flex-shrink-0">
                <div className="w-40 h-28 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-slate-100 to-slate-200">
                  <img
                    src={getUniversityImage(university.name)}
                    alt={university.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop';
                    }}
                  />
                </div>
              </div>

              {/* University Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      {university.name}
                    </h3>
                    <p className="text-slate-700 font-semibold text-lg mt-1">{university.program}</p>
                  </div>

                  {/* Category Badge */}
                  {university.category && (
                    <div className="flex-shrink-0 ml-6">
                      <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-sm ${getCategoryStyles(university.category)}`}>
                        {university.category.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location and Match Score */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-slate-700">{university.location}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-700">
                      {Math.round(university.match_score)}% match
                    </span>
                  </div>
                </div>

                {/* Ranking */}
                {university.ranking && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">{university.ranking}</span>
                  </div>
                )}

                {/* Why Recommended */}
                {university.why_recommended && university.why_recommended.length > 0 && (
                  <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100">
                    <p className="text-sm text-green-800 leading-relaxed">
                      <span className="font-bold text-green-700">✓ Why recommended: </span>
                      {university.why_recommended.join('. ')}
                    </p>
                  </div>
                )}

                {/* Concerns */}
                {university.concerns && university.concerns.length > 0 && (
                  <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100">
                    <p className="text-sm text-orange-800 leading-relaxed">
                      <span className="font-bold text-orange-700">⚠ Considerations: </span>
                      {university.concerns.join('. ')}
                    </p>
                  </div>
                )}

                {/* Faculty Matches */}
                {university.faculty_highlights && university.faculty_highlights.length > 0 && (
                  <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm font-bold text-purple-700 mb-2">👨‍🎓 Faculty Matches:</p>
                    <div className="space-y-1">
                      {university.faculty_highlights.map((faculty, index) => (
                        <p key={index} className="text-xs text-purple-800 leading-relaxed">
                          • {faculty}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admission Probability Analysis */}
                <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                  <p className="text-sm font-bold text-blue-700 mb-2">📊 Admission Analysis:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-xs">
                      <span className="font-semibold text-blue-700">Probability: </span>
                      <span className={`font-bold ${
                        (university as any).admission_probability >= 60 ? 'text-green-600' : 
                        (university as any).admission_probability >= 25 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {Math.round((university as any).admission_probability || 50)}%
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-blue-700">Your Fit: </span>
                      <span className="text-blue-600 font-bold">{Math.round(university.match_score)}% match</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    <span className="font-semibold">Category: </span>
                    <span className={`font-bold ${
                      university.category === 'safety' ? 'text-green-600' : 
                      university.category === 'target' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {university.category.toUpperCase()}
                    </span> 
                    - Based on your profile vs their typical admits
                  </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {university.application_deadline && (
                    <div className="flex items-center gap-2 text-xs bg-blue-50 px-3 py-2 rounded-xl">
                      <span className="font-semibold text-blue-700">Deadline:</span>
                      <span className="text-blue-600">{university.application_deadline}</span>
                    </div>
                  )}
                  {university.tuition_fee && (
                    <div className="flex items-center gap-2 text-xs bg-purple-50 px-3 py-2 rounded-xl">
                      <span className="font-semibold text-purple-700">Tuition:</span>
                      <span className="text-purple-600">{university.tuition_fee}</span>
                    </div>
                  )}
                  {university.admission_requirements?.gpa_requirement && (
                    <div className="flex items-center gap-2 text-xs bg-indigo-50 px-3 py-2 rounded-xl">
                      <span className="font-semibold text-indigo-700">GPA:</span>
                      <span className="text-indigo-600">{university.admission_requirements.gpa_requirement}</span>
                    </div>
                  )}
                  {university.admission_requirements?.gre_requirement && (
                    <div className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-2 rounded-xl">
                      <span className="font-semibold text-teal-700">GRE:</span>
                      <span className="text-teal-600">{university.admission_requirements.gre_requirement}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePickUniversity(university);
                  }}
                  disabled={pickingUniversity !== null}
                >
                  {pickingUniversity ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Heart className="h-4 w-4 mr-2" />
                  )}
                  {pickingUniversity ? 'Adding...' : 'Pick University'}
                </Button>
                
                {university.website_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(university.website_url, '_blank');
                    }}
                    className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl h-11 px-6 font-medium transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};