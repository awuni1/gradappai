import { supabase } from '../integrations/supabase/client';
import { ChatGPTService } from './chatGptService';

export interface University {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  state_province: string | null;
  website_url: string | null;
  code: string | null;
  description: string | null;
  logo_url: string | null;
  acceptance_rate: number | null;
  ranking_global: number | null;
  ranking_national: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Additional fields that might be referenced in the component but not in basic schema
  qs_ranking?: number | null;
  enrollment_total?: number | null;
  tuition_international?: number | null;
  campus_setting?: string | null;
  institution_type?: string | null;
}

export interface GraduateProgram {
  id: string;
  university_id: string;
  program_name: string;
  degree_type: 'masters' | 'phd' | 'professional' | 'certificate';
  field_of_study: string;
  department: string;
  duration_months: number;
  tuition_fees: any;
  requirements: any;
  deadlines: any;
  funding_info: any;
  research_areas: string[];
  faculty_count: number;
  student_count: number;
  admission_rate: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UniversityMatch {
  id: string;
  user_id: string;
  university_id: string;
  program_id: string;
  match_score: number;
  category: 'reach' | 'target' | 'safety';
  reasoning: string;
  match_factors: any;
  ai_model_version: string;
  created_at: string;
  updated_at: string;
}

export interface MatchRequest {
  userProfile: {
    gpa: number;
    testScores: any;
    researchInterests: string[];
    targetDegree: string;
    preferences: {
      countries?: string[];
      locations?: string[];
      universityTypes?: string[];
      maxTuition?: number;
      minAdmissionRate?: number;
    };
  };
  cvAnalysis?: {
    personalInfo?: any;
    education?: any[];
    experience?: any[];
    skills?: any;
    researchAreas?: string[];
    recommendations?: any;
  };
}

class UniversityMatchingService {
  /**
   * Create AI matching session (using your schema)
   */
  async createMatchingSession(userId: string, matchingCriteria: any, cvAnalysisId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_matching_sessions')
        .insert({
          user_id: userId,
          session_name: `University Matching - ${new Date().toLocaleDateString()}`,
          matching_criteria: matchingCriteria,
          cv_analysis_id: cvAnalysisId,
          target_degree_level: matchingCriteria.userProfile?.targetDegree || 'masters',
          preferred_countries: matchingCriteria.userProfile?.preferences?.countries || ['United States'],
          preferred_fields: matchingCriteria.userProfile?.researchInterests || [],
          ai_model_used: 'gpt-4o-mini',
          processing_status: 'processing',
          processing_started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {throw error;}

      console.log(`✅ Created AI matching session: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Failed to create AI matching session:', error);
      // Return a temporary ID if database creation fails
      return `temp_session_${Date.now()}`;
    }
  }

  /**
   * Update matching session with results
   */
  async completeMatchingSession(sessionId: string, matches: any[], profileAnalysis?: any): Promise<void> {
    try {
      // Calculate match statistics
      const totalMatches = matches.length;
      const safetyMatches = matches.filter(m => m.match_category === 'safety').length;
      const targetMatches = matches.filter(m => m.match_category === 'target').length;
      const reachMatches = matches.filter(m => m.match_category === 'reach').length;
      const dreamMatches = matches.filter(m => m.match_category === 'dream').length;

      const { error } = await supabase
        .from('ai_matching_sessions')
        .update({
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          total_matches_found: totalMatches,
          safety_matches: safetyMatches,
          target_matches: targetMatches,
          reach_matches: reachMatches,
          dream_matches: dreamMatches,
          overall_competitiveness_score: profileAnalysis?.overall_competitiveness || 75,
          recommendation_summary: `Generated ${totalMatches} university matches based on your profile`
        })
        .eq('id', sessionId);

      if (error && !sessionId.startsWith('temp_')) {
        console.warn('Failed to update AI matching session:', error);
      } else {
        console.log(`✅ Completed AI matching session: ${sessionId}`);
      }
    } catch (error) {
      console.warn('Failed to complete matching session:', error);
    }
  }

  /**
   * Seed comprehensive university and program data with real institutions
   */
  async seedUniversityData(): Promise<void> {
    console.log('🌱 Seeding comprehensive university data with real institutions...');

    const universities = [
      {
        name: 'Stanford University',
        country: 'United States',
        city: 'Stanford',
        state_province: 'California',
        website_url: 'https://www.stanford.edu',
        established_year: 1885,
        university_type: 'private',
        ranking_data: { us_news: 6, qs_world: 5, times_higher_ed: 4 },
        general_info: {
          student_population: 17249,
          acceptance_rate: 0.04,
          student_faculty_ratio: '5:1',
          application_fee: 125,
          international_students: 3500,
          research_expenditure: 1.8
        },
        contact_info: {
          phone: '+1-650-723-2300',
          email: 'admission@stanford.edu',
          address: '450 Serra Mall, Stanford, CA 94305',
          admissions_website: 'https://admission.stanford.edu'
        }
      },
      {
        name: 'Massachusetts Institute of Technology',
        country: 'United States',
        city: 'Cambridge',
        state_province: 'Massachusetts',
        website_url: 'https://www.mit.edu',
        established_year: 1861,
        university_type: 'private',
        ranking_data: { us_news: 2, qs_world: 1, times_higher_ed: 5 },
        general_info: {
          student_population: 11858,
          acceptance_rate: 0.04,
          student_faculty_ratio: '3:1',
          application_fee: 75,
          international_students: 3400,
          research_expenditure: 0.8
        },
        contact_info: {
          phone: '+1-617-253-1000',
          email: 'admissions@mit.edu',
          address: '77 Massachusetts Avenue, Cambridge, MA 02139',
          admissions_website: 'https://mitadmissions.org'
        }
      },
      {
        name: 'University of Oxford',
        country: 'United Kingdom',
        city: 'Oxford',
        state_province: 'England',
        website_url: 'https://www.ox.ac.uk',
        established_year: 1096,
        university_type: 'public',
        ranking_data: { qs_world: 2, times_higher_ed: 1, uk_ranking: 1 },
        general_info: {
          student_population: 24515,
          acceptance_rate: 0.17,
          student_faculty_ratio: '11:1',
          application_fee: 60,
          international_students: 11500,
          research_expenditure: 0.6
        },
        contact_info: {
          phone: '+44-1865-270000',
          email: 'admissions@ox.ac.uk',
          address: 'University Offices, Wellington Square, Oxford OX1 2JD',
          admissions_website: 'https://www.ox.ac.uk/admissions'
        }
      },
      {
        name: 'University of Toronto',
        country: 'Canada',
        city: 'Toronto',
        state_province: 'Ontario',
        website_url: 'https://www.utoronto.ca',
        established_year: 1827,
        university_type: 'public',
        ranking_data: { qs_world: 21, times_higher_ed: 18, canada_ranking: 1 },
        general_info: {
          student_population: 97116,
          acceptance_rate: 0.43,
          student_faculty_ratio: '20:1',
          application_fee: 125,
          international_students: 19000,
          research_expenditure: 1.3
        },
        contact_info: {
          phone: '+1-416-978-2011',
          email: 'admissions@utoronto.ca',
          address: '27 King\'s College Circle, Toronto, ON M5S 1A1',
          admissions_website: 'https://future.utoronto.ca'
        }
      },
      {
        name: 'ETH Zurich',
        country: 'Switzerland',
        city: 'Zurich',
        state_province: 'Zurich',
        website_url: 'https://ethz.ch',
        established_year: 1855,
        university_type: 'public',
        ranking_data: { qs_world: 7, times_higher_ed: 11, europe_ranking: 4 },
        general_info: {
          student_population: 22200,
          acceptance_rate: 0.27,
          student_faculty_ratio: '14:1',
          application_fee: 150,
          international_students: 8900,
          research_expenditure: 1.1
        },
        contact_info: {
          phone: '+41-44-632-11-11',
          email: 'admissions@ethz.ch',
          address: 'Rämistrasse 101, 8092 Zürich, Switzerland',
          admissions_website: 'https://www.ethz.ch/en/studies.html'
        }
      },
      {
        name: 'University of California, Berkeley',
        country: 'United States',
        city: 'Berkeley',
        state_province: 'California',
        website_url: 'https://www.berkeley.edu',
        established_year: 1868,
        university_type: 'public',
        ranking_data: { us_news: 22, qs_world: 10, times_higher_ed: 8 },
        general_info: {
          student_population: 45057,
          acceptance_rate: 0.14,
          student_faculty_ratio: '17:1',
          application_fee: 120,
          international_students: 6500,
          research_expenditure: 0.9
        },
        contact_info: {
          phone: '+1-510-642-6000',
          email: 'admissions@berkeley.edu',
          address: '110 Sproul Hall, Berkeley, CA 94720',
          admissions_website: 'https://admissions.berkeley.edu'
        }
      },
      {
        name: 'University of Cambridge',
        country: 'United Kingdom',
        city: 'Cambridge',
        state_province: 'England',
        website_url: 'https://www.cam.ac.uk',
        established_year: 1209,
        university_type: 'public',
        ranking_data: { qs_world: 3, times_higher_ed: 3, uk_ranking: 2 },
        general_info: {
          student_population: 23247,
          acceptance_rate: 0.21,
          student_faculty_ratio: '11:1',
          application_fee: 60,
          international_students: 9200,
          research_expenditure: 0.7
        },
        contact_info: {
          phone: '+44-1223-337733',
          email: 'admissions@cam.ac.uk',
          address: 'The Old Schools, Trinity Lane, Cambridge CB2 1TN',
          admissions_website: 'https://www.undergraduate.study.cam.ac.uk'
        }
      },
      {
        name: 'Carnegie Mellon University',
        country: 'United States',
        city: 'Pittsburgh',
        state_province: 'Pennsylvania',
        website_url: 'https://www.cmu.edu',
        established_year: 1900,
        university_type: 'private',
        ranking_data: { us_news: 22, qs_world: 52, times_higher_ed: 28 },
        general_info: {
          student_population: 15818,
          acceptance_rate: 0.11,
          student_faculty_ratio: '10:1',
          application_fee: 75,
          international_students: 4200,
          research_expenditure: 0.4
        },
        contact_info: {
          phone: '+1-412-268-2000',
          email: 'admission@andrew.cmu.edu',
          address: '5000 Forbes Avenue, Pittsburgh, PA 15213',
          admissions_website: 'https://admission.cmu.edu'
        }
      },
      {
        name: 'University of Waterloo',
        country: 'Canada',
        city: 'Waterloo',
        state_province: 'Ontario',
        website_url: 'https://uwaterloo.ca',
        established_year: 1957,
        university_type: 'public',
        ranking_data: { qs_world: 112, times_higher_ed: 201, canada_ranking: 3 },
        general_info: {
          student_population: 42000,
          acceptance_rate: 0.53,
          student_faculty_ratio: '25:1',
          application_fee: 120,
          international_students: 8500,
          research_expenditure: 0.3
        },
        contact_info: {
          phone: '+1-519-888-4567',
          email: 'admissions@uwaterloo.ca',
          address: '200 University Avenue West, Waterloo, ON N2L 3G1',
          admissions_website: 'https://uwaterloo.ca/future-students'
        }
      },
      {
        name: 'Technical University of Munich',
        country: 'Germany',
        city: 'Munich',
        state_province: 'Bavaria',
        website_url: 'https://www.tum.de',
        established_year: 1868,
        university_type: 'public',
        ranking_data: { qs_world: 37, times_higher_ed: 30, germany_ranking: 1 },
        general_info: {
          student_population: 48000,
          acceptance_rate: 0.08,
          student_faculty_ratio: '16:1',
          application_fee: 0,
          international_students: 16000,
          research_expenditure: 0.8
        },
        contact_info: {
          phone: '+49-89-289-01',
          email: 'studium@tum.de',
          address: 'Arcisstraße 21, 80333 München, Germany',
          admissions_website: 'https://www.tum.de/en/studies'
        }
      }
    ];

    try {
      // Insert universities (only using columns that exist in the database)
      const filteredUniversities = universities.map(uni => ({
        name: uni.name,
        country: uni.country,
        city: uni.city,
        state_province: uni.state_province,
        website_url: uni.website_url,
        established_year: uni.established_year,
        institution_type: uni.university_type,
        qs_ranking: uni.ranking_data?.qs_world,
        us_news_ranking: uni.ranking_data?.us_news,
        times_ranking: uni.ranking_data?.times_higher_ed,
        acceptance_rate: uni.general_info?.acceptance_rate,
        enrollment_total: uni.general_info?.student_population,
        application_fee: uni.general_info?.application_fee,
        enrollment_international: uni.general_info?.international_students
      }));

      const { data: insertedUniversities, error: universityError } = await supabase
        .from('universities')
        .upsert(filteredUniversities, { onConflict: 'name' })
        .select('id, name');

      if (universityError) {throw universityError;}

      console.log('✅ Universities seeded:', insertedUniversities?.length);

      // Create graduate programs for each university
      const programs = [
        // Stanford Programs
        {
          university_name: 'Stanford University',
          program_name: 'Master of Science in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Computer Science',
          duration_months: 24,
          tuition_fees: { annual_tuition: 58416, currency: 'USD', additional_fees: 3000 },
          requirements: {
            min_gpa: 3.5,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters', 'resume'],
            prerequisites: ['CS fundamentals', 'Mathematics', 'Programming experience']
          },
          deadlines: {
            fall_deadline: '2025-12-01',
            spring_deadline: null,
            scholarship_deadline: '2025-11-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 45000,
            fellowship_opportunities: ['NSF', 'Stanford Graduate Fellowship', 'Knight-Hennessy Scholars'],
            work_study_available: true
          },
          research_areas: ['Artificial Intelligence', 'Machine Learning', 'Computer Systems', 'Theory', 'Human-Computer Interaction', 'Security'],
          faculty_count: 65,
          student_count: 350,
          admission_rate: 0.06,
          description: 'World-class CS program with cutting-edge research opportunities in AI, systems, and theory',
          career_outcomes: {
            employment_rate: 0.98,
            median_salary: 165000,
            top_employers: ['Google', 'Apple', 'Meta', 'Tesla', 'OpenAI']
          }
        },
        {
          university_name: 'Stanford University',
          program_name: 'PhD in Computer Science',
          degree_type: 'phd',
          field_of_study: 'Computer Science',
          department: 'Computer Science',
          duration_months: 72,
          tuition_fees: { annual_tuition: 58416, currency: 'USD', covered_by_funding: true },
          requirements: {
            min_gpa: 3.7,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters', 'research_proposal'],
            prerequisites: ['Strong CS background', 'Research experience preferred']
          },
          deadlines: {
            fall_deadline: '2025-12-01'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 50000,
            fellowship_opportunities: ['Stanford Graduate Fellowship', 'NSF GRFP', 'Google PhD Fellowship'],
            guaranteed_funding: true
          },
          research_areas: ['Artificial Intelligence', 'Machine Learning', 'Computer Systems', 'Algorithms', 'Robotics', 'Computer Vision'],
          faculty_count: 65,
          student_count: 200,
          admission_rate: 0.03,
          description: 'Premier PhD program producing leaders in computer science research and industry',
          career_outcomes: {
            completion_rate: 0.92,
            time_to_degree: 5.5,
            placement_rate: 0.96
          }
        },
        {
          university_name: 'Stanford University',
          program_name: 'MS in Data Science',
          degree_type: 'masters',
          field_of_study: 'Data Science',
          department: 'Statistics',
          duration_months: 18,
          tuition_fees: { annual_tuition: 58416, currency: 'USD' },
          requirements: {
            min_gpa: 3.3,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters', 'resume'],
            prerequisites: ['Statistics', 'Programming', 'Linear Algebra']
          },
          deadlines: {
            fall_deadline: '2025-12-01'
          },
          funding_info: {
            assistantships_available: false,
            average_funding: 0,
            fellowship_opportunities: ['External fellowships considered'],
            work_study_available: true
          },
          research_areas: ['Machine Learning', 'Statistical Modeling', 'Data Mining', 'Computational Statistics'],
          faculty_count: 35,
          student_count: 120,
          admission_rate: 0.15,
          description: 'Intensive program combining statistics, computer science, and domain expertise',
          career_outcomes: {
            employment_rate: 0.95,
            median_salary: 140000,
            top_employers: ['Netflix', 'Uber', 'Airbnb', 'Meta', 'Google']
          }
        },
        // MIT Programs
        {
          university_name: 'Massachusetts Institute of Technology',
          program_name: 'Master of Engineering in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Electrical Engineering and Computer Science',
          duration_months: 12,
          tuition_fees: { annual_tuition: 57986, currency: 'USD', additional_fees: 3500 },
          requirements: {
            min_gpa: 3.7,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters'],
            prerequisites: ['EECS undergraduate degree or equivalent']
          },
          deadlines: {
            fall_deadline: '2025-12-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 48000,
            fellowship_opportunities: ['MIT Presidential Fellowship', 'NSF GRFP']
          },
          research_areas: ['Artificial Intelligence', 'Robotics', 'Computer Systems', 'Theory', 'Computer Graphics', 'Computational Biology'],
          faculty_count: 70,
          student_count: 180,
          admission_rate: 0.04,
          description: 'Intensive one-year program for industry-ready engineers with hands-on project experience',
          career_outcomes: {
            employment_rate: 0.99,
            median_salary: 170000,
            top_employers: ['Apple', 'Google', 'Microsoft', 'Tesla', 'Amazon']
          }
        },
        {
          university_name: 'Massachusetts Institute of Technology',
          program_name: 'PhD in Computer Science',
          degree_type: 'phd',
          field_of_study: 'Computer Science',
          department: 'Electrical Engineering and Computer Science',
          duration_months: 72,
          tuition_fees: { annual_tuition: 57986, currency: 'USD', covered_by_funding: true },
          requirements: {
            min_gpa: 3.8,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters', 'research_statement'],
            prerequisites: ['Strong technical background', 'Research experience highly preferred']
          },
          deadlines: {
            fall_deadline: '2025-12-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 55000,
            fellowship_opportunities: ['MIT Presidential Fellowship', 'NSF GRFP', 'Hertz Fellowship'],
            guaranteed_funding: true
          },
          research_areas: ['Artificial Intelligence', 'Machine Learning', 'Robotics', 'Computer Systems', 'Theory of Computation', 'Computer Graphics'],
          faculty_count: 70,
          student_count: 350,
          admission_rate: 0.02,
          description: 'World-renowned PhD program at the forefront of computer science research',
          career_outcomes: {
            completion_rate: 0.94,
            time_to_degree: 5.8,
            placement_rate: 0.98
          }
        },
        // Oxford Programs
        {
          university_name: 'University of Oxford',
          program_name: 'MSc in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Department of Computer Science',
          duration_months: 12,
          tuition_fees: { annual_tuition: 29700, currency: 'GBP', additional_fees: 1500 },
          requirements: {
            min_gpa: 3.7,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.5,
            required_documents: ['transcripts', 'personal_statement', 'recommendation_letters'],
            prerequisites: ['First-class or strong upper second-class undergraduate degree']
          },
          deadlines: {
            fall_deadline: '2025-01-20',
            scholarship_deadline: '2025-01-20'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 25000,
            fellowship_opportunities: ['Rhodes Scholarship', 'Clarendon Fund', 'Oxford-Google DeepMind Scholarship']
          },
          research_areas: ['Machine Learning', 'Quantum Computing', 'Cybersecurity', 'Computational Biology', 'Computer Vision'],
          faculty_count: 50,
          student_count: 120,
          admission_rate: 0.15,
          description: 'Prestigious one-year masters with world-class research in cutting-edge areas',
          career_outcomes: {
            employment_rate: 0.93,
            median_salary: 85000,
            top_employers: ['DeepMind', 'Google', 'Microsoft', 'Bloomberg', 'JP Morgan']
          }
        },
        {
          university_name: 'University of Oxford',
          program_name: 'DPhil in Computer Science',
          degree_type: 'phd',
          field_of_study: 'Computer Science',
          department: 'Department of Computer Science',
          duration_months: 48,
          tuition_fees: { annual_tuition: 29700, currency: 'GBP', covered_by_funding: true },
          requirements: {
            min_gpa: 3.8,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.5,
            required_documents: ['transcripts', 'research_proposal', 'recommendation_letters'],
            prerequisites: ['Strong academic background', 'Research experience preferred']
          },
          deadlines: {
            fall_deadline: '2025-01-20'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 30000,
            fellowship_opportunities: ['EPSRC Studentship', 'Clarendon Fund', 'Industry Partnerships'],
            guaranteed_funding: false
          },
          research_areas: ['Machine Learning', 'Quantum Computing', 'Computational Biology', 'Formal Methods', 'Computer Security'],
          faculty_count: 50,
          student_count: 200,
          admission_rate: 0.08,
          description: 'Research-intensive DPhil program with access to world-leading faculty',
          career_outcomes: {
            completion_rate: 0.88,
            time_to_degree: 4.2,
            placement_rate: 0.95
          }
        },
        // University of Toronto Programs
        {
          university_name: 'University of Toronto',
          program_name: 'Master of Applied Science in Computer Engineering',
          degree_type: 'masters',
          field_of_study: 'Computer Engineering',
          department: 'Electrical and Computer Engineering',
          duration_months: 24,
          tuition_fees: { annual_tuition: 25000, currency: 'CAD', additional_fees: 2000 },
          requirements: {
            min_gpa: 3.3,
            gre_required: false,
            toefl_min: 93,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters'],
            prerequisites: ['Engineering degree in relevant field']
          },
          deadlines: {
            fall_deadline: '2025-12-15',
            winter_deadline: '2025-08-15',
            funding_deadline: '2025-11-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 30000,
            fellowship_opportunities: ['NSERC', 'Ontario Graduate Scholarship', 'Vector Institute Scholarship']
          },
          research_areas: ['Artificial Intelligence', 'Computer Vision', 'Embedded Systems', 'Computer Networks', 'Machine Learning'],
          faculty_count: 40,
          student_count: 250,
          admission_rate: 0.35,
          description: 'Research-focused program with strong industry connections and cutting-edge facilities',
          career_outcomes: {
            employment_rate: 0.95,
            median_salary: 85000,
            top_employers: ['Google', 'Microsoft', 'Shopify', 'Nvidia', 'BlackBerry']
          }
        },
        {
          university_name: 'University of Toronto',
          program_name: 'Master of Science in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Computer Science',
          duration_months: 24,
          tuition_fees: { annual_tuition: 25000, currency: 'CAD' },
          requirements: {
            min_gpa: 3.3,
            gre_required: false,
            toefl_min: 93,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters'],
            prerequisites: ['Computer Science degree or equivalent']
          },
          deadlines: {
            fall_deadline: '2025-12-15',
            winter_deadline: '2025-08-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 28000,
            fellowship_opportunities: ['NSERC', 'Vector Institute', 'Connaught Scholarship']
          },
          research_areas: ['Machine Learning', 'Natural Language Processing', 'Computer Graphics', 'Database Systems', 'Software Engineering'],
          faculty_count: 55,
          student_count: 180,
          admission_rate: 0.25,
          description: 'Comprehensive CS program with strong research focus and industry partnerships',
          career_outcomes: {
            employment_rate: 0.96,
            median_salary: 90000,
            top_employers: ['Google', 'Microsoft', 'Amazon', 'Facebook', 'Apple']
          }
        },
        // ETH Zurich Programs
        {
          university_name: 'ETH Zurich',
          program_name: 'Master in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Department of Computer Science',
          duration_months: 24,
          tuition_fees: { annual_tuition: 1460, currency: 'CHF', additional_fees: 500 },
          requirements: {
            min_gpa: 3.5,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'motivation_letter', 'recommendation_letters'],
            prerequisites: ['Bachelor in Computer Science or related field']
          },
          deadlines: {
            fall_deadline: '2025-12-15',
            scholarship_deadline: '2025-11-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 35000,
            fellowship_opportunities: ['Excellence Scholarship', 'ESOP Scholarship', 'ETH Foundation Scholarship']
          },
          research_areas: ['Machine Learning', 'Computer Graphics', 'Computer Systems', 'Algorithms', 'Robotics', 'Computer Vision'],
          faculty_count: 35,
          student_count: 180,
          admission_rate: 0.25,
          description: 'Top European CS program with excellent research facilities and industry connections',
          career_outcomes: {
            employment_rate: 0.97,
            median_salary: 95000,
            top_employers: ['Google', 'Microsoft', 'Credit Suisse', 'Disney Research', 'ABB']
          }
        },
        {
          university_name: 'ETH Zurich',
          program_name: 'PhD in Computer Science',
          degree_type: 'phd',
          field_of_study: 'Computer Science',
          department: 'Department of Computer Science',
          duration_months: 48,
          tuition_fees: { annual_tuition: 1460, currency: 'CHF', covered_by_funding: true },
          requirements: {
            min_gpa: 3.7,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'research_proposal', 'recommendation_letters'],
            prerequisites: ['Master\'s degree in CS or related field', 'Strong research potential']
          },
          deadlines: {
            fall_deadline: '2025-12-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 45000,
            fellowship_opportunities: ['ETH Zurich Doctoral Fellowship', 'SNF Doctoral Fellowship'],
            guaranteed_funding: true
          },
          research_areas: ['Machine Learning', 'Computer Graphics', 'Robotics', 'Computer Vision', 'Systems', 'Algorithms'],
          faculty_count: 35,
          student_count: 150,
          admission_rate: 0.12,
          description: 'World-class PhD program with cutting-edge research and excellent supervision',
          career_outcomes: {
            completion_rate: 0.91,
            time_to_degree: 4.8,
            placement_rate: 0.94
          }
        },
        // Additional universities and programs
        {
          university_name: 'University of California, Berkeley',
          program_name: 'Master of Science in Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Electrical Engineering and Computer Sciences',
          duration_months: 24,
          tuition_fees: { annual_tuition: 29000, currency: 'USD', additional_fees: 4000 },
          requirements: {
            min_gpa: 3.0,
            gre_required: true,
            toefl_min: 90,
            ielts_min: 7.0,
            required_documents: ['transcripts', 'sop', 'recommendation_letters'],
            prerequisites: ['CS or related undergraduate degree']
          },
          deadlines: {
            fall_deadline: '2025-12-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 35000,
            fellowship_opportunities: ['Berkeley Fellowship', 'NSF GRFP', 'Chancellor\'s Fellowship']
          },
          research_areas: ['Artificial Intelligence', 'Machine Learning', 'Computer Systems', 'Theory', 'Graphics'],
          faculty_count: 60,
          student_count: 200,
          admission_rate: 0.08,
          description: 'Top-tier public university CS program with world-renowned faculty',
          career_outcomes: {
            employment_rate: 0.96,
            median_salary: 150000,
            top_employers: ['Google', 'Apple', 'Meta', 'Tesla', 'Uber']
          }
        },
        {
          university_name: 'University of Cambridge',
          program_name: 'MPhil in Advanced Computer Science',
          degree_type: 'masters',
          field_of_study: 'Computer Science',
          department: 'Computer Laboratory',
          duration_months: 12,
          tuition_fees: { annual_tuition: 32000, currency: 'GBP' },
          requirements: {
            min_gpa: 3.7,
            gre_required: false,
            toefl_min: 100,
            ielts_min: 7.5,
            required_documents: ['transcripts', 'personal_statement', 'recommendation_letters'],
            prerequisites: ['First-class undergraduate degree in CS or related field']
          },
          deadlines: {
            fall_deadline: '2025-01-15'
          },
          funding_info: {
            assistantships_available: true,
            average_funding: 28000,
            fellowship_opportunities: ['Gates Cambridge Scholarship', 'Cambridge Trust', 'DeepMind Scholarship']
          },
          research_areas: ['Machine Learning', 'Computer Vision', 'Natural Language Processing', 'Quantum Computing'],
          faculty_count: 45,
          student_count: 80,
          admission_rate: 0.12,
          description: 'Elite one-year research degree preparing students for PhD or industry research',
          career_outcomes: {
            employment_rate: 0.95,
            median_salary: 80000,
            top_employers: ['DeepMind', 'Google', 'Microsoft Research', 'ARM', 'Imagination Technologies']
          }
        }
      ];

      // Get university IDs and create programs
      console.log(`🔄 Processing ${programs.length} programs for seeding...`);
      
      for (const program of programs) {
        console.log(`🔍 Looking for university: "${program.university_name}"`);
        
        const { data: university, error: universityError } = await supabase
          .from('universities')
          .select('id, name')
          .eq('name', program.university_name)
          .single();

        if (universityError) {
          console.warn(`⚠️ University lookup error for "${program.university_name}":`, universityError);
          
          // Try fuzzy matching if exact match fails
          const { data: universities } = await supabase
            .from('universities')
            .select('id, name')
            .ilike('name', `%${program.university_name}%`);
            
          if (universities && universities.length > 0) {
            console.log(`🔄 Found ${universities.length} similar universities:`, universities.map(u => u.name));
            // Use the first match
            const matchedUni = universities[0];
            const { university_name, ...programData } = program;
            
            console.log(`📚 Creating program "${program.name}" for ${matchedUni.name}`);
            const { error: insertError } = await supabase
              .from('university_programs')
              .upsert({ 
                ...programData, 
                university_id: matchedUni.id,
                name: program.name || program.program_name
              }, { onConflict: 'university_id,name' });
              
            if (insertError) {
              console.error(`❌ Failed to create program:`, insertError);
            } else {
              console.log(`✅ Program "${program.name}" created successfully`);
            }
          } else {
            console.warn(`❌ No universities found matching "${program.university_name}"`);
          }
        } else if (university) {
          console.log(`✅ Found university: ${university.name} (ID: ${university.id})`);
          
          const { university_name, ...programData } = program;
          console.log(`📚 Creating program "${program.name}" for ${university.name}`);
          
          const { error: insertError } = await supabase
            .from('university_programs')
            .upsert({ 
              ...programData, 
              university_id: university.id,
              name: program.name || program.program_name
            }, { onConflict: 'university_id,name' });
            
          if (insertError) {
            console.error(`❌ Failed to create program:`, insertError);
          } else {
            console.log(`✅ Program "${program.name}" created successfully`);
          }
        } else {
          console.warn(`❌ University "${program.university_name}" not found in database`);
        }
      }

      console.log('✅ Graduate programs seeded');
      
      // Seed faculty data for each university
      await this.seedFacultyData();
      
    } catch (error) {
      console.error('❌ Error seeding university data:', error);
      throw error;
    }
  }

  /**
   * Seed real faculty/professor data for universities
   */
  private async seedFacultyData(): Promise<void> {
    console.log('🌱 Seeding real faculty data...');

    const facultyData = [
      // Stanford University Faculty
      {
        university_name: 'Stanford University',
        name: 'Dr. Fei-Fei Li',
        title: 'Professor',
        department: 'Computer Science',
        email: 'feifeili@cs.stanford.edu',
        profile_url: 'https://cs.stanford.edu/people/feifeili',
        research_areas: ['Computer Vision', 'Machine Learning', 'AI for Healthcare'],
        bio: 'Professor of Computer Science and Co-Director of the Stanford Human-Centered AI Institute. Pioneer in computer vision and AI.',
        education: ['PhD Computer Science, Caltech', 'MS Electrical Engineering, Caltech'],
        notable_work: 'ImageNet, AI4ALL founder, Former Chief Scientist at Google Cloud',
        current_projects: ['AI for Healthcare', 'Human-Centered AI', 'Computer Vision'],
        accepting_students: true
      },
      {
        university_name: 'Stanford University',
        name: 'Dr. Andrew Ng',
        title: 'Adjunct Professor',
        department: 'Computer Science',
        email: 'ang@cs.stanford.edu',
        profile_url: 'https://cs.stanford.edu/people/ang',
        research_areas: ['Machine Learning', 'Deep Learning', 'AI Education'],
        bio: 'Adjunct Professor and Co-founder of Coursera, Founder of deeplearning.ai and Landing AI.',
        education: ['PhD Computer Science, UC Berkeley', 'MS MIT'],
        notable_work: 'Coursera co-founder, Former Director of Stanford AI Lab, Former Chief Scientist at Baidu',
        current_projects: ['AI Transformation', 'Machine Learning Education', 'Manufacturing AI'],
        accepting_students: false
      },
      {
        university_name: 'Stanford University',
        name: 'Dr. Christopher Manning',
        title: 'Professor',
        department: 'Computer Science',
        email: 'manning@cs.stanford.edu',
        profile_url: 'https://nlp.stanford.edu/manning',
        research_areas: ['Natural Language Processing', 'Deep Learning', 'Computational Linguistics'],
        bio: 'Professor of Computer Science and Linguistics, Director of the Stanford Artificial Intelligence Laboratory.',
        education: ['PhD Linguistics, Stanford University', 'BA Linguistics and Computer Science, Australian National University'],
        notable_work: 'Stanford CoreNLP, GloVe word vectors, Stanford Dependencies',
        current_projects: ['Large Language Models', 'Question Answering', 'Multilingual NLP'],
        accepting_students: true
      },
      // MIT Faculty
      {
        university_name: 'Massachusetts Institute of Technology',
        name: 'Dr. Regina Barzilay',
        title: 'Professor',
        department: 'Electrical Engineering and Computer Science',
        email: 'regina@csail.mit.edu',
        profile_url: 'https://people.csail.mit.edu/regina',
        research_areas: ['Natural Language Processing', 'Machine Learning', 'Computational Biology'],
        bio: 'MacArthur Fellow and Professor focusing on applications of NLP to science and medicine.',
        education: ['PhD Computer Science, Columbia University'],
        notable_work: 'Drug discovery using ML, Clinical NLP, MacArthur Fellowship 2017',
        current_projects: ['AI for Drug Discovery', 'Clinical Text Analysis', 'Scientific Literature Mining'],
        accepting_students: true
      },
      {
        university_name: 'Massachusetts Institute of Technology',
        name: 'Dr. Daniela Rus',
        title: 'Professor',
        department: 'Electrical Engineering and Computer Science',
        email: 'rus@csail.mit.edu',
        profile_url: 'https://people.csail.mit.edu/rus',
        research_areas: ['Robotics', 'Artificial Intelligence', 'Data Science'],
        bio: 'Andrew (1956) and Erna Viterbi Professor, Director of MIT CSAIL.',
        education: ['PhD Computer Science, Cornell University'],
        notable_work: 'Distributed robotics, Self-organizing systems, Programmable matter',
        current_projects: ['Autonomous Systems', 'Distributed Robotics', 'Human-Robot Interaction'],
        accepting_students: true
      },
      // Oxford Faculty
      {
        university_name: 'University of Oxford',
        name: 'Prof. Michael Wooldridge',
        title: 'Professor',
        department: 'Computer Science',
        email: 'michael.wooldridge@cs.ox.ac.uk',
        profile_url: 'https://www.cs.ox.ac.uk/people/michael.wooldridge',
        research_areas: ['Multi-Agent Systems', 'Artificial Intelligence', 'Game Theory'],
        bio: 'Professor of Computer Science and Head of Department, leading expert in multi-agent systems.',
        education: ['PhD Computer Science, Manchester Metropolitan University'],
        notable_work: 'Multi-agent systems, Computational social choice, AI textbooks',
        current_projects: ['Strategic AI', 'Multi-Agent Reinforcement Learning', 'AI Safety'],
        accepting_students: true
      },
      {
        university_name: 'University of Oxford',
        name: 'Prof. Yarin Gal',
        title: 'Professor',
        department: 'Computer Science',
        email: 'yarin.gal@cs.ox.ac.uk',
        profile_url: 'https://www.cs.ox.ac.uk/people/yarin.gal',
        research_areas: ['Bayesian Deep Learning', 'Uncertainty Quantification', 'Computer Vision'],
        bio: 'Professor of Machine Learning, Royal Society University Research Fellow.',
        education: ['PhD Machine Learning, University of Cambridge'],
        notable_work: 'Bayesian deep learning, Dropout as Bayesian approximation, Uncertainty in deep learning',
        current_projects: ['Safe AI', 'Bayesian Deep Learning', 'Active Learning'],
        accepting_students: true
      },
      // University of Toronto Faculty
      {
        university_name: 'University of Toronto',
        name: 'Prof. Geoffrey Hinton',
        title: 'Professor Emeritus',
        department: 'Computer Science',
        email: 'hinton@cs.toronto.edu',
        profile_url: 'https://www.cs.toronto.edu/~hinton',
        research_areas: ['Deep Learning', 'Neural Networks', 'Machine Learning'],
        bio: 'Turing Award winner, "Godfather of Deep Learning", University Professor Emeritus.',
        education: ['PhD Artificial Intelligence, University of Edinburgh'],
        notable_work: 'Backpropagation algorithm, Deep belief networks, Capsule networks',
        current_projects: ['Forward-Forward Algorithm', 'Mortal Computation', 'AI Safety'],
        accepting_students: false
      },
      {
        university_name: 'University of Toronto',
        name: 'Prof. Raquel Urtasun',
        title: 'Professor',
        department: 'Computer Science',
        email: 'urtasun@cs.toronto.edu',
        profile_url: 'https://www.cs.toronto.edu/~urtasun',
        research_areas: ['Computer Vision', 'Machine Learning', 'Autonomous Driving'],
        bio: 'Professor and Founder/CEO of Waabi, leading expert in autonomous driving AI.',
        education: ['PhD Computer Vision, École Polytechnique Fédérale de Lausanne'],
        notable_work: 'Autonomous driving, 3D scene understanding, Waabi founder',
        current_projects: ['Autonomous Vehicle AI', 'Self-Driving Simulation', 'Scene Understanding'],
        accepting_students: true
      },
      // ETH Zurich Faculty
      {
        university_name: 'ETH Zurich',
        name: 'Prof. Otmar Hilliges',
        title: 'Professor',
        department: 'Computer Science',
        email: 'otmar.hilliges@inf.ethz.ch',
        profile_url: 'https://ait.ethz.ch/people/hilliges',
        research_areas: ['Human-Computer Interaction', 'Computer Vision', 'Machine Learning'],
        bio: 'Professor heading the Advanced Interactive Technologies lab, expert in HCI and AI.',
        education: ['PhD Computer Science, TU Darmstadt'],
        notable_work: 'Interactive machine learning, Computational design, Human motion analysis',
        current_projects: ['Interactive AI Systems', 'Computational Fabrication', 'Augmented Reality'],
        accepting_students: true
      },
      {
        university_name: 'ETH Zurich',
        name: 'Prof. Thomas Hofmann',
        title: 'Professor',
        department: 'Computer Science',
        email: 'thomas.hofmann@inf.ethz.ch',
        profile_url: 'https://da.inf.ethz.ch/people/ThomasHofmann',
        research_areas: ['Machine Learning', 'Data Science', 'Information Retrieval'],
        bio: 'Professor of Data Analytics, Director of the ETH AI Center.',
        education: ['PhD Computer Science, University of Bonn'],
        notable_work: 'Probabilistic latent semantic analysis, Topic models, Kernel methods',
        current_projects: ['Large Language Models', 'Federated Learning', 'AI for Science'],
        accepting_students: true
      },
      // UC Berkeley Faculty
      {
        university_name: 'University of California, Berkeley',
        name: 'Prof. Pieter Abbeel',
        title: 'Professor',
        department: 'Electrical Engineering and Computer Sciences',
        email: 'pabbeel@berkeley.edu',
        profile_url: 'https://people.eecs.berkeley.edu/~pabbeel',
        research_areas: ['Robotics', 'Machine Learning', 'AI'],
        bio: 'Professor and Co-founder of Covariant, leading expert in robot learning.',
        education: ['PhD Computer Science, Stanford University'],
        notable_work: 'Robot learning, Imitation learning, Covariant co-founder',
        current_projects: ['Robot Learning', 'Foundation Models for Robotics', 'Industrial AI'],
        accepting_students: true
      },
      {
        university_name: 'University of California, Berkeley',
        name: 'Prof. Dawn Song',
        title: 'Professor',
        department: 'Electrical Engineering and Computer Sciences',
        email: 'dawnsong@berkeley.edu',
        profile_url: 'https://people.eecs.berkeley.edu/~dawnsong',
        research_areas: ['Computer Security', 'Machine Learning', 'Blockchain'],
        bio: 'Professor focusing on AI security, privacy, and blockchain technologies.',
        education: ['PhD Computer Science, UC Berkeley'],
        notable_work: 'AI security, Privacy-preserving machine learning, Blockchain research',
        current_projects: ['AI Safety', 'Differential Privacy', 'Decentralized AI'],
        accepting_students: true
      },
      // Cambridge Faculty
      {
        university_name: 'University of Cambridge',
        name: 'Prof. Zoubin Ghahramani',
        title: 'Professor',
        department: 'Engineering',
        email: 'zoubin@eng.cam.ac.uk',
        profile_url: 'http://mlg.eng.cam.ac.uk/zoubin',
        research_areas: ['Machine Learning', 'Bayesian Methods', 'AI'],
        bio: 'Professor and VP of Research at Google DeepMind, expert in probabilistic machine learning.',
        education: ['PhD Cognitive Science, MIT'],
        notable_work: 'Variational inference, Gaussian processes, Bayesian optimization',
        current_projects: ['Probabilistic ML', 'AutoML', 'AI for Science'],
        accepting_students: true
      }
    ];

    try {
      // Insert faculty data
      for (const faculty of facultyData) {
        const { data: university } = await supabase
          .from('universities')
          .select('id')
          .eq('name', faculty.university_name)
          .single();

        if (university) {
          const { university_name, ...facultyInfo } = faculty;
          await supabase
            .from('faculty_profiles')
            .upsert({ 
              ...facultyInfo, 
              university_id: university.id,
              university_name: faculty.university_name 
            }, { onConflict: 'university_id,email' });
        }
      }

      console.log('✅ Faculty data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding faculty data:', error);
      // Don't throw error - faculty seeding is optional
    }
  }

  /**
   * Generate comprehensive university matches with faculty recommendations using ALL user data
   */
  async generateMatches(userId: string, matchRequest: MatchRequest): Promise<{ matches: UniversityMatch[], facultyRecommendations: any[], sessionId?: string }> {
    try {
      console.log('🎯 Generating comprehensive AI-powered university matches for user:', userId);
      console.log('Using CV analysis data:', Boolean(matchRequest.cvAnalysis));

      // Create AI matching session
      const sessionId = await this.createMatchingSession(userId, matchRequest, matchRequest.cvAnalysis?.id);

      // Get ALL user data from database for comprehensive matching including CV analysis
      const comprehensiveUserData = await this.gatherAllUserData(userId);
      console.log('📊 Comprehensive user data gathered:', Object.keys(comprehensiveUserData));

      // Get latest CV analysis using the fixed CV analysis system
      let cvAnalysisData = matchRequest.cvAnalysis;
      if (!cvAnalysisData) {
        try {
          const { cvAnalysisService } = await import('./cvAnalysisService');
          const latestAnalysis = await cvAnalysisService.getStoredAnalysis(userId);
          if (latestAnalysis) {
            cvAnalysisData = latestAnalysis;
            console.log('✅ Retrieved latest CV analysis from database');
          }
        } catch (error) {
          console.warn('Could not retrieve CV analysis:', error);
        }
      }

      // Get available universities with their programs (using correct column names)
      let { data: universities, error: uniError } = await supabase
        .from('universities')
        .select(`
          *,
          university_programs (*)
        `);

      if (uniError) {throw uniError;}

      if (!universities || universities.length === 0) {
        console.warn('⚠️ No universities found in database');
        
        // Try to seed universities first
        console.log('🌱 Attempting to seed university data...');
        try {
          await this.seedUniversityData();
          
          // Retry fetching universities after seeding
          const { data: seededUniversities, error: retryError } = await supabase
            .from('universities')
            .select(`
              *,
              university_programs (*)
            `);
          
          if (!retryError && seededUniversities && seededUniversities.length > 0) {
            console.log(`✅ Successfully seeded ${seededUniversities.length} universities`);
            universities = seededUniversities;
          } else {
            console.warn('❌ Failed to seed or fetch universities after retry');
            return { matches: [], facultyRecommendations: [] };
          }
        } catch (seedError) {
          console.error('❌ Error seeding universities:', seedError);
          return { matches: [], facultyRecommendations: [] };
        }
      }

      // Enhanced user profile using ALL available data (CV, onboarding, academic profiles, research interests)
      const enhancedProfile = this.enhanceUserProfileWithAllData(matchRequest.userProfile, matchRequest.cvAnalysis, comprehensiveUserData);

      // Filter universities based on user preferences and CV insights
      let filteredUniversities = universities;

      if (enhancedProfile.preferences.countries?.length) {
        filteredUniversities = filteredUniversities.filter(uni =>
          enhancedProfile.preferences.countries!.includes(uni.country)
        );
      }

      if (enhancedProfile.preferences.universityTypes?.length) {
        filteredUniversities = filteredUniversities.filter(uni =>
          enhancedProfile.preferences.universityTypes!.includes(uni.university_type)
        );
      }

      // Use AI for intelligent matching
      console.log('🤖 Using AI to generate intelligent university matches...');
      
      try {
        // Format universities for AI analysis using correct column names
        const universitiesForAI = filteredUniversities.slice(0, 15).map(uni => ({
          name: uni.name,
          country: uni.country,
          programs: uni.university_programs?.map(p => ({
            name: p.name, // Changed from p.program_name
            field: p.department || 'General', // Using p.department since field_of_study doesn't exist
            degree_type: p.degree_type,
            research_areas: p.research_areas || [],
            admission_rate: uni.acceptance_rate || 0.5, // Using university's acceptance rate
            min_gpa: p.min_gpa,
            tuition: p.tuition_annual
          })) || []
        }));

        // Use ChatGPT for fast matching (8 second max)
        console.log('🚀 Calling ChatGPT API for fast matching...');
        const chatGptMatches = await Promise.race([
          ChatGPTService.getUniversityMatches({
            gpa: enhancedProfile.gpa || 3.5,
            targetDegree: enhancedProfile.targetDegree || 'Computer Science',
            researchInterests: enhancedProfile.researchInterests?.slice(0, 3) || []
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('ChatGPT timeout - 30 seconds exceeded')), 30000) // 30 second timeout
          )
        ]);
        console.log('✅ ChatGPT returned matches in time:', chatGptMatches?.length || 0);
      
      if (chatGptMatches && chatGptMatches.length > 0) {
        console.log('ChatGPT matches:', chatGptMatches.map(m => `${m.university} - ${m.program}`));
      }

        // Convert ChatGPT response to expected format
        const aiMatchResult = {
          matches: chatGptMatches.map(match => ({
            university: match.university,
            program: match.program,
            matchScore: match.score || 75,
            category: match.category as 'reach' | 'target' | 'safety',
            reasoning: match.reason || 'Good match based on profile'
          }))
        };

        console.log('✅ AI generated', aiMatchResult?.matches?.length || 0, 'matches in record time');

        // Convert AI matches to database format
        const matchesToInsert = [];
        const facultyRecommendations = [];

        for (const aiMatch of aiMatchResult.matches || []) {
          console.log(`🔍 Processing AI match: ${aiMatch.university} - ${aiMatch.program}`);
          
          // Find the actual university with improved matching
          let university = filteredUniversities.find(u => 
            u.name.toLowerCase().includes(aiMatch.university.toLowerCase()) ||
            aiMatch.university.toLowerCase().includes(u.name.toLowerCase())
          );

          // If exact match fails, try partial matching for common university abbreviations
          if (!university) {
            const searchTerm = aiMatch.university.toLowerCase();
            university = filteredUniversities.find(u => {
              const uniName = u.name.toLowerCase();
              // Handle common abbreviations
              if (searchTerm === 'ucsd' && uniName.includes('university of california') && uniName.includes('san diego')) {return true;}
              if (searchTerm === 'ucla' && uniName.includes('university of california') && uniName.includes('los angeles')) {return true;}
              if (searchTerm === 'berkeley' && uniName.includes('university of california') && uniName.includes('berkeley')) {return true;}
              if (searchTerm === 'stanford' && uniName.includes('stanford')) {return true;}
              if (searchTerm === 'mit' && (uniName.includes('massachusetts institute') || uniName.includes('m.i.t'))) {return true;}
              if (searchTerm === 'caltech' && uniName.includes('california institute of technology')) {return true;}
              
              // Try word-by-word matching
              const searchWords = searchTerm.split(' ');
              const uniWords = uniName.split(' ');
              return searchWords.every(word => uniWords.some(uniWord => uniWord.includes(word) || word.includes(uniWord)));
            });
          }

          if (!university) {
            console.warn(`❌ University not found in database: ${aiMatch.university}`);
            console.log('Available universities:', filteredUniversities.map(u => u.name).slice(0, 5));
            // Skip if no universities available to use as placeholder
            if (!filteredUniversities || filteredUniversities.length === 0) {
              console.warn(`❌ No universities available to create placeholder match for ${aiMatch.university}`);
              continue;
            }
            
            // Create a generic match anyway to show the ChatGPT recommendation
            const genericMatch = {
              matching_session_id: sessionId,
              user_id: userId,
              university_id: filteredUniversities[0].id, // Use first available university as placeholder
              program_id: null,
              overall_match_score: aiMatch.matchScore || 75,
              match_category: aiMatch.category as 'reach' | 'target' | 'safety',
              confidence_level: (aiMatch.matchScore || 75) / 100,
              academic_fit_score: 0.7,
              program_fit_score: null,
              research_fit_score: 0.6,
              financial_fit_score: 0.7,
              location_fit_score: 0.7,
              cultural_fit_score: 0.7,
              career_outcome_score: null,
              admission_probability: 0.7,
              reasoning: `ChatGPT recommended ${aiMatch.university} for ${aiMatch.program}. ${aiMatch.reasoning || 'University not found in our database but included based on AI recommendation.'}`
            };
            matchesToInsert.push(genericMatch);
            console.log(`✅ Created generic AI match: ${aiMatch.university} (${aiMatch.matchScore || 75}% match)`);
            continue;
          }
          
          console.log(`✅ Found university: ${university.name} with ${university.university_programs?.length || 0} programs`);

          // More flexible program matching - try to find any program if specific match fails
          let program = university.university_programs?.find(p => 
            p.name.toLowerCase().includes(aiMatch.program.toLowerCase()) ||
            aiMatch.program.toLowerCase().includes(p.name.toLowerCase()) ||
            (p.department && p.department.toLowerCase().includes(enhancedProfile.targetDegree.toLowerCase()))
          );
          
          // If no specific match, try broader matching
          if (!program && university.university_programs?.length > 0) {
            program = university.university_programs.find(p => 
              p.name.toLowerCase().includes('master') ||
              p.name.toLowerCase().includes('science') ||
              p.department?.toLowerCase().includes('computer') ||
              p.department?.toLowerCase().includes('engineering')
            );
          }
          
          // As last resort, use the first available program
          if (!program && university.university_programs?.length > 0) {
            program = university.university_programs[0];
            console.log(`🔄 Using fallback program: ${program.name} at ${university.name}`);
          }

          // Handle case where no specific program is found - create university match without program
          if (!program) {
            console.warn(`❌ No suitable program found at ${university.name} for "${aiMatch.program}"`);
            console.log('Available programs:', university.university_programs?.map(p => p.name) || ['None']);
            console.log(`📚 Creating university match without specific program for ${university.name}`);
            
            // Calculate score based on university only (without program-specific factors)
            const universityOnlyScore = this.calculateUniversityOnlyMatchScore(university, enhancedProfile);
            const aiScoreNormalized = Math.min(aiMatch.matchScore / 100, 1);
            const finalScore = (aiScoreNormalized * 0.7) + (universityOnlyScore * 0.3); // Weight AI more when no program
            const finalScorePercentage = Math.min(finalScore * 100, 100);

            matchesToInsert.push({
              matching_session_id: sessionId,
              user_id: userId,
              university_id: university.id,
              program_id: null, // No specific program
              overall_match_score: finalScorePercentage,
              match_category: aiMatch.category as 'reach' | 'target' | 'safety',
              confidence_level: aiMatch.matchScore / 100,
              academic_fit_score: 0.7,
              program_fit_score: null,
              research_fit_score: this.calculateUniversityResearchAlignment(university, enhancedProfile.researchInterests),
              financial_fit_score: 0.7,
              location_fit_score: this.calculateLocationMatch(university, enhancedProfile.preferences),
              cultural_fit_score: 0.7,
              career_outcome_score: null,
              admission_probability: 0.7,
              reasoning: await this.generateUniversityOnlyReasoning(aiMatch.reasoning, university, aiMatch.program, enhancedProfile)
            });
            
            console.log(`✅ Created university-only match: ${university.name} (${finalScorePercentage.toFixed(1)}% match)`);
            continue;
          }
          
          console.log(`✅ Matched program: ${program.name} at ${university.name}`);

          // Calculate enhanced match score for program-specific match
          const enhancedScore = this.calculateComprehensiveMatchScore(
            university, 
            program, 
            enhancedProfile
          );

          // Combine AI score with our calculated score (both should be 0-1 range)
          const aiScoreNormalized = Math.min(aiMatch.matchScore / 100, 1); // Ensure 0-1 range
          const enhancedScoreNormalized = Math.min(enhancedScore, 1); // Ensure 0-1 range
          const finalScore = (aiScoreNormalized * 0.6) + (enhancedScoreNormalized * 0.4);
          const finalScorePercentage = Math.min(finalScore * 100, 100); // Convert to percentage, max 100%

          matchesToInsert.push({
            matching_session_id: sessionId,
            user_id: userId,
            university_id: university.id,
            program_id: program.id,
            overall_match_score: finalScorePercentage,
            match_category: aiMatch.category as 'reach' | 'target' | 'safety',
            confidence_level: aiMatch.matchScore / 100,
            academic_fit_score: this.calculateGPAMatch(enhancedProfile.gpa, program.min_gpa),
            program_fit_score: 0.8,
            research_fit_score: this.calculateResearchAlignment(
              enhancedProfile.researchInterests,
              program.research_areas || []
            ),
            financial_fit_score: this.calculateFinancialFit(
              enhancedProfile.preferences?.maxTuition || 50000,
              program.tuition_annual
            ),
            location_fit_score: this.calculateLocationMatch(university, enhancedProfile.preferences),
            cultural_fit_score: 0.7,
            career_outcome_score: 0.8,
            admission_probability: this.calculateAdmissionProbability(enhancedProfile, program, university),
            reasoning: await this.generateFastMatchReasoning(aiMatch.reasoning, university, program, enhancedProfile)
          });

          // Find relevant faculty for this program using enhanced profile
          const relevantFaculty = this.findRelevantFaculty(
            university.faculty_profiles || [],
            enhancedProfile.researchInterests,
            program.research_areas,
            matchRequest.cvAnalysis
          );

          facultyRecommendations.push(...relevantFaculty.map(faculty => ({
            university_id: university.id,
            university_name: university.name,
            program_id: program.id,
            faculty_name: faculty.name,
            faculty_title: faculty.title,
            faculty_email: faculty.email,
            research_areas: faculty.research_areas,
            match_reason: this.generateFacultyMatchReason(faculty, enhancedProfile.researchInterests),
            accepting_students: faculty.accepting_students,
            profile_url: faculty.profile_url
          })));
        }

        // Fallback: If AI didn't generate enough matches, add rule-based matches
        if (matchesToInsert.length < 3) {
          console.log('🔄 Adding rule-based matches as fallback...');
          
          for (const university of filteredUniversities.slice(0, 8)) {
            const relevantPrograms = university.university_programs?.filter(program => 
              this.isProgramRelevant(program, matchRequest.userProfile)
            ) || [];

            for (const program of relevantPrograms.slice(0, 1)) {
              // Avoid duplicates
              const exists = matchesToInsert.find(m => 
                m.university_id === university.id && m.program_id === program.id
              );
              
              if (exists) {continue;}

              const matchScore = Math.min(
                this.calculateComprehensiveMatchScore(university, program, enhancedProfile) * 100,
                100
              ); // Convert to percentage, max 100%

              if (matchScore > 20) { // Lower threshold since we have limited programs
                const category = this.determineMatchCategory(matchScore / 100, university.acceptance_rate || 0.5);
                
                matchesToInsert.push({
                  matching_session_id: sessionId || 'rule-based-session',
                  user_id: userId,
                  university_id: university.id,
                  program_id: program.id,
                  overall_match_score: matchScore,
                  match_category: category,
                  reasoning: this.generateMatchReasoning(university, program, enhancedProfile, matchScore),
                  match_factors: {
                    gpa_match: this.calculateGPAMatch(enhancedProfile.gpa, program.min_gpa),
                    research_alignment: this.calculateResearchAlignment(
                      enhancedProfile.researchInterests,
                      program.research_areas || []
                    ),
                    location_preference: this.calculateLocationMatch(university, enhancedProfile.preferences),
                    financial_fit: this.calculateFinancialFit(
                      enhancedProfile.preferences.maxTuition,
                      program.tuition_annual
                    ),
                    program_reputation: this.calculateReputationScore({
                      qs_ranking: university.qs_ranking,
                      us_news: university.us_news_ranking,
                      national: university.ranking_national
                    }),
                    admission_probability: this.calculateAdmissionProbability(enhancedProfile, program, university),
                    cv_alignment: matchRequest.cvAnalysis ? this.calculateCVAlignment(matchRequest.cvAnalysis, program) : 0.5
                  },
                  ai_model_version: 'rule-based-fallback-v1',
                  // Include university and program data for display
                  universities: university,
                  university_programs: program
                });

                if (matchesToInsert.length >= 6) {break;}
              }
            }
            if (matchesToInsert.length >= 6) {break;}
          }
        }

        // Save AI-generated matches to database
        if (matchesToInsert.length > 0) {
          console.log(`💾 Saving ${matchesToInsert.length} AI matches to database...`);
          
          // Convert AI matches to selected_universities table format
          const savedMatches = matchesToInsert.map(match => ({
            user_id: match.user_id,
            university_id: match.university_id,
            program_id: match.program_id,
            category: match.match_category || 'target', // Maps to 'category' field in selected_universities
            match_score: (match.overall_match_score || 75) / 100, // Convert percentage to decimal (0-1)
            notes: match.reasoning || 'AI-generated match',
            priority: matchesToInsert.indexOf(match) + 1, // Set priority based on order
            application_deadline: null, // Will be set when user applies
            personal_deadline: null,
            research_status: 'initial',
            is_applied: false,
            decision_received: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { data: insertedMatches, error: matchError } = await supabase
            .from('selected_universities')
            .upsert(savedMatches, { onConflict: 'user_id,university_id,program_id' })
            .select();

          if (matchError) {
            console.error('❌ AI matches database insertion error:', matchError);
            console.error('❌ Data being inserted:', savedMatches[0]); // Log first match for debugging
          } else {
            console.log(`✅ Successfully saved ${insertedMatches?.length || 0} AI matches to database`);
          }

          // Complete AI matching session
          await this.completeMatchingSession(sessionId, insertedMatches || []);
          
          return {
            matches: insertedMatches || matchesToInsert,
            facultyRecommendations: facultyRecommendations.slice(0, 6),
            sessionId
          };
        }

      } catch (aiError) {
        console.warn('⚠️ AI matching failed, using rule-based matching:', aiError);
        
        // Fallback to rule-based matching
        const matchesToInsert = [];
        const facultyRecommendations = [];
        
        for (const university of filteredUniversities.slice(0, 10)) {
          const relevantPrograms = university.university_programs?.filter(program => 
            this.isProgramRelevant(program, matchRequest.userProfile)
          ) || [];

          for (const program of relevantPrograms.slice(0, 2)) {
            const matchScore = Math.min(
              this.calculateComprehensiveMatchScore(university, program, enhancedProfile) * 100,
              100
            ); // Convert to percentage, max 100%

            if (matchScore > 40) { // 40% minimum match threshold
              const category = this.determineMatchCategory(matchScore, program.admission_rate);
              
              matchesToInsert.push({
                matching_session_id: sessionId || 'fallback-session',
                user_id: userId,
                university_id: university.id,
                program_id: program.id,
                overall_match_score: matchScore,
                match_category: category,
                reasoning: this.generateMatchReasoning(university, program, enhancedProfile, matchScore),
                match_factors: {
                  gpa_match: this.calculateGPAMatch(enhancedProfile.gpa, program.requirements?.min_gpa),
                  research_alignment: this.calculateResearchAlignment(
                    enhancedProfile.researchInterests,
                    program.research_areas
                  ),
                  location_preference: this.calculateLocationMatch(university, enhancedProfile.preferences),
                  financial_fit: this.calculateFinancialFit(
                    enhancedProfile.preferences.maxTuition,
                    program.tuition_fees?.annual_tuition
                  ),
                  program_reputation: this.calculateReputationScore(university.ranking_data),
                  admission_probability: this.calculateAdmissionProbability(enhancedProfile, program, university),
                  cv_alignment: matchRequest.cvAnalysis ? this.calculateCVAlignment(matchRequest.cvAnalysis, program) : 0.5
                },
                ai_model_version: 'rule-based-v3'
              });

              // Find relevant faculty for this program using enhanced profile
              const relevantFaculty = this.findRelevantFaculty(
                university.faculty_profiles || [],
                enhancedProfile.researchInterests,
                program.research_areas,
                matchRequest.cvAnalysis
              );

              facultyRecommendations.push(...relevantFaculty.map(faculty => ({
                university_id: university.id,
                university_name: university.name,
                program_id: program.id,
                faculty_name: faculty.name,
                faculty_title: faculty.title,
                faculty_email: faculty.email,
                research_areas: faculty.research_areas,
                match_reason: this.generateFacultyMatchReason(faculty, enhancedProfile.researchInterests),
                accepting_students: faculty.accepting_students,
                profile_url: faculty.profile_url
              })));
            }
          }
        }

        // Sort matches by score and take top matches
        matchesToInsert.sort((a, b) => b.overall_match_score - a.overall_match_score);
        const topMatches = matchesToInsert.slice(0, 8);

        // Insert AI matches into selected_universities table
        const aiMatches = topMatches.map(match => ({
          user_id: match.user_id,
          university_id: match.university_id,
          program_id: match.program_id,
          category: match.match_category, // Maps to 'category' field in selected_universities
          match_score: match.overall_match_score / 100, // Convert percentage to decimal (0-1)
          notes: match.reasoning || 'AI-generated match',
          priority: 1, // Default priority
          application_deadline: null, // Will be set when user applies
          personal_deadline: null,
          research_status: 'initial',
          is_applied: false,
          decision_received: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: insertedMatches, error: matchError } = await supabase
          .from('selected_universities')
          .upsert(aiMatches)
          .select();

        if (matchError) {
          console.error('❌ Database insertion error:', matchError);
          console.error('❌ Data being inserted:', aiMatches[0]); // Log first match for debugging
          throw matchError;
        }

        console.log(`✅ Generated ${insertedMatches?.length || 0} university matches (rule-based fallback) with ${facultyRecommendations.length} faculty recommendations`);
        
        // Complete AI matching session
        await this.completeMatchingSession(sessionId, insertedMatches || []);
        
        return {
          matches: insertedMatches || [],
          facultyRecommendations: facultyRecommendations.slice(0, 6),
          sessionId
        };
      }

    } catch (error) {
      console.error('❌ Error generating matches:', error);
      
      // Return fallback demo matches instead of throwing error
      console.log('🔄 Providing fallback demo matches due to error');
      return {
        matches: [
          {
            id: 'fallback-1',
            user_id: userId,
            university_id: null,
            program_id: null,
            match_category: 'target',
            match_score: 0.75, // Decimal format (0-1)
            notes: 'Demo match - system is currently unable to generate personalized recommendations',
            universities: {
              name: 'Sample University',
              city: 'Sample City',
              country: 'USA',
              acceptance_rate: 0.3,
              website_url: null,
              logo_url: null
            },
            university_programs: {
              name: 'Master of Science in Computer Science',
              duration_months: 24,
              degree_type: 'masters'
            },
            reasoning: 'This is a demo match while the system is being initialized. Please try again in a few moments.'
          }
        ],
        facultyRecommendations: [],
        sessionId: sessionId || 'fallback-session'
      };
    }
  }

  /**
   * Get existing matches for a user with faculty recommendations
   */
  async getUserMatches(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .select(`
          *,
          universities (*),
          university_programs (*)
        `)
        .eq('user_id', userId)
        .order('match_score', { ascending: false });

      if (error) {throw error;}
      
      // Enrich matches with faculty information
      const enrichedMatches = await Promise.all(
        (data || []).map(async (match) => {
          const { data: faculty } = await supabase
            .from('faculty_profiles')
            .select('*')
            .eq('university_id', match.university_id)
            .limit(2);
            
          return {
            ...match,
            recommended_faculty: faculty || []
          };
        })
      );
      
      return enrichedMatches;
    } catch (error) {
      console.error('❌ Error fetching user matches:', error);
      throw error;
    }
  }

  /**
   * Get faculty recommendations for a specific university/program
   */
  async getFacultyRecommendations(universityId: string, userInterests: string[] = []): Promise<any[]> {
    try {
      const { data: faculty, error } = await supabase
        .from('faculty_profiles')
        .select('*')
        .eq('university_id', universityId)
        .eq('accepting_students', true);

      if (error) {throw error;}

      if (!faculty) {return [];}

      // Score and rank faculty based on research alignment
      const scoredFaculty = faculty.map(prof => ({
        ...prof,
        alignment_score: this.calculateResearchAlignment(
          userInterests,
          prof.research_areas || []
        ),
        match_reason: this.generateFacultyMatchReason(prof, userInterests)
      }));

      // Sort by alignment score and return top matches
      return scoredFaculty
        .sort((a, b) => b.alignment_score - a.alignment_score)
        .slice(0, 3);
        
    } catch (error) {
      console.error('❌ Error fetching faculty recommendations:', error);
      return [];
    }
  }

  /**
   * Get all universities with their programs
   */
  async getAllUniversities(): Promise<University[]> {
    try {
      console.log('🔍 Attempting to fetch universities...');
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching universities:', error);
        
        // If table doesn't exist, return empty array
        if (error.message?.includes('does not exist')) {
          console.warn('⚠️ Universities table does not exist - returning empty array');
          return [];
        }
        throw error;
      }

      // If no universities found, try seeding first
      if (!data || data.length === 0) {
        console.warn('⚠️ No universities found in database');
        console.log('🌱 Attempting to seed university data...');
        
        try {
          await this.seedUniversityData();
          
          // Retry fetching after seeding
          const { data: reloadedData, error: reloadError } = await supabase
            .from('universities')
            .select('*')
            .order('name');
          
          if (!reloadError && reloadedData && reloadedData.length > 0) {
            console.log(`✅ Successfully seeded and loaded ${reloadedData.length} universities`);
            return reloadedData;
          }
        } catch (seedError) {
          console.error('❌ Error seeding universities in getAllUniversities:', seedError);
        }
        
        return [];
      }

      console.log('✅ Loaded', data.length, 'universities from database');
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching universities:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Search universities by name, location, or field
   */
  async searchUniversities(query: string): Promise<University[]> {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select(`
          *,
          university_programs (*)
        `)
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
        .order('name');

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('❌ Error searching universities:', error);
      throw error;
    }
  }

  /**
   * Helper function to calculate GPA match score
   */
  private calculateGPAMatch(userGPA: number, requiredGPA?: number): number {
    if (!requiredGPA) {return 1.0;}
    if (userGPA >= requiredGPA) {return 1.0;}
    return Math.max(0, (userGPA / requiredGPA) * 0.8);
  }

  /**
   * Helper function to calculate research alignment
   */
  private calculateResearchAlignment(userInterests: string[], programAreas: string[]): number {
    if (!userInterests.length || !programAreas.length) {return 0.5;}
    
    const matches = userInterests.filter(interest =>
      programAreas.some(area =>
        area.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(area.toLowerCase())
      )
    );
    
    return matches.length / Math.max(userInterests.length, programAreas.length);
  }

  /**
   * Helper function to calculate financial fit
   */
  private calculateFinancialFit(maxBudget?: number, tuition?: number): number {
    if (!maxBudget || !tuition) {return 0.8;}
    if (tuition <= maxBudget) {return 1.0;}
    return Math.max(0, 1 - ((tuition - maxBudget) / maxBudget));
  }

  /**
   * Calculate comprehensive match score considering multiple factors
   */
  private calculateComprehensiveMatchScore(university: any, program: any, userProfile: any): number {
    const factors = {
      gpa: this.calculateGPAMatch(userProfile.gpa, program.min_gpa) * 0.25,
      research: this.calculateResearchAlignment(userProfile.researchInterests, program.research_areas || []) * 0.30,
      reputation: this.calculateReputationScore({
        qs_ranking: university.qs_ranking,
        us_news: university.us_news_ranking,
        national: university.ranking_national
      }) * 0.20,
      financial: this.calculateFinancialFit(userProfile.preferences?.maxTuition, program.tuition_annual) * 0.15,
      admission: this.calculateAdmissionProbability(userProfile, program, university) * 0.10
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  /**
   * Check if program is relevant to user's interests (enhanced with CV data) - More lenient matching
   */
  private isProgramRelevant(program: any, userProfile: any): boolean {
    // Always return true if we have limited programs (like now with only 5 programs)
    // This ensures we can match users to available programs
    
    const userField = userProfile.targetDegree?.toLowerCase() || '';
    const programName = program.name?.toLowerCase() || '';
    const programDepartment = program.department?.toLowerCase() || '';
    
    // Check direct field matches
    const fieldMatch = programDepartment.includes(userField) || 
                      userField.includes(programDepartment) ||
                      programName.includes(userField) ||
                      userField.includes(programName);
    
    // Check research area matches
    const interestMatch = program.research_areas?.some((area: string) => 
      userProfile.researchInterests?.some((interest: string) => 
        area.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(area.toLowerCase())
      )
    );
    
    // Check for common graduate degree patterns
    const isGraduateDegree = programName.includes('master') || 
                            programName.includes('mba') || 
                            programName.includes('ms') || 
                            programName.includes('science');
    
    return fieldMatch || interestMatch || isGraduateDegree;
  }

  /**
   * Calculate reputation score from ranking data
   */
  private calculateReputationScore(rankingData: any): number {
    if (!rankingData) {return 0.5;}
    
    const rankings = Object.values(rankingData).filter(rank => typeof rank === 'number') as number[];
    if (rankings.length === 0) {return 0.5;}
    
    const avgRank = rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length;
    return Math.max(0.3, Math.min(1.0, 1 - (avgRank - 1) / 50)); // Scale 1-50 rank to 1.0-0.3 score
  }

  /**
   * Calculate admission probability based on user profile and program requirements
   */
  private calculateAdmissionProbability(userProfile: any, program: any, university?: any): number {
    let probability = 0.5; // Base probability
    
    // GPA factor
    if (program.min_gpa && userProfile.gpa) {
      if (userProfile.gpa >= program.min_gpa + 0.3) {probability += 0.3;}
      else if (userProfile.gpa >= program.min_gpa) {probability += 0.1;}
      else {probability -= 0.2;}
    }
    
    // Admission rate factor - use university's acceptance rate if program doesn't have one
    const admissionRate = program.admission_rate || university?.acceptance_rate;
    if (admissionRate) {
      probability = probability * (0.3 + admissionRate * 0.7);
    }
    
    return Math.max(0.1, Math.min(0.95, probability));
  }

  /**
   * Determine match category based on score and admission rate
   */
  private determineMatchCategory(matchScore: number, admissionRate?: number): 'reach' | 'target' | 'safety' {
    const rate = admissionRate || 0.5;
    
    if (matchScore > 0.8 && rate > 0.3) {return 'safety';}
    if (matchScore > 0.6 && rate > 0.15) {return 'target';}
    return 'reach';
  }

  /**
   * Generate fast match reasoning using ChatGPT
   */
  private async generateFastMatchReasoning(aiReasoning: string, university: any, program: any, userProfile: any): Promise<string> {
    // If AI provided good reasoning, enhance it quickly
    if (aiReasoning && aiReasoning.length > 20) {
      try {
        const enhancedReasoning = await ChatGPTService.generateMatchReasoning(
          university.name, 
          program.program_name, 
          userProfile
        );
        return `🤖 AI Analysis: ${aiReasoning}\n\n📊 Enhanced: ${enhancedReasoning}`;
      } catch (error) {
        return `🤖 AI Analysis: ${aiReasoning}`;
      }
    }

    // Generate comprehensive reasoning using static analysis
    return this.generateComprehensiveMatchReasoning(aiReasoning, university, program, userProfile, 75);
  }

  /**
   * Generate comprehensive match reasoning using ALL user data (fallback)
   */
  private generateComprehensiveMatchReasoning(aiReasoning: string, university: any, program: any, userProfile: any, matchScore = 75, comprehensiveData?: any): string {
    const sections = [];
    
    // Start with AI reasoning
    if (aiReasoning) {
      sections.push(`🤖 AI Analysis: ${aiReasoning}`);
    }

    // Academic fit analysis
    const academicReasons = [];
    if (this.calculateGPAMatch(userProfile.gpa, program.requirements?.min_gpa) > 0.8) {
      academicReasons.push(`Your GPA (${userProfile.gpa}) exceeds requirements (${program.requirements?.min_gpa})`);
    }
    
    if (userProfile.testScores?.gre && program.requirements?.gre_required) {
      academicReasons.push(`Strong test scores align with program expectations`);
    }

    if (academicReasons.length > 0) {
      sections.push(`📊 Academic Fit: ${academicReasons.join(', ')}`);
    }

    // Research alignment
    const researchAlignment = this.calculateResearchAlignment(userProfile.researchInterests || [], program.research_areas || []);
    if (researchAlignment > 0.6) {
      const matchingAreas = (userProfile.researchInterests || []).filter((interest: string) =>
        (program.research_areas || []).some((area: string) =>
          area.toLowerCase().includes(interest.toLowerCase()) || 
          interest.toLowerCase().includes(area.toLowerCase())
        )
      );
      sections.push(`🔬 Research Match: Strong alignment in ${matchingAreas.slice(0, 2).join(' and ')} (${Math.round(researchAlignment * 100)}% match)`);
    }

    // Experience and background fit
    if (userProfile.experience?.length > 0) {
      const relevantExp = userProfile.experience.filter((exp: any) =>
        (program.research_areas || []).some((area: string) =>
          exp.description?.toLowerCase().includes(area.toLowerCase())
        )
      );
      if (relevantExp.length > 0) {
        sections.push(`💼 Experience Fit: Your ${relevantExp.length} relevant work experience(s) align with program focus areas`);
      }
    }

    // Publication and project alignment
    if (userProfile.publications?.length > 0) {
      sections.push(`📚 Research Profile: ${userProfile.publications.length} publication(s) demonstrate research capability`);
    }

    if (userProfile.projects?.length > 0) {
      const techProjects = userProfile.projects.filter((proj: any) =>
        (program.research_areas || []).some((area: string) =>
          proj.description?.toLowerCase().includes(area.toLowerCase()) ||
          proj.technologies?.some((tech: string) => area.toLowerCase().includes(tech.toLowerCase()))
        )
      );
      if (techProjects.length > 0) {
        sections.push(`🛠️ Project Relevance: ${techProjects.length} project(s) directly relate to program areas`);
      }
    }

    // Career goals alignment
    if (userProfile.careerGoals) {
      const careerFit = (program.career_outcomes?.top_employers || []).length > 0;
      if (careerFit) {
        sections.push(`🎯 Career Alignment: Program outcomes match your stated career goals`);
      }
    }

    // Institutional fit
    const institutionalReasons = [];
    if (university.ranking_data && this.calculateReputationScore(university.ranking_data) > 0.7) {
      const rankings = Object.entries(university.ranking_data)
        .filter(([_, rank]) => typeof rank === 'number')
        .map(([source, rank]) => `${source}: #${rank}`)
        .slice(0, 2);
      institutionalReasons.push(`Top-ranked institution (${rankings.join(', ')})`);
    }

    if (userProfile.preferences?.countries?.includes(university.country)) {
      institutionalReasons.push(`Located in preferred country (${university.country})`);
    }

    if (institutionalReasons.length > 0) {
      sections.push(`🏛️ Institutional Fit: ${institutionalReasons.join(', ')}`);
    }

    // Financial considerations
    if (program.tuition_fees?.annual_tuition && userProfile.preferences?.maxTuition) {
      const affordability = program.tuition_fees.annual_tuition <= userProfile.preferences.maxTuition;
      const fundingAvailable = program.funding_info?.assistantships_available || program.funding_info?.guaranteed_funding;
      
      if (affordability || fundingAvailable) {
        const finReasons = [];
        if (affordability) {finReasons.push('Within budget range');}
        if (fundingAvailable) {finReasons.push('Funding opportunities available');}
        sections.push(`💰 Financial Fit: ${finReasons.join(', ')}`);
      }
    }

    // Learning from previous interactions
    if (comprehensiveData?.interactions?.length > 0) {
      const savedSimilar = comprehensiveData.savedUniversities?.some((su: any) => 
        su.universities?.university_type === university.university_type ||
        su.universities?.country === university.country
      );
      if (savedSimilar) {
        sections.push(`📈 Behavioral Match: Similar to your previously saved universities`);
      }
    }

    // Match category explanation
    const categoryExplanation = this.getCategoryExplanation(matchScore, program.admission_rate, userProfile);
    if (categoryExplanation) {
      sections.push(`🎯 ${categoryExplanation}`);
    }

    return sections.length > 0 ? sections.join('\n\n') : 'Good match based on comprehensive profile analysis.';
  }

  /**
   * Get explanation for match category
   */
  private getCategoryExplanation(matchScore: number, admissionRate?: number, userProfile?: any): string {
    const rate = admissionRate || 0.5;
    const gpaAdvantage = userProfile?.gpa && rate ? userProfile.gpa > (3.5 + (1 - rate)) : false;
    
    if (matchScore > 80 && rate > 0.3) {
      return `Safety School: High match score (${Math.round(matchScore)}%) with good admission rate (${Math.round(rate * 100)}%)`;
    }
    if (matchScore > 60 && rate > 0.15) {
      const factors = [];
      if (gpaAdvantage) {factors.push('strong GPA');}
      if (userProfile?.publications?.length > 0) {factors.push('research experience');}
      return `Target School: Good fit (${Math.round(matchScore)}%) ${factors.length > 0 ? 'with ' + factors.join(' and ') : ''}`;
    }
    return `Reach School: Competitive program (${Math.round(rate * 100)}% admission rate) but worth applying given your profile strengths`;
  }

  /**
   * Generate detailed match reasoning (legacy method for backward compatibility)
   */
  private generateMatchReasoning(university: any, program: any, userProfile: any, matchScore: number): string {
    return this.generateComprehensiveMatchReasoning('', university, program, userProfile, matchScore);
  }


  /**
   * Generate faculty match reasoning
   */
  private generateFacultyMatchReason(faculty: any, userInterests: string[]): string {
    const matchingAreas = faculty.research_areas?.filter((area: string) => 
      userInterests.some(interest => 
        area.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(area.toLowerCase())
      )
    ) || [];
    
    if (matchingAreas.length > 0) {
      return `Research expertise in ${matchingAreas.slice(0, 2).join(' and ')} aligns with your interests`;
    }
    
    return 'Research areas complement your academic background';
  }

  /**
   * Calculate location preference match
   */
  private calculateLocationMatch(university: any, preferences: any): number {
    if (!preferences?.countries && !preferences?.locations) {return 0.8;}
    
    let score = 0.5;
    
    if (preferences.countries?.includes(university.country)) {score += 0.4;}
    if (preferences.locations?.some((loc: string) => 
        university.city.toLowerCase().includes(loc.toLowerCase()) ||
        university.state_province.toLowerCase().includes(loc.toLowerCase())
      )) {score += 0.3;}
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate university-only match score (without program specifics)
   */
  private calculateUniversityOnlyMatchScore(university: any, userProfile: any): number {
    const factors = {
      reputation: this.calculateReputationScore({
        qs_ranking: university.qs_ranking,
        us_news: university.us_news_ranking,
        national: university.ranking_national
      }) * 0.40, // Weight reputation higher without program
      location: this.calculateLocationMatch(university, userProfile.preferences) * 0.30,
      research: this.calculateUniversityResearchAlignment(university, userProfile.researchInterests) * 0.30
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  /**
   * Calculate research alignment at university level (not program specific)
   */
  private calculateUniversityResearchAlignment(university: any, userInterests: string[]): number {
    if (!userInterests || userInterests.length === 0) {return 0.5;}
    if (!university.research_areas && !university.departments) {return 0.5;}

    // Use university research areas or department names as proxy
    const universityAreas = [
      ...(university.research_areas || []),
      ...(university.departments || [])
    ].map(area => area.toLowerCase());

    const matches = userInterests.filter(interest => 
      universityAreas.some(area => 
        area.includes(interest.toLowerCase()) || 
        interest.toLowerCase().includes(area)
      )
    ).length;

    return Math.min(1.0, (matches / userInterests.length) * 1.5); // Boost for university-level matching
  }

  /**
   * Generate reasoning for university-only matches
   */
  private async generateUniversityOnlyReasoning(
    aiReasoning: string, 
    university: any, 
    suggestedProgram: string,
    userProfile: any
  ): Promise<string> {
    const reasons = [];

    // AI reasoning as base
    if (aiReasoning) {
      reasons.push(`AI Recommendation: ${aiReasoning}`);
    }

    // University reputation
    if (university.qs_ranking && university.qs_ranking <= 100) {
      reasons.push(`Top-tier university (QS Ranking: #${university.qs_ranking})`);
    }

    // Location match
    if (userProfile.preferences?.countries?.includes(university.country)) {
      reasons.push(`Located in preferred country: ${university.country}`);
    }

    // Research alignment
    const researchScore = this.calculateUniversityResearchAlignment(university, userProfile.researchInterests);
    if (researchScore > 0.7) {
      reasons.push(`Strong research alignment in your areas of interest`);
    }

    // Note about program search
    reasons.push(`Suggested program area: ${suggestedProgram} (specific program details to be confirmed)`);

    return reasons.slice(0, 4).join('. ') + '.';
  }

  /**
   * Gather ALL user data from multiple tables for comprehensive matching
   */
  private async gatherAllUserData(userId: string): Promise<any> {
    try {
      console.log('🔍 Gathering comprehensive user data for AI matching...');
      
      // Get academic profile
      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get user profile data instead of non-existent onboarding table
      const { data: onboardingData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get research interests (using correct schema)
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests!inner(name, category)
        `)
        .eq('user_id', userId);

      // Get CV analysis (using correct schema table name)
      const { data: cvAnalyses } = await supabase
        .from('cv_analysis')
        .select('id, user_id, personal_info, education, work_experience, skills, research, achievements, strengths, areas_for_improvement, recommendations, confidence_score, completeness_score, created_at, original_filename')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get existing AI matches for learning
      const { data: previousMatches } = await supabase
        .from('selected_universities')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      // Get user interactions for preferences (use existing table)
      const { data: interactions } = await supabase
        .from('selected_universities')
        .select('*')
        .eq('user_id', userId)
        .limit(20);

      // Get saved universities (use existing table)
      const { data: savedUniversities } = await supabase
        .from('selected_universities')
        .select('*, universities(*)')
        .eq('user_id', userId);

      return {
        academicProfile,
        onboardingData,
        researchInterests: researchInterests?.map(ri => ({
          name: ri.research_interests?.name,
          category: ri.research_interests?.category,
          proficiency: ri.proficiency_level,
          source: ri.source
        })) || [],
        cvAnalyses: cvAnalyses || [],
        previousMatches: previousMatches || [],
        interactions: interactions || [],
        savedUniversities: savedUniversities || []
      };
    } catch (error) {
      console.error('❌ Error gathering comprehensive user data:', error);
      return {};
    }
  }

  /**
   * Enhance user profile with ALL available data for AI-powered matching
   */
  private enhanceUserProfileWithAllData(userProfile: any, cvAnalysis?: any, comprehensiveData?: any): any {
    const enhanced = { ...userProfile };

    // Start with basic CV enhancement
    if (cvAnalysis) {
      enhanced.researchInterests = [
        ...enhanced.researchInterests || [],
        ...(cvAnalysis.researchAreas || [])
      ].filter((item, index, arr) => arr.indexOf(item) === index);

      if (cvAnalysis.education?.[0]?.gpa && !enhanced.gpa) {
        enhanced.gpa = cvAnalysis.education[0].gpa;
      }

      if (cvAnalysis.education?.[0]?.field && !enhanced.targetDegree) {
        enhanced.targetDegree = cvAnalysis.education[0].field;
      }
    }

    // Enhance with comprehensive database data
    if (comprehensiveData) {
      // Academic profile data (highest priority)
      if (comprehensiveData.academicProfile) {
        const ap = comprehensiveData.academicProfile;
        enhanced.gpa = enhanced.gpa || ap.current_gpa;
        enhanced.currentInstitution = ap.current_institution;
        enhanced.currentDegree = ap.current_degree;
        enhanced.graduationYear = ap.graduation_year;
        
        if (ap.current_field && !enhanced.targetDegree) {
          enhanced.targetDegree = ap.current_field;
        }
      }

      // Onboarding data (comprehensive preferences)
      if (comprehensiveData.onboardingData) {
        const od = comprehensiveData.onboardingData;
        enhanced.careerGoals = od.career_goals;
        enhanced.targetDegreeLevel = od.target_degree_level;
        enhanced.workExperience = od.work_experience;
        enhanced.leadership = od.leadership_experience;
        
        // Enhanced preferences from onboarding
        enhanced.preferences = {
          ...enhanced.preferences,
          countries: od.preferred_countries || enhanced.preferences?.countries || [],
          locations: od.preferred_locations || enhanced.preferences?.locations || [],
          universityTypes: od.preferred_university_types || enhanced.preferences?.universityTypes || [],
          maxTuition: od.max_tuition || enhanced.preferences?.maxTuition,
          campusSetting: od.preferred_campus_setting,
          classSize: od.preferred_class_size
        };

        // Test scores from onboarding
        enhanced.testScores = {
          ...enhanced.testScores,
          gre: od.gre_score || enhanced.testScores?.gre,
          toefl: od.toefl_score || enhanced.testScores?.toefl,
          ielts: od.ielts_score || enhanced.testScores?.ielts
        };
      }

      // Research interests (most specific)
      if (comprehensiveData.researchInterests?.length > 0) {
        enhanced.researchInterests = [
          ...enhanced.researchInterests || [],
          ...comprehensiveData.researchInterests.map((ri: any) => ri.field)
        ].filter((item, index, arr) => arr.indexOf(item) === index);

        enhanced.researchProficiency = comprehensiveData.researchInterests.reduce((acc: any, ri: any) => {
          acc[ri.field] = ri.proficiency || 3;
          return acc;
        }, {});
      }

      // CV analyses (multiple versions for comprehensive understanding)
      if (comprehensiveData.cvAnalyses?.length > 0) {
        const latestCV = comprehensiveData.cvAnalyses[0];
        enhanced.publications = latestCV.publications || [];
        enhanced.projects = latestCV.projects || [];
        enhanced.skills = {
          technical: latestCV.skills?.technical || [],
          soft: latestCV.skills?.soft || [],
          languages: latestCV.skills?.languages || []
        };
        enhanced.experience = latestCV.experience || [];
        enhanced.awards = latestCV.awards || [];
        enhanced.certifications = latestCV.certifications || [];
      }

      // Previous matches and interactions (learning from behavior)
      if (comprehensiveData.previousMatches?.length > 0) {
        enhanced.previousMatchCategories = comprehensiveData.previousMatches.map((m: any) => m.category);
        enhanced.previousMatchScores = comprehensiveData.previousMatches.map((m: any) => m.match_score);
      }

      if (comprehensiveData.interactions?.length > 0) {
        enhanced.interactionPatterns = {
          viewedMatches: comprehensiveData.interactions.filter((i: any) => i.interaction_type === 'view').length,
          savedMatches: comprehensiveData.interactions.filter((i: any) => i.interaction_type === 'save').length,
          appliedMatches: comprehensiveData.interactions.filter((i: any) => i.interaction_type === 'apply').length,
          dismissedMatches: comprehensiveData.interactions.filter((i: any) => i.interaction_type === 'dismiss').length
        };
      }

      // Saved universities (explicit preferences)
      if (comprehensiveData.savedUniversities?.length > 0) {
        enhanced.explicitPreferences = {
          savedCountries: [...new Set(comprehensiveData.savedUniversities.map((su: any) => su.universities?.country))].filter(Boolean),
          savedUniversityTypes: [...new Set(comprehensiveData.savedUniversities.map((su: any) => su.universities?.university_type))].filter(Boolean),
          savedRankingRanges: comprehensiveData.savedUniversities.map((su: any) => su.universities?.ranking_data).filter(Boolean)
        };
      }
    }

    console.log('✅ Enhanced user profile with comprehensive data:', {
      gpa: enhanced.gpa,
      researchInterests: enhanced.researchInterests?.length || 0,
      testScores: enhanced.testScores,
      careerGoals: Boolean(enhanced.careerGoals),
      experience: enhanced.experience?.length || 0,
      publications: enhanced.publications?.length || 0
    });

    return enhanced;
  }

  /**
   * Legacy method - keeping for backward compatibility but using new enhanced version
   */
  private enhanceUserProfileWithCV(userProfile: any, cvAnalysis?: any): any {
    return this.enhanceUserProfileWithAllData(userProfile, cvAnalysis, null);
  }

  /**
   * Calculate CV alignment score
   */
  private calculateCVAlignment(cvAnalysis: any, program: any): number {
    let score = 0.5; // Base score
    
    // Experience alignment
    if (cvAnalysis.experience?.length > 0) {
      const relevantExp = cvAnalysis.experience.filter((exp: any) => 
        program.research_areas?.some((area: string) => 
          exp.description?.toLowerCase().includes(area.toLowerCase()) ||
          exp.technologies?.some((tech: string) => area.toLowerCase().includes(tech.toLowerCase()))
        )
      );
      score += (relevantExp.length / cvAnalysis.experience.length) * 0.3;
    }
    
    // Skills alignment
    if (cvAnalysis.skills?.technical?.length > 0) {
      const relevantSkills = cvAnalysis.skills.technical.filter((skill: string) => 
        program.research_areas?.some((area: string) => 
          area.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(area.toLowerCase())
        )
      );
      score += Math.min(0.2, (relevantSkills.length / cvAnalysis.skills.technical.length) * 0.2);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Enhanced faculty matching with CV analysis
   */
  private findRelevantFaculty(facultyList: any[], userInterests: string[], programAreas: string[], cvAnalysis?: any): any[] {
    const allInterests = [...userInterests];
    
    // Add CV-derived interests
    if (cvAnalysis?.researchAreas) {
      allInterests.push(...cvAnalysis.researchAreas);
    }
    
    // Add technical skills as potential research interests
    if (cvAnalysis?.skills?.technical) {
      allInterests.push(...cvAnalysis.skills.technical);
    }
    
    return facultyList
      .filter(faculty => {
        if (!faculty.research_areas) {return false;}
        
        return faculty.research_areas.some((area: string) => 
          allInterests.some(interest => 
            area.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(area.toLowerCase())
          ) ||
          programAreas.some(progArea => 
            area.toLowerCase().includes(progArea.toLowerCase())
          )
        );
      })
      .slice(0, 2); // Max 2 faculty per program
  }

  /**
   * Record user interaction with a match
   */
  async recordMatchInteraction(
    userId: string,
    matchId: string,
    interactionType: 'view' | 'save' | 'apply' | 'dismiss' | 'contact' | 'faculty_contact'
  ): Promise<void> {
    try {
      await supabase
        .from('university_match_interactions')
        .insert({
          user_id: userId,
          match_id: matchId,
          interaction_type: interactionType,
          interaction_data: {
            timestamp: new Date().toISOString(),
            source: 'web_app'
          }
        });
    } catch (error) {
      console.error('❌ Error recording interaction:', error);
    }
  }

  /**
   * Get comprehensive university details with programs and faculty
   */
  async getUniversityDetails(universityId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select(`
          *,
          university_programs (*),
          faculty_profiles (*)
        `)
        .eq('id', universityId)
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {
      console.error('❌ Error fetching university details:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const universityMatchingService = new UniversityMatchingService();
export default universityMatchingService;

// Additional interfaces for comprehensive matching
export interface FacultyRecommendation {
  university_id: string;
  university_name: string;
  program_id?: string;
  faculty_name: string;
  faculty_title: string;
  faculty_email: string;
  research_areas: string[];
  match_reason: string;
  accepting_students: boolean;
  profile_url?: string;
}

export interface EnhancedUniversityMatch extends UniversityMatch {
  recommended_faculty: FacultyRecommendation[];
  university_info?: University;
  program_info?: GraduateProgram;
}