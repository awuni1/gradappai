import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CVProcessingService } from '../cvProcessingService';

// Mock Google AI with Vertex AI structure
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContentStream: vi.fn(() => Promise.resolve({
        async *[Symbol.asyncIterator]() {
          // Mock streaming response
          yield {
            text: JSON.stringify({
              personal_info: { name: 'John Doe', email: 'john@example.com' },
              education: [{ institution: 'Test University', degree: 'Bachelor', field: 'Computer Science' }],
              work_experience: [],
              skills: { technical_skills: ['JavaScript'], soft_skills: [], languages: [] },
              research: { publications: [], research_projects: [], conferences: [] },
              achievements: [],
              strengths: ['Strong technical background'],
              areas_for_improvement: ['Add more projects'],
              match_score: 0.75
            })
          };
        }
      }))
    }
  }))
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
                }))
              }))
            }))
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null }))
              }))
            }))
          }))
        }))
      })),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_VERTEX_AI_PROJECT: 'test-project',
    VITE_VERTEX_AI_LOCATION: 'global'
  }
});

describe('CVProcessingService', () => {
  let service: CVProcessingService;

  beforeEach(() => {
    service = new CVProcessingService();
  });

  describe('Text Cleaning', () => {
    it('should clean extracted text properly', () => {
      const dirtyText = '  This   is    a   test\n\n\n\nwith  bad   spacing  .  ';
      // Access private method for testing
      const cleanText = (service as any).cleanExtractedText(dirtyText);
      expect(cleanText).toBe('This is a test with bad spacing.');
    });

    it('should remove PDF artifacts', () => {
      const textWithArtifacts = 'Normal text ™ with © special ® characters';
      const cleanText = (service as any).cleanExtractedText(textWithArtifacts);
      expect(cleanText).toBe('Normal text with special characters');
    });
  });

  describe('Document Structure Detection', () => {
    it('should add structure markers to Word documents', () => {
      const plainText = `EDUCATION
University of Example
Computer Science

EXPERIENCE
Tech Company
Software Developer`;

      const structuredText = (service as any).addDocumentStructure(plainText);
      expect(structuredText).toContain('=== EDUCATION ===');
      expect(structuredText).toContain('=== EXPERIENCE ===');
    });

    it('should handle documents without clear structure', () => {
      const plainText = 'Just some random text without clear structure or headers.';
      const structuredText = (service as any).addDocumentStructure(plainText);
      expect(structuredText).toBe(plainText);
    });
  });

  describe('HTML to Text Conversion', () => {
    it('should convert HTML to clean text', () => {
      const html = '<p>This is <strong>bold</strong> text.</p><br><div>New section</div>';
      const text = (service as any).convertHtmlToText(html);
      expect(text).toContain('This is **bold** text.');
      expect(text).toContain('New section');
    });

    it('should handle lists properly', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const text = (service as any).convertHtmlToText(html);
      expect(text).toContain('• Item 1');
      expect(text).toContain('• Item 2');
    });
  });

  describe('Prompt Generation', () => {
    it('should generate proper prompt with document context', () => {
      const cvText = '=== PAGE 1 ===\nJohn Doe\nSoftware Engineer';
      const prompt = (service as any).generateAnalysisPrompt(cvText);
      
      expect(prompt).toContain('Document Type: PDF');
      expect(prompt).toContain('Multi-page: Yes');
      expect(prompt).toContain('Structure Detected: Yes');
      expect(prompt).toContain(cvText);
    });

    it('should detect Word document structure', () => {
      const cvText = '=== EDUCATION ===\nUniversity Name\n=== EXPERIENCE ===\nCompany Name';
      const prompt = (service as any).generateAnalysisPrompt(cvText);
      
      expect(prompt).toContain('Document Type: Word');
      expect(prompt).toContain('Structure Detected: Yes');
    });
  });

  describe('Vertex AI Response Processing', () => {
    it('should validate analysis result structure', () => {
      const validResult = {
        personal_info: {},
        education: [],
        work_experience: [],
        skills: { technical_skills: [], soft_skills: [], languages: [] },
        research: { publications: [], research_projects: [], conferences: [] },
        achievements: [],
        strengths: [],
        areas_for_improvement: [],
        match_score: 0.8
      };

      expect(() => (service as any).validateAnalysisResult(validResult)).not.toThrow();
    });

    it('should fix invalid match scores', () => {
      const invalidResult = {
        personal_info: {},
        education: [],
        work_experience: [],
        skills: { technical_skills: [], soft_skills: [], languages: [] },
        research: { publications: [], research_projects: [], conferences: [] },
        achievements: [],
        strengths: [],
        areas_for_improvement: [],
        match_score: 1.5 // Invalid score > 1
      };

      (service as any).validateAnalysisResult(invalidResult);
      expect(invalidResult.match_score).toBe(0.5); // Should be corrected to default
    });

    it('should throw error for missing required fields', () => {
      const incompleteResult = {
        personal_info: {},
        // Missing other required fields
      };

      expect(() => (service as any).validateAnalysisResult(incompleteResult)).toThrow();
    });

    it('should handle streaming response chunks correctly', async () => {
      const mockCvText = 'John Doe\nSoftware Engineer\nSkills: JavaScript, Python';
      
      const result = await service.processCVWithAI(mockCvText);
      
      expect(result).toHaveProperty('personal_info');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('match_score');
      expect(typeof result.match_score).toBe('number');
    });
  });

  describe('File Processing Integration', () => {
    it('should process CV with AI successfully', async () => {
      const mockCvText = 'John Doe\nSoftware Engineer\nSkills: JavaScript, Python';
      
      const result = await service.processCVWithAI(mockCvText);
      
      expect(result).toHaveProperty('personal_info');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('match_score');
      expect(typeof result.match_score).toBe('number');
    });

    it('should handle AI processing errors gracefully', async () => {
      // Mock a failing AI call
      const originalProcessCV = service.processCVWithAI;
      service.processCVWithAI = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const mockFile = new File(['fake content'], 'test.pdf', { type: 'application/pdf' });
      
      await expect(service.processCV(mockFile, 'test-user-id')).rejects.toThrow();
      
      // Restore original method
      service.processCVWithAI = originalProcessCV;
    });
  });

  describe('Statistics and Analytics', () => {
    it('should return null for failed stats query', async () => {
      const stats = await service.getCVAnalysisStats('test-user-id');
      expect(stats).toBeNull();
    });

    it('should return null for non-existent analysis', async () => {
      const analysis = await service.getLatestCVAnalysis('test-user-id');
      expect(analysis).toBeNull();
    });
  });
});

