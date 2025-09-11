import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Edit, 
  MessageSquare, 
  Star,
  Search,
  Filter,
  Grid,
  List,
  Folder,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Bookmark,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentLibraryProps {
  user: User;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('templates');
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState('');

  // Real templates based on provided documents
  const templates = [
    {
      id: 1,
      title: "Statement of Purpose - Biological Sciences PhD",
      description: "Professional SOP template for PhD applications in biological sciences, featuring research experience and career goals",
      type: "statement-of-purpose",
      fileType: "docx",
      size: "68 KB",
      category: "phd",
      field: "biological-sciences",
      university: "University of Cincinnati",
      program: "Ph.D. in Biological Sciences",
      isTemplate: true,
      downloads: 892,
      rating: 4.9,
      lastUpdated: "1 week ago",
      tags: ["sop", "phd", "biological-sciences", "research", "template"],
      content: `Statement of Purpose

Worldwide, the propensity of mosquito vectors to transmit diseases such as dengue fever, filariasis and malaria, continue to represent a serious threat to socio-economic development. The impact of the disease burden is even more pronounced in the tropical regions. Currently, the absence of a protective vaccine, the spread of parasite resistance to therapeutic drugs and mosquito resistance to insecticides are the main obstacles to disease control and elimination. Till date, the use of chemical insecticides makes up most vector control programmes. While being effective, the dramatic increase in mosquito resistance to these chemicals shows that continual usage cannot be further relied upon.

From the fore goings, resistance management strategies are very critical, if the efficacy of current practices is to be preserved. This will require a deep understanding of adaptive mechanisms such as behavioural and metabolic resistance. Thus, as a prospective graduate student at [UNIVERSITY NAME], it is my interest to study the mechanisms of [YOUR RESEARCH INTEREST]; and consequently identify the molecular basis (genetic markers) for such mechanisms.

Already, I have gained valuable experience in [YOUR FIELD] studies. My undergraduate research work focused on [YOUR UNDERGRADUATE RESEARCH TOPIC].

The result of my findings demonstrated that [YOUR KEY FINDINGS/INSIGHTS]. Thus, other methods of [YOUR APPROACH] are essential. Hence, it is my interest to commit my doctoral research to explore the sustainable complementary approach to [YOUR RESEARCH PROBLEM].

My choice of a Ph.D. program at [UNIVERSITY NAME] was inspired by the fact that the institution offers students a balance of educational excellence and real-world experience; and also the opportunity to learn from faculty members who are ranked as top in their respective fields. Further to this; I am fascinated by [UNIVERSITY'S UNIQUE FEATURES] and the long rich history of the institution as a research pioneer.

From my research on the Faculty staff in the Department of [DEPARTMENT NAME] at [UNIVERSITY NAME], I found out that Professor [FACULTY NAME]'s research interest is in [FACULTY RESEARCH AREA] and he/she has worked on [SPECIFIC RESEARCH TOPICS]. Leveraging on these, my aim during the program is to seek knowledge and experience in a variety of techniques, get more proficient in [RELEVANT SKILLS] and field research.

My long term career goal is not just to become an academic, but to serve as a seasoned consultant to research institutes in [YOUR COUNTRY/REGION] in order to collaborate on the development of innovative [YOUR FIELD] strategies. Thus, the doctoral program will help advance my long-term career plan; improving the quality of livelihood.`
    },
    {
      id: 2,
      title: "Statement of Purpose - Molecular & Cellular Biology PhD",
      description: "Compelling SOP template for PhD applications in molecular biology, emphasizing personal motivation and research experience",
      type: "statement-of-purpose",
      fileType: "docx",
      size: "115 KB",
      category: "phd",
      field: "molecular-biology",
      university: "UC Berkeley",
      program: "Ph.D. in Molecular & Cellular Biology",
      isTemplate: true,
      downloads: 1247,
      rating: 4.8,
      lastUpdated: "3 days ago",
      tags: ["sop", "phd", "molecular-biology", "neuroscience", "template"],
      content: `Statement of Purpose

When [PERSONAL MOTIVATION/DEFINING MOMENT], my family gave me one sentence as a weak explanation for why: "[QUOTE THAT SPARKED YOUR INTEREST]." Although I was only [AGE], this moment set the course for my future study of [YOUR FIELD]. I craved an understanding of how [SCIENTIFIC PHENOMENON] could ultimately impact [REAL-WORLD APPLICATION]. By the time I began college, this curiosity had led me to the vast, beautiful, and frustrating unknowns of [YOUR RESEARCH FIELD]. My subsequent explorations into [SPECIFIC SUBFIELD] solidified my intentions to pursue a Ph.D. and dedicate my career to illuminating [YOUR RESEARCH FOCUS].

At [YOUR UNDERGRADUATE UNIVERSITY], my surface-level fascination with [FIELD] evolved into a deeper intellectual interest in [SPECIFIC RESEARCH AREA]. In Dr. [ADVISOR NAME]'s lab, I [DESCRIBE YOUR RESEARCH PROJECT AND METHODS]. I was particularly intrigued by [SPECIFIC ASPECT OF RESEARCH], and I sought to uncover [RESEARCH QUESTION]. To test these theories, I [METHODS AND TECHNIQUES YOU USED]. The challenge of designing the most efficient and simple experiments to answer multifaceted questions enthralled me. With practice, I learned effective ways to deconstruct research questions into digestible experiments. My [TYPE OF] investigations demonstrated [KEY FINDINGS] and raised the exciting possibility that [IMPLICATIONS OF YOUR WORK]. My discovery of [SPECIFIC RESULTS] led to [NUMBER] publications and a manuscript that is currently under review.

After working in an academic lab, I was curious to see how basic research is translated into helpful [APPLICATIONS] for people like [PERSONAL CONNECTION]. To explore this translational side of [FIELD], I interned at [COMPANY/INSTITUTION] in the [DEPARTMENT]. I [DESCRIBE YOUR WORK AND ACHIEVEMENTS]. I had the opportunity to present my research to [AUDIENCE], and my project was later integrated into [BROADER APPLICATION]. While I remain fascinated by [APPLICATION], I discovered how much these [APPLICATIONS] depend on advances in basic scientific research. I was motivated by this experience and sought an opportunity to investigate [RESEARCH FOCUS] with Dr. [CURRENT ADVISOR] at [CURRENT INSTITUTION].

Working with Dr. [CURRENT ADVISOR] has been my most formative experience as a young scientist. Under Dr. [ADVISOR]'s mentorship, my thinking about scientific questions has been fundamentally expanded and restructured, leading me to approach research with creativity and originality. I am fortunate to also have the responsibility and intellectual autonomy to guide my projects in Dr. [ADVISOR]'s lab. My research investigates [CURRENT RESEARCH FOCUS].

I believe that joining [TARGET UNIVERSITY]'s [PROGRAM NAME] would allow me to develop the research experience and intellectual framework necessary to conduct cutting-edge and high-quality research. Specifically, I would be honored to work with Dr. [FACULTY 1] to continue investigating [RESEARCH AREA 1]. Additionally, I would appreciate working with Dr. [FACULTY 2] on [RESEARCH AREA 2]. I am also fascinated by the investigations of Dr. [FACULTY 3]; Dr. [FACULTY 3]'s research into [RESEARCH AREA 3] is new to me but excites my interest in [CONNECTION TO YOUR INTERESTS].

I am enthusiastic about the exploration, challenges, and growth that lie ahead for me in graduate school, and I hope these experiences will be at [TARGET UNIVERSITY]. Ultimately, I aspire to lead my lab as an academic professor or principal investigator. My research interests will undoubtedly evolve with more training, but I remain committed to exploring basic science with the goal of advancing [YOUR ULTIMATE GOAL].`
    },
    {
      id: 3,
      title: "Academic CV Template - Graduate School Applications",
      description: "Professional academic CV format optimized for graduate school applications with research experience",
      type: "cv-resume",
      fileType: "docx",
      size: "95 KB",
      category: "cv",
      field: "all-fields",
      isTemplate: true,
      downloads: 2341,
      rating: 4.9,
      lastUpdated: "5 days ago",
      tags: ["cv", "academic", "graduate-school", "resume", "template"],
      content: `[YOUR FULL NAME]
[Your Address] | [City, State ZIP] | [Phone] | [Email] | [LinkedIn/Website]

EDUCATION
Ph.D. in [Field], [University Name], [Expected Graduation Year]
    Dissertation: "[Dissertation Title]"
    Advisor: Dr. [Advisor Name]
    GPA: [GPA]/4.0

M.S./M.A. in [Field], [University Name], [Graduation Year]
    Thesis: "[Thesis Title]"
    GPA: [GPA]/4.0

B.S./B.A. in [Field], [University Name], [Graduation Year]
    Summa Cum Laude, Phi Beta Kappa
    GPA: [GPA]/4.0

RESEARCH EXPERIENCE
Graduate Research Assistant, [Lab Name], [University] ([Start Date] - Present)
    • [Research description and key accomplishments]
    • [Specific techniques, methodologies, or tools used]
    • [Results or impact of your work]

Undergraduate Research Assistant, [Lab Name], [University] ([Start Date] - [End Date])
    • [Research description and key accomplishments]
    • [Skills developed and contributions made]

Research Intern, [Company/Institution], [Location] ([Start Date] - [End Date])
    • [Project description and outcomes]
    • [Technologies or methods used]

PUBLICATIONS
Peer-Reviewed Articles:
1. [Your Name], [Co-authors]. ([Year]). "[Article Title]." [Journal Name], [Volume(Issue)], [Page numbers].
2. [Continue listing publications in chronological order]

Manuscripts in Preparation:
1. [Your Name], [Co-authors]. "[Title]." Target journal: [Journal Name].

PRESENTATIONS
Conference Presentations:
• [Your Name]. ([Year]). "[Presentation Title]." [Conference Name], [Location].
• [Continue listing presentations]

Invited Talks:
• [Your Name]. ([Year]). "[Talk Title]." [Venue/Institution], [Location].

AWARDS & HONORS
• [Award Name], [Institution/Organization] ([Year]) - [Amount if monetary]
• [Fellowship Name], [Institution/Organization] ([Year])
• [Honor Name], [Institution/Organization] ([Year])

GRANTS & FUNDING
• [Grant Name], [Funding Agency] ([Year]) - $[Amount]
• [Fellowship Name], [Institution] ([Year]) - $[Amount]

TEACHING EXPERIENCE
Teaching Assistant, [Course Name], [University] ([Semester Year])
    • [Responsibilities and achievements]

Guest Lecturer, [Course Name], [University] ([Date])
    • [Topic presented and audience]

TECHNICAL SKILLS
Laboratory Techniques: [List relevant lab techniques]
Software: [List software programs, programming languages]
Equipment: [List specialized equipment you can operate]
Languages: [List languages and proficiency levels]

PROFESSIONAL ACTIVITIES
Manuscript Reviewer: [Journal Names] ([Years])
Conference Session Chair: [Conference Name] ([Year])
Professional Memberships: [Society Names] ([Years])

LEADERSHIP & SERVICE
• [Leadership Position], [Organization] ([Years])
• [Volunteer Work], [Organization] ([Years])
• [Committee Membership], [Institution] ([Years])

REFERENCES
Available upon request`
    },
    {
      id: 4,
      title: "Cover Letter Template - Graduate Program Applications",
      description: "Professional cover letter template for graduate program applications and research positions",
      type: "cover-letter",
      fileType: "docx",
      size: "45 KB",
      category: "cover-letter",
      field: "all-fields",
      isTemplate: true,
      downloads: 1876,
      rating: 4.7,
      lastUpdated: "1 week ago",
      tags: ["cover-letter", "graduate-school", "application", "template"],
      content: `[Your Name]
[Your Address]
[City, State ZIP Code]
[Your Email]
[Your Phone Number]
[Date]

[Admissions Committee/Faculty Name]
[Department Name]
[University Name]
[University Address]
[City, State ZIP Code]

Dear Members of the Admissions Committee [or specific faculty name],

I am writing to express my strong interest in the [specific program name] at [University Name]. With my background in [your field/area of study] and passion for [specific research area], I am confident that your program offers the ideal environment for me to pursue my research goals and contribute meaningfully to the field.

[OPENING PARAGRAPH - Hook and thesis]
My interest in [field] began [brief personal story or motivation]. This early fascination has evolved into a serious academic pursuit, culminating in [current status/achievement] and my decision to pursue [degree level] studies in [specific field].

[BODY PARAGRAPH 1 - Academic background and research experience]
During my [undergraduate/master's] studies at [university], I have gained substantial experience in [research area]. Working under the supervision of Dr. [advisor name], I [describe your research project, methods, and key findings]. This experience taught me [specific skills] and reinforced my interest in [specific research questions]. My work resulted in [publications, presentations, or other outcomes], demonstrating my ability to conduct rigorous research and communicate findings effectively.

[BODY PARAGRAPH 2 - Specific interest in the program and faculty]
I am particularly drawn to [University Name] because of [specific reasons - research strengths, faculty, resources]. Dr. [Faculty Name 1]'s work on [research area] aligns perfectly with my interests in [your related interests]. Additionally, Dr. [Faculty Name 2]'s research on [research area] offers exciting opportunities to explore [specific aspects]. The interdisciplinary nature of your program, particularly the collaboration between [departments/centers], would allow me to approach my research questions from multiple perspectives.

[BODY PARAGRAPH 3 - Future goals and contribution]
My long-term career goal is to [describe career aspirations]. The [program name] at [University Name] represents the ideal next step toward achieving this goal. I am particularly excited about the opportunity to [specific program features - coursework, research facilities, collaborations]. I believe my background in [your strengths] and experience with [specific skills/techniques] would allow me to make meaningful contributions to ongoing research projects while developing my own independent research program.

[CLOSING PARAGRAPH]
Thank you for considering my application. I am excited about the possibility of joining your program and contributing to the vibrant research community at [University Name]. I look forward to the opportunity to discuss my research interests and qualifications further.

Sincerely,
[Your Name]`
    },
    {
      id: 5,
      title: "Research Proposal Template - PhD Applications",
      description: "Comprehensive research proposal template for PhD applications with methodology and timeline",
      type: "research-proposal",
      fileType: "docx",
      size: "120 KB",
      category: "research",
      field: "all-fields",
      isTemplate: true,
      downloads: 1534,
      rating: 4.8,
      lastUpdated: "4 days ago",
      tags: ["research-proposal", "phd", "methodology", "timeline", "template"],
      content: `Research Proposal: [Your Research Title]

ABSTRACT
[150-300 words summarizing your research question, methodology, expected outcomes, and significance]

1. INTRODUCTION AND BACKGROUND
[Provide context for your research area and establish the importance of your research question]

The field of [your research area] has seen significant advances in recent years, particularly in [specific advances]. However, several critical questions remain unanswered, including [key knowledge gaps]. This proposal outlines a research plan to address [specific research question/problem].

[Literature review - 2-3 paragraphs discussing current state of knowledge and identifying gaps]

2. RESEARCH QUESTION AND OBJECTIVES
Primary Research Question:
[State your main research question clearly]

Specific Objectives:
1. [Objective 1]
2. [Objective 2]  
3. [Objective 3]
4. [Objective 4]

Hypotheses:
[State your testable hypotheses]

3. LITERATURE REVIEW
[Comprehensive review of relevant literature, organized thematically]

3.1 [Theme 1]
[Review relevant studies and theories]

3.2 [Theme 2] 
[Continue with additional themes]

3.3 Knowledge Gap
[Clearly identify what gaps your research will address]

4. METHODOLOGY
4.1 Research Design
[Describe your overall research approach - experimental, observational, computational, etc.]

4.2 Participants/Subjects/Materials
[Describe your study population, sample size calculations, inclusion/exclusion criteria]

4.3 Data Collection Procedures
[Detailed description of how you will collect data]

4.4 Analytical Approach
[Describe statistical or analytical methods you will use]

4.5 Ethical Considerations
[Address any ethical issues and how they will be managed]

5. TIMELINE
Year 1:
• [Quarter/Semester 1]: [Activities]
• [Quarter/Semester 2]: [Activities]

Year 2:
• [Quarter/Semester 1]: [Activities]
• [Quarter/Semester 2]: [Activities]

[Continue for duration of program]

6. EXPECTED OUTCOMES AND SIGNIFICANCE
[Describe expected results and their broader impact]

This research will contribute to [field] by:
• [Contribution 1]
• [Contribution 2]
• [Contribution 3]

7. RESOURCES AND BUDGET
[If applicable, outline resources needed and estimated costs]

8. REFERENCES
[Comprehensive bibliography in appropriate citation style]`
    },
    {
      id: 6,
      title: "Personal Statement Template - Master's Programs",
      description: "Effective personal statement template for Master's degree applications across disciplines",
      type: "personal-statement",
      fileType: "docx",
      size: "52 KB",
      category: "masters",
      field: "all-fields",
      isTemplate: true,
      downloads: 3421,
      rating: 4.6,
      lastUpdated: "2 weeks ago",
      tags: ["personal-statement", "masters", "application", "template"],
      content: `Personal Statement

[OPENING PARAGRAPH - Hook and introduce your passion]
[Start with an engaging anecdote, quote, or defining moment that sparked your interest in the field]

My journey toward [field of study] began [when/how], igniting a passion that has shaped my academic and professional aspirations. This early exposure to [relevant experience] revealed the profound impact that [field] can have on [relevant area of impact], motivating me to pursue advanced study in this dynamic field.

[BODY PARAGRAPH 1 - Academic background and achievements]
During my undergraduate studies in [major] at [university], I developed a strong foundation in [relevant areas]. My coursework in [specific courses] introduced me to [key concepts/theories], while my [GPA/honors] reflects my dedication to academic excellence. I was particularly drawn to [specific area of interest], which led me to [relevant project/thesis/research].

[BODY PARAGRAPH 2 - Professional/research experience]
My practical experience in [field] has been equally formative. As a [position] at [organization], I [describe key responsibilities and accomplishments]. This role taught me [specific skills] and provided insight into [industry/field challenges]. Additionally, my work on [project/research] allowed me to [describe contributions and learning outcomes].

[BODY PARAGRAPH 3 - Specific program interest]
I am particularly attracted to the [specific program name] at [university] because of [specific reasons - faculty, resources, curriculum]. The program's emphasis on [program strengths] aligns perfectly with my interests in [your specific interests]. I am especially eager to work with Professor [name] whose research on [research area] complements my background in [your relevant experience].

[BODY PARAGRAPH 4 - Career goals and impact]
Upon completion of the [degree] program, I plan to [short-term goals], with the ultimate goal of [long-term career aspirations]. I believe that the comprehensive training provided by your program will equip me with the knowledge and skills necessary to [how you'll make an impact in the field].

[CLOSING PARAGRAPH]
The [program name] represents the ideal next step in my academic and professional journey. I am excited about the opportunity to contribute to the vibrant learning community at [university] while preparing for a meaningful career in [field]. Thank you for considering my application.`
    },
    {
      id: 7,
      title: "Diversity Statement Template",
      description: "Thoughtful diversity statement template highlighting unique perspectives and contributions",
      type: "diversity-statement",
      fileType: "docx",
      size: "38 KB",
      category: "supplemental",
      field: "all-fields",
      isTemplate: true,
      downloads: 987,
      rating: 4.5,
      lastUpdated: "1 week ago",
      tags: ["diversity", "statement", "inclusion", "perspective", "template"],
      content: `Diversity Statement

[OPENING - Introduce your unique perspective]
My background as [describe your unique characteristics/experiences] has shaped my worldview and approach to [academic field/research]. This perspective, cultivated through [specific experiences], drives my commitment to fostering inclusive environments and advancing diverse voices in [field].

[BODY PARAGRAPH 1 - Personal background and challenges]
Growing up [describe background - cultural, socioeconomic, geographic, etc.], I encountered [specific challenges or unique experiences]. These experiences taught me [lessons learned] and developed my ability to [relevant skills - problem-solving, empathy, resilience]. For example, [specific example that illustrates your point].

[BODY PARAGRAPH 2 - How diversity shaped your academic/professional journey]
My diverse background has significantly influenced my academic interests and approach to research. [Describe how your perspective led to unique insights or approaches]. During [specific experience], I realized that [insight about diversity's value in your field]. This understanding has motivated me to [specific actions you've taken].

[BODY PARAGRAPH 3 - Contributions to diversity and inclusion]
I have actively worked to promote diversity and inclusion through [specific examples of your contributions]. As [role/position], I [describe specific initiatives or actions]. These experiences have taught me the importance of [lessons about diversity/inclusion] and strengthened my commitment to creating equitable opportunities for underrepresented groups.

[BODY PARAGRAPH 4 - Future contributions]
In graduate school and beyond, I plan to continue championing diversity through [specific planned activities]. I am particularly interested in [specific diversity-related goals in your field]. My unique perspective will allow me to contribute to [how you'll enhance diversity in the program/field] and help create more inclusive research practices.

[CLOSING]
Diversity of thought, background, and experience is essential for advancing knowledge and solving complex problems in [field]. I am excited about the opportunity to bring my unique perspective to [program/institution] and work alongside diverse colleagues to push the boundaries of [field] while fostering an inclusive academic community.`
    }
  ];

  // User's personal documents (editable)
  const userDocuments = [
    {
      id: 101,
      title: "My Statement of Purpose - Draft",
      description: "Personal SOP draft in progress",
      type: "statement-of-purpose",
      fileType: "docx",
      size: "45 KB",
      status: "draft",
      lastModified: "2 hours ago",
      isEditable: true,
      content: "Start writing your statement of purpose here..."
    }
  ];

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'xlsx':
        return '📊';
      default:
        return '📁';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'template':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUseTemplate = (template: any) => {
    const newDocument = {
      id: Date.now(),
      title: `My ${template.title}`,
      description: `Based on ${template.title}`,
      type: template.type,
      fileType: 'docx',
      size: '0 KB',
      status: 'draft',
      lastModified: 'Just now',
      isEditable: true,
      content: template.content
    };
    
    setEditingDocument(newDocument);
    setDocumentContent(template.content);
    toast.success('Template loaded! You can now edit and save your document.');
  };

  const handleEditDocument = (document: any) => {
    setEditingDocument(document);
    setDocumentContent(document.content || '');
  };

  const handleSaveDocument = () => {
    if (editingDocument) {
      toast.success('Document saved successfully!');
      setEditingDocument(null);
      setDocumentContent('');
    }
  };

  const handleDownloadDocument = (documentData: any, format: 'txt' | 'doc' = 'doc') => {
    console.log('Download started for:', documentData.title, 'Format:', format);
    
    try {
      // Validate input
      if (!documentData) {
        throw new Error('No document provided');
      }
      
      const content = documentData.content || `# ${documentData.title}\n\n${documentData.description || 'Document content not available'}`;
      console.log('Content length:', content.length);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const cleanTitle = (documentData.title || 'document').replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
      const filename = `${cleanTitle}_${timestamp}`;
      
      let blob, fileExtension;
      
      if (format === 'doc') {
        // Create HTML content that can be opened by Word
        const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="UTF-8">
    <title>${documentData.title || 'Document'}</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 1in;
            padding: 0;
            color: #000;
            background: white;
        }
        h1 { 
            font-size: 16pt; 
            font-weight: bold; 
            text-align: center; 
            margin-bottom: 24pt;
            page-break-after: avoid;
        }
        h2 { 
            font-size: 14pt; 
            font-weight: bold; 
            margin-top: 18pt;
            margin-bottom: 12pt;
        }
        p {
            margin: 12pt 0;
            text-align: justify;
            text-indent: 0.5in;
        }
        .template-placeholder {
            color: #0066cc;
            font-weight: bold;
            background-color: #f0f8ff;
            padding: 2px 4px;
        }
        @media print {
            body { margin: 1in; }
        }
    </style>
</head>
<body>
    ${content.split('\n').map(line => {
      line = line.trim();
      if (!line) return '<p style="margin: 6pt 0;">&nbsp;</p>';
      
      // Handle headers
      if (line.match(/^[A-Z\s]{3,}$/) && line.length < 100) {
        return `<h1>${line}</h1>`;
      }
      if (line.endsWith(':') && line.length < 50) {
        return `<h2>${line}</h2>`;
      }
      
      // Handle template placeholders
      const processedLine = line.replace(/\[([^\]]+)\]/g, '<span class="template-placeholder">[$1]</span>');
      return `<p>${processedLine}</p>`;
    }).join('\n')}
</body>
</html>`;
        
        blob = new Blob([htmlContent], { type: 'application/msword' });
        fileExtension = 'doc';
      } else {
        // Plain text format
        blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        fileExtension = 'txt';
      }
      
      console.log('Blob created:', blob.size, 'bytes');
      
      // Create download using the global document object
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${filename}.${fileExtension}`;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      window.document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (window.document.body.contains(link)) {
          window.document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Downloaded "${documentData.title}" as ${filename}.${fileExtension}`);
      console.log('Download completed successfully');
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };;;;;

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'statement-of-purpose', label: 'Statement of Purpose' },
    { value: 'personal-statement', label: 'Personal Statements' },
    { value: 'cover-letter', label: 'Cover Letters' },
    { value: 'cv-resume', label: 'CV & Resume' },
    { value: 'research-proposal', label: 'Research Proposals' },
    { value: 'diversity-statement', label: 'Diversity Statements' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Document Editor Modal
  if (editingDocument) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{editingDocument.title}</h2>
            <p className="text-sm text-gray-600">Document Editor</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveDocument} className="bg-gradapp-primary hover:bg-gradapp-accent">
              Save Document
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleDownloadDocument(editingDocument, 'doc')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={() => setEditingDocument(null)}>
              Close
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={documentContent}
            onChange={(e) => setDocumentContent(e.target.value)}
            className="w-full h-full p-4 border rounded-lg resize-none font-mono text-sm"
            placeholder="Start writing your document here..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Templates</h2>
          <p className="text-gray-600">Professional templates for graduate school applications</p>
        </div>
        <Button onClick={() => setActiveTab('my-documents')} className="bg-gradapp-primary hover:bg-gradapp-accent">
          <Plus className="h-4 w-4 mr-2" />
          My Documents
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="my-documents">My Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 flex-1">
                      <div className="text-2xl">{getFileIcon(template.fileType)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight mb-1">{template.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="text-xs bg-purple-100 text-purple-800">
                      Template
                    </Badge>
                    {template.field !== 'all-fields' && (
                      <Badge variant="outline" className="text-xs">{template.field}</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{template.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{template.rating}</span>
                        </div>
                      </div>
                      <span>{template.lastUpdated}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownloadDocument(template, 'doc')}
                        title="Download as Word document"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-documents" className="space-y-6">
          {userDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Documents Yet</h3>
              <p className="text-gray-500 mb-4">Start by using a template from the Templates tab</p>
              <Button onClick={() => setActiveTab('templates')}>
                Browse Templates
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {userDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 flex-1">
                        <div className="text-2xl">{getFileIcon(doc.fileType)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{doc.title}</h3>
                          <p className="text-xs text-gray-600">{doc.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={`text-xs w-fit ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditDocument(doc)} className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownloadDocument(doc, 'doc')}
                        title="Download document"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentLibrary;