/**
 * Content Moderation Utility
 * Provides basic content filtering and moderation capabilities
 */

export interface ModerationResult {
  isClean: boolean;
  flaggedWords: string[];
  severity: 'low' | 'medium' | 'high';
  suggestedAction: 'allow' | 'flag' | 'block';
}

export interface PostCategorization {
  category: 'achievement' | 'question' | 'resource' | 'general' | 'event';
  confidence: number;
  suggestedTags: string[];
}

export class ContentModerationService {
  private static instance: ContentModerationService;
  
  // Lists of inappropriate content
  private readonly harmfulWords = [
    // Profanity
    'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron',
    // Harassment
    'hate', 'kill', 'die', 'suicide', 'murder',
    // Discriminatory
    'racist', 'sexist', 'bigot', 'nazi', 'fascist',
    // Spam indicators
    'click here', 'buy now', 'free money', 'guaranteed',
    // Academic dishonesty
    'cheat', 'plagiarize', 'copy homework', 'fake transcript',
    'buy essay', 'write my paper'
  ];

  private readonly spamWords = [
    'click here', 'buy now', 'free money', 'guaranteed income',
    'work from home', 'earn money fast', 'bitcoin', 'cryptocurrency',
    'investment opportunity', 'get rich quick'
  ];

  // Academic achievement indicators
  private readonly achievementKeywords = [
    'accepted', 'admission', 'scholarship', 'fellowship', 'award',
    'published', 'research', 'thesis', 'dissertation', 'graduated',
    'degree', 'phd', 'masters', 'conference', 'presentation',
    'internship', 'job offer', 'hired', 'promotion'
  ];

  // Question indicators
  private readonly questionKeywords = [
    'how', 'what', 'when', 'where', 'why', 'which', 'who',
    'help', 'advice', 'recommend', 'suggest', 'opinion',
    'experience', 'tips', 'guidance', 'should i', 'can you'
  ];

  // Resource indicators
  private readonly resourceKeywords = [
    'resource', 'tool', 'website', 'book', 'course', 'tutorial',
    'guide', 'link', 'pdf', 'download', 'free', 'available',
    'useful', 'helpful', 'template', 'example', 'sample'
  ];

  // Event indicators
  private readonly eventKeywords = [
    'event', 'conference', 'workshop', 'seminar', 'webinar',
    'meeting', 'deadline', 'date', 'registration', 'attend',
    'join', 'participate', 'invite', 'announcement'
  ];

  public static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService();
    }
    return ContentModerationService.instance;
  }

  /**
   * Moderate content for harmful language
   */
  moderateContent(content: string): ModerationResult {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);
    
    const flaggedWords: string[] = [];
    let highSeverityCount = 0;
    let mediumSeverityCount = 0;

    // Check for harmful words
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (this.harmfulWords.includes(cleanWord)) {
        flaggedWords.push(cleanWord);
        
        // Categorize severity
        if (['kill', 'die', 'suicide', 'murder', 'nazi', 'fascist'].includes(cleanWord)) {
          highSeverityCount++;
        } else if (['hate', 'racist', 'sexist', 'bigot'].includes(cleanWord)) {
          mediumSeverityCount++;
        }
      }
    }

    // Check for spam patterns
    for (const spamWord of this.spamWords) {
      if (lowerContent.includes(spamWord)) {
        flaggedWords.push(spamWord);
        mediumSeverityCount++;
      }
    }

    // Determine severity and action
    let severity: 'low' | 'medium' | 'high' = 'low';
    let suggestedAction: 'allow' | 'flag' | 'block' = 'allow';

    if (highSeverityCount > 0) {
      severity = 'high';
      suggestedAction = 'block';
    } else if (mediumSeverityCount > 1 || flaggedWords.length > 3) {
      severity = 'medium';
      suggestedAction = 'flag';
    } else if (flaggedWords.length > 0) {
      severity = 'low';
      suggestedAction = 'flag';
    }

    return {
      isClean: flaggedWords.length === 0,
      flaggedWords,
      severity,
      suggestedAction
    };
  }

  /**
   * Categorize post content automatically
   */
  categorizePost(content: string): PostCategorization {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);
    
    let achievementScore = 0;
    let questionScore = 0;
    let resourceScore = 0;
    let eventScore = 0;
    
    const suggestedTags: string[] = [];

    // Score each category
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (this.achievementKeywords.includes(cleanWord)) {
        achievementScore++;
        if (['scholarship', 'fellowship', 'accepted', 'published'].includes(cleanWord)) {
          suggestedTags.push(cleanWord);
        }
      }
      
      if (this.questionKeywords.includes(cleanWord)) {
        questionScore++;
      }
      
      if (this.resourceKeywords.includes(cleanWord)) {
        resourceScore++;
        if (['book', 'course', 'tutorial', 'guide'].includes(cleanWord)) {
          suggestedTags.push(cleanWord);
        }
      }
      
      if (this.eventKeywords.includes(cleanWord)) {
        eventScore++;
        if (['conference', 'workshop', 'webinar', 'deadline'].includes(cleanWord)) {
          suggestedTags.push(cleanWord);
        }
      }
    }

    // Check for question marks (strong indicator)
    if (content.includes('?')) {
      questionScore += 2;
    }

    // Check for academic terms
    const academicTerms = ['gre', 'gmat', 'toefl', 'ielts', 'sop', 'personal statement', 'recommendation letter'];
    for (const term of academicTerms) {
      if (lowerContent.includes(term)) {
        suggestedTags.push(term.replace(/\s+/g, ''));
      }
    }

    // Determine category and confidence
    const scores = {
      achievement: achievementScore,
      question: questionScore,
      resource: resourceScore,
      event: eventScore,
      general: 1 // Default baseline
    };

    const maxScore = Math.max(...Object.values(scores));
    const category = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as PostCategorization['category'];
    
    // Calculate confidence (0-1)
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.1;

    return {
      category,
      confidence,
      suggestedTags: [...new Set(suggestedTags)] // Remove duplicates
    };
  }

  /**
   * Extract and clean hashtags from content
   */
  extractHashtags(content: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = content.match(hashtagRegex);
    
    if (!matches) {return [];}
    
    return matches
      .map(tag => tag.substring(1).toLowerCase()) // Remove # and convert to lowercase
      .filter(tag => tag.length > 1 && tag.length < 50) // Reasonable length
      .filter(tag => !this.harmfulWords.includes(tag)) // Filter harmful hashtags
      .slice(0, 10); // Limit to 10 hashtags
  }

  /**
   * Generate trending hashtags based on recent posts
   */
  generateTrendingTopics(posts: any[]): { tag: string; count: number }[] {
    const tagCounts: Record<string, number> = {};
    
    // Count hashtag usage in recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const post of posts) {
      const postDate = new Date(post.created_at);
      if (postDate < sevenDaysAgo) {continue;}
      
      const tags = post.tags || [];
      for (const tag of tags) {
        const cleanTag = tag.toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      }
    }
    
    // Sort by count and return top trending
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Check if content appears to be spam
   */
  isSpam(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7) {return true;}
    
    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?.,]/g) || []).length / content.length;
    if (punctuationRatio > 0.3) {return true;}
    
    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {return true;}
    
    // Check for spam keywords
    let spamScore = 0;
    for (const spamWord of this.spamWords) {
      if (lowerContent.includes(spamWord)) {
        spamScore++;
      }
    }
    
    return spamScore >= 2;
  }

  /**
   * Sanitize content for display
   */
  sanitizeContent(content: string): string {
    // Remove potentially harmful scripts or HTML
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}

// Export singleton instance
export const contentModerationService = ContentModerationService.getInstance();