// Mock File APIs for browser environment testing
global.File = class File {
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;

  constructor(content: any[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
    this.content = new ArrayBuffer(content.join('').length);
    this.size = this.content.byteLength;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.content;
  }
} as any;

describe('File Type Detection', () => {
  it('should identify PDF files correctly', () => {
    const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    expect(pdfFile.type).toBe('application/pdf');
    expect(pdfFile.name).toBe('test.pdf');
  });

  it('should identify Word files correctly', () => {
    const docxFile = new File(['PK'], 'test.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    expect(docxFile.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(docxFile.name).toBe('test.docx');
  });

  it('should handle file size validation', () => {
    const largeFile = new File([new Array(11 * 1024 * 1024).fill('a')], 'large.pdf', { 
      type: 'application/pdf' 
    });
    expect(largeFile.size).toBeGreaterThan(10 * 1024 * 1024);
  });
});

describe('Document Content Scenarios', () => {
  const testDocuments = [
    {
      name: 'Academic CV',
      content: `
        John Doe
        Ph.D. Candidate in Computer Science
        University of Example
        
        EDUCATION
        Ph.D. Computer Science, University of Example, 2020-2024
        M.S. Computer Science, State University, 2018-2020
        
        RESEARCH EXPERIENCE
        Research Assistant, AI Lab, 2020-present
        
        PUBLICATIONS
        "Machine Learning Advances" - Journal of AI, 2023
      `,
      expectedFields: ['education', 'research', 'personal_info']
    },
    {
      name: 'Professional Resume',
      content: `
        Jane Smith
        Senior Software Engineer
        
        EXPERIENCE
        Senior Software Engineer, Tech Corp, 2020-2024
        Software Engineer, StartupCo, 2018-2020
        
        SKILLS
        JavaScript, Python, React, Node.js
        
        EDUCATION
        B.S. Computer Science, Tech University, 2014-2018
      `,
      expectedFields: ['work_experience', 'skills', 'education']
    },
    {
      name: 'Minimal CV',
      content: `
        Alex Johnson
        alex@email.com
        Recent Graduate
      `,
      expectedFields: ['personal_info']
    }
  ];

  testDocuments.forEach(({ name, content, expectedFields }) => {
    it(`should handle ${name} structure correctly`, async () => {
      const service = new CVProcessingService();
      const result = await service.processCVWithAI(content);
      
      expectedFields.forEach(field => {
        expect(result).toHaveProperty(field);
      });
      
      expect(result.match_score).toBeGreaterThanOrEqual(0);
      expect(result.match_score).toBeLessThanOrEqual(1);
    });
  });
});