import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    fileSize: number;
    fileName: string;
    fileType: string;
    parseMethod: 'pdf' | 'docx' | 'doc' | 'txt' | 'unknown';
  };
  sections?: {
    personalInfo?: string;
    education?: string;
    experience?: string;
    skills?: string;
    projects?: string;
    certifications?: string;
  };
}

export interface ParseError {
  code: string;
  message: string;
  details?: any;
}

class DocumentParserService {
  
  /**
   * Main parsing function that handles different file types
   */
  async parseDocument(file: File): Promise<{ data?: ParsedDocument; error?: ParseError }> {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 10MB limit'
          }
        };
      }

      // Determine file type and parse accordingly
      const fileType = this.getFileType(file);
      let parsedText = '';
      let pageCount: number | undefined;

      switch (fileType) {
        case 'pdf': {
          const pdfResult = await this.parsePDF(file);
          if (pdfResult.error) {return { error: pdfResult.error };}
          parsedText = pdfResult.text || '';
          pageCount = pdfResult.pageCount;
          break;
        }

        case 'docx': {
          const docxResult = await this.parseDocx(file);
          if (docxResult.error) {return { error: docxResult.error };}
          parsedText = docxResult.text || '';
          break;
        }

        case 'doc': {
          // For older .doc files, we'll try to parse as text or suggest conversion
          const docResult = await this.parseAsText(file);
          if (docResult.error) {return { error: docResult.error };}
          parsedText = docResult.text || '';
          break;
        }

        case 'txt': {
          const txtResult = await this.parseAsText(file);
          if (txtResult.error) {return { error: txtResult.error };}
          parsedText = txtResult.text || '';
          break;
        }

        default:
          return {
            error: {
              code: 'UNSUPPORTED_FORMAT',
              message: 'File format not supported. Please upload PDF, DOCX, DOC, or TXT files.'
            }
          };
      }

      // Clean and validate extracted text
      const cleanedText = this.cleanExtractedText(parsedText);
      if (cleanedText.length < 50) {
        return {
          error: {
            code: 'INSUFFICIENT_CONTENT',
            message: 'Document appears to be empty or contains insufficient text content'
          }
        };
      }

      // Extract sections from the text
      const sections = this.extractSections(cleanedText);

      // Create metadata
      const metadata = {
        pageCount,
        wordCount: cleanedText.split(/\s+/).length,
        characterCount: cleanedText.length,
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        parseMethod: fileType
      };

      return {
        data: {
          text: cleanedText,
          metadata,
          sections
        }
      };

    } catch (error) {
      console.error('Document parsing error:', error);
      return {
        error: {
          code: 'PARSE_FAILED',
          message: 'Failed to parse document',
          details: error
        }
      };
    }
  }

  /**
   * Parse PDF files using PDF.js for proper text extraction
   */
  private async parsePDF(file: File): Promise<{ text?: string; pageCount?: number; error?: ParseError }> {
    console.log('📄 Processing PDF file with PDF.js:', file.name);
    
    try {
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      const numPages = pdf.numPages;
      
      console.log(`📄 PDF loaded successfully: ${numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items from this page
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }
          
          console.log(`📄 Extracted ${pageText.length} characters from page ${pageNum}`);
        } catch (pageError) {
          console.warn(`⚠️ Error extracting text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      // Clean extracted text
      fullText = fullText
        .replace(/\s+/g, ' ')
        .replace(/[\r\n]+/g, '\n')
        .trim();
      
      console.log(`✅ Successfully extracted ${fullText.length} characters from ${numPages} pages`);
      
      if (fullText.length < 50) {
        return {
          error: {
            code: 'PDF_NO_TEXT_CONTENT',
            message: 'This PDF appears to be image-based or contains no extractable text. Please:\n\n• Use a PDF with selectable text\n• Convert to Word document (.docx)\n• Save as text file (.txt) with copy-paste'
          }
        };
      }
      
      return { 
        text: fullText,
        pageCount: numPages
      };
      
    } catch (error) {
      console.error('PDF.js parsing error:', error);
      return {
        error: {
          code: 'PDF_PARSE_FAILED',
          message: 'Failed to parse PDF file. The file may be corrupted or password-protected.',
          details: error
        }
      };
    }
  }

  /**
   * Parse DOCX files using mammoth
   */
  private async parseDocx(file: File): Promise<{ text?: string; error?: ParseError }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({
        arrayBuffer: arrayBuffer
      });

      // Check for conversion warnings
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX conversion warnings:', result.messages);
      }

      return {
        text: result.value
      };
    } catch (error) {
      console.error('DOCX parsing error:', error);
      return {
        error: {
          code: 'DOCX_PARSE_FAILED',
          message: 'Failed to parse DOCX file. The file may be corrupted.',
          details: error
        }
      };
    }
  }

  /**
   * Parse text files and legacy DOC files as plain text
   */
  private async parseAsText(file: File): Promise<{ text?: string; error?: ParseError }> {
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read file as text'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsText(file, 'utf-8');
      });

      return { text };
    } catch (error) {
      return {
        error: {
          code: 'TEXT_PARSE_FAILED',
          message: 'Failed to read file as text',
          details: error
        }
      };
    }
  }

  /**
   * Determine file type from file object
   */
  private getFileType(file: File): 'pdf' | 'docx' | 'doc' | 'txt' | 'unknown' {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Check by MIME type first
    if (mimeType === 'application/pdf') {return 'pdf';}
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {return 'docx';}
    if (mimeType === 'application/msword') {return 'doc';}
    if (mimeType === 'text/plain') {return 'txt';}

    // Check by file extension
    if (fileName.endsWith('.pdf')) {return 'pdf';}
    if (fileName.endsWith('.docx')) {return 'docx';}
    if (fileName.endsWith('.doc')) {return 'doc';}
    if (fileName.endsWith('.txt')) {return 'txt';}

    return 'unknown';
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove non-printable characters except common ones
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Extract sections from CV text using common patterns
   */
  private extractSections(text: string): ParsedDocument['sections'] {
    const sections: ParsedDocument['sections'] = {};

    // Common section headers (case insensitive)
    const sectionPatterns = {
      personalInfo: /(personal\s+information|contact\s+information|personal\s+details)/i,
      education: /(education|academic\s+background|qualifications)/i,
      experience: /(experience|work\s+experience|employment|professional\s+experience)/i,
      skills: /(skills|technical\s+skills|competencies|abilities)/i,
      projects: /(projects|research|publications)/i,
      certifications: /(certifications|certificates|awards|achievements)/i
    };

    // Split text into potential sections
    const lines = text.split('\n');
    let currentSection: keyof typeof sections | null = null;
    let sectionContent: string[] = [];

    for (const line of lines) {
      const lineContent = line.trim();
      if (!lineContent) {continue;}

      // Check if line matches any section header
      let foundSection: keyof typeof sections | null = null;
      for (const [sectionKey, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(lineContent)) {
          foundSection = sectionKey as keyof typeof sections;
          break;
        }
      }

      if (foundSection) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = foundSection;
        sectionContent = [];
      } else if (currentSection) {
        // Add content to current section
        sectionContent.push(lineContent);
      }
    }

    // Save last section
    if (currentSection && sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Validate if text appears to be a CV/Resume - more lenient validation
   */
  validateCVContent(text: string): { isValid: boolean; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    console.log('🔍 Validating CV content...', { textLength: text.length, preview: text.substring(0, 200) });

    // More comprehensive CV keyword patterns
    const cvKeywords = [
      { pattern: /\b(resume|curriculum\s+vitae|cv|portfolio)\b/i, name: 'CV header', points: 15 },
      { pattern: /\b(education|educational|academic|degree|university|college|school|bachelor|master|phd|diploma|gpa|grade|studying|student)\b/i, name: 'Education', points: 20 },
      { pattern: /\b(experience|work|employment|job|position|role|company|organization|employer|worked|intern|internship|volunteer)\b/i, name: 'Experience', points: 20 },
      { pattern: /\b(skills|skill|abilities|competencies|technical|programming|languages|proficient|experienced|familiar|knowledge)\b/i, name: 'Skills', points: 20 },
      { pattern: /\b(email|phone|telephone|mobile|address|contact|linkedin|github|website|portfolio|location|city|state)\b/i, name: 'Contact info', points: 15 },
      { pattern: /\b(project|research|publication|paper|article|certification|certificate|award|achievement|honor|scholarship)\b/i, name: 'Achievements', points: 15 },
      { pattern: /\b(manager|engineer|developer|analyst|consultant|director|coordinator|assistant|specialist|technician|architect|designer)\b/i, name: 'Job titles', points: 10 },
      { pattern: /\b(software|programming|coding|development|database|web|mobile|cloud|machine\s+learning|ai|artificial|data\s+science)\b/i, name: 'Technical terms', points: 10 },
      { pattern: /\b(led|managed|developed|created|implemented|designed|analyzed|collaborated|achieved|improved|increased|decreased)\b/i, name: 'Action verbs', points: 10 }
    ];

    cvKeywords.forEach(({ pattern, name, points }) => {
      const matches = text.match(pattern);
      if (matches) {
        const matchScore = Math.min(points, matches.length * 2); // Cap points but reward multiple matches
        score += matchScore;
        reasons.push(`Contains ${name} keywords (${matches.length} matches)`);
        console.log(`✅ Found ${name} keywords: ${matches.length} matches (+${matchScore} points)`);
      }
    });

    // Text length scoring (more generous)
    if (text.length > 100) {
      const lengthScore = Math.min(20, Math.floor(text.length / 50)); // Up to 20 points based on length
      score += lengthScore;
      reasons.push(`Adequate content length (${text.length} chars)`);
      console.log(`✅ Content length: ${text.length} chars (+${lengthScore} points)`);
    }

    // Enhanced date pattern recognition
    const datePatterns = [
      { pattern: /\b(19|20)\d{2}\b/g, name: 'Years', points: 5 },
      { pattern: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.-]+(19|20)\d{2}\b/gi, name: 'Month-Year dates', points: 8 },
      { pattern: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](19|20)?\d{2}\b/g, name: 'Date formats', points: 6 },
      { pattern: /\b(present|current|ongoing|now|today)\b/i, name: 'Current positions', points: 5 },
      { pattern: /\b(from|to|since|until|during|between)\s+(19|20)\d{2}\b/gi, name: 'Date ranges', points: 7 }
    ];
    
    datePatterns.forEach(({ pattern, name, points }) => {
      const matches = text.match(pattern);
      if (matches) {
        const dateScore = Math.min(points, matches.length); // Limit points per pattern type
        score += dateScore;
        reasons.push(`Contains ${name} (${matches.length} found)`);
        console.log(`✅ Found ${name}: ${matches.length} matches (+${dateScore} points)`);
      }
    });

    // Structure patterns (sections, formatting)
    const structurePatterns = [
      { pattern: /\n\s*[-•·]\s*/g, name: 'Bullet points', points: 5 },
      { pattern: /[A-Z][A-Z\s]{2,}:/g, name: 'Section headers', points: 8 },
      { pattern: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g, name: 'Proper names', points: 5 }, // Names, companies
      { pattern: /\b\d+[\+\-\s%]\b/g, name: 'Metrics/numbers', points: 3 }
    ];

    structurePatterns.forEach(({ pattern, name, points }) => {
      const matches = text.match(pattern);
      if (matches) {
        const structScore = Math.min(points, Math.ceil(matches.length / 2));
        score += structScore;
        reasons.push(`Contains ${name} formatting`);
        console.log(`✅ Found ${name}: ${matches.length} instances (+${structScore} points)`);
      }
    });

    // Much more lenient validation criteria
    const minScore = 15; // Reduced from 25
    const minLength = 150; // Reduced from 300
    
    const isValid = score >= minScore || text.length >= minLength;
    const confidence = Math.min(Math.max(score, 20), 100); // Ensure minimum confidence

    console.log(`📊 CV Validation Result: Score=${score}, Valid=${isValid}, Confidence=${confidence}%`);
    console.log(`📝 Reasons: ${reasons.join(', ')}`);

    if (!isValid) {
      console.warn(`❌ Document validation failed. Score: ${score}/${minScore}, Length: ${text.length}/${minLength}`);
      // Even if validation fails, we'll be more permissive in the actual flow
    } else {
      console.log(`✅ Document passed validation with ${reasons.length} positive indicators`);
    }

    // Force validation to pass if document has reasonable length (failsafe)
    if (!isValid && text.length > 200) {
      console.log('📋 Forcing validation pass due to adequate content length');
      return { 
        isValid: true, 
        confidence: 60, 
        reasons: [...reasons, 'Adequate content for analysis'] 
      };
    }

    return { isValid, confidence, reasons };
  }
}

// Export singleton instance
export const documentParserService = new DocumentParserService();
export default documentParserService;