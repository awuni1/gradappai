import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailNotificationOptions {
  to: string;
  templateId: string;
  variables: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: Date;
  batchId?: string;
}

export interface EmailNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: 'sent' | 'queued' | 'failed' | 'bounced';
}

export interface EmailPreferences {
  sessionReminders: boolean;
  connectionRequests: boolean;
  newMessages: boolean;
  weeklyDigest: boolean;
  mentorshipUpdates: boolean;
  systemNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  unsubscribed: boolean;
}

class EmailNotificationService {
  private isEnabled = process.env.VITE_EMAIL_NOTIFICATIONS_ENABLED === 'true';
  private apiKey = process.env.VITE_EMAIL_API_KEY || '';
  private fromEmail = process.env.VITE_FROM_EMAIL || 'noreply@gradapp.com';
  private fromName = process.env.VITE_FROM_NAME || 'GradApp Mentorship Platform';
  
  // Email service provider configuration
  private emailProvider = process.env.VITE_EMAIL_PROVIDER || 'smtp'; // 'smtp', 'sendgrid', 'mailgun', 'ses'
  private templates = new Map<string, EmailTemplate>();
  
  constructor() {
    this.initializeTemplates();
  }

  // Initialize email templates
  private initializeTemplates(): void {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'session_reminder',
        name: 'Session Reminder',
        subject: 'Upcoming Mentorship Session: {{sessionTitle}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Session Reminder</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi {{mentorName}},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                This is a friendly reminder about your upcoming mentorship session:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #667eea;">{{sessionTitle}}</h3>
                <p><strong>Student:</strong> {{studentName}}</p>
                <p><strong>Date & Time:</strong> {{sessionDateTime}}</p>
                <p><strong>Duration:</strong> {{sessionDuration}}</p>
                {{#if meetingLink}}<p><strong>Meeting Link:</strong> <a href="{{meetingLink}}" style="color: #667eea;">Join Session</a></p>{{/if}}
                {{#if sessionNotes}}<p><strong>Notes:</strong> {{sessionNotes}}</p>{{/if}}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{sessionLink}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Session Details</a>
              </div>
              <p style="color: #777; font-size: 14px;">
                This session is scheduled for {{timeUntilSession}}. Make sure to prepare any materials or topics you want to discuss.
              </p>
            </div>
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                GradApp Mentorship Platform | 
                <a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        textContent: `
Hi {{mentorName}},

This is a reminder about your upcoming mentorship session:

Session: {{sessionTitle}}
Student: {{studentName}}
Date & Time: {{sessionDateTime}}
Duration: {{sessionDuration}}
{{#if meetingLink}}Meeting Link: {{meetingLink}}{{/if}}

{{#if sessionNotes}}Notes: {{sessionNotes}}{{/if}}

View session details: {{sessionLink}}

This session is scheduled for {{timeUntilSession}}.

---
GradApp Mentorship Platform
Unsubscribe: {{unsubscribeLink}}
        `,
        variables: ['mentorName', 'sessionTitle', 'studentName', 'sessionDateTime', 'sessionDuration', 'meetingLink', 'sessionNotes', 'sessionLink', 'timeUntilSession', 'unsubscribeLink']
      },
      {
        id: 'connection_request',
        name: 'New Mentorship Request',
        subject: 'New Mentorship Request from {{studentName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Mentorship Request</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi {{mentorName}},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                You have received a new mentorship request!
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  {{#if studentAvatar}}
                  <img src="{{studentAvatar}}" alt="{{studentName}}" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
                  {{/if}}
                  <div>
                    <h3 style="margin: 0; color: #667eea;">{{studentName}}</h3>
                    <p style="margin: 5px 0 0 0; color: #777;">{{studentLevel}} • {{studentField}}</p>
                  </div>
                </div>
                {{#if studentInstitution}}<p><strong>Institution:</strong> {{studentInstitution}}</p>{{/if}}
                {{#if requestMessage}}<p><strong>Message:</strong> "{{requestMessage}}"</p>{{/if}}
                {{#if studentInterests}}<p><strong>Research Interests:</strong> {{studentInterests}}</p>{{/if}}
                <p><strong>Compatibility Score:</strong> {{compatibilityScore}}%</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{acceptLink}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Accept Request</a>
                <a href="{{reviewLink}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Profile</a>
              </div>
              <p style="color: #777; font-size: 14px;">
                You can review the student's full profile and decide whether to accept this mentorship request.
              </p>
            </div>
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                GradApp Mentorship Platform | 
                <a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        textContent: `
Hi {{mentorName}},

You have received a new mentorship request from {{studentName}}!

Student: {{studentName}}
Level: {{studentLevel}} • {{studentField}}
{{#if studentInstitution}}Institution: {{studentInstitution}}{{/if}}
{{#if requestMessage}}Message: "{{requestMessage}}"{{/if}}
{{#if studentInterests}}Research Interests: {{studentInterests}}{{/if}}
Compatibility Score: {{compatibilityScore}}%

Accept Request: {{acceptLink}}
Review Profile: {{reviewLink}}

---
GradApp Mentorship Platform
Unsubscribe: {{unsubscribeLink}}
        `,
        variables: ['mentorName', 'studentName', 'studentLevel', 'studentField', 'studentInstitution', 'studentAvatar', 'requestMessage', 'studentInterests', 'compatibilityScore', 'acceptLink', 'reviewLink', 'unsubscribeLink']
      },
      {
        id: 'weekly_digest',
        name: 'Weekly Mentorship Digest',
        subject: 'Your Weekly Mentorship Summary',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Weekly Digest</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{weekRange}}</p>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi {{mentorName}},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Here's your weekly mentorship summary:
              </p>
              
              <!-- Stats -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0; color: #667eea; font-size: 24px;">{{sessionsCompleted}}</h3>
                  <p style="margin: 5px 0 0 0; color: #777; font-size: 14px;">Sessions Completed</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0; color: #28a745; font-size: 24px;">{{newConnections}}</h3>
                  <p style="margin: 5px 0 0 0; color: #777; font-size: 14px;">New Students</p>
                </div>
              </div>

              <!-- Upcoming Sessions -->
              {{#if upcomingSessions}}
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #667eea;">Upcoming Sessions</h3>
                {{#each upcomingSessions}}
                <div style="border-left: 3px solid #667eea; padding-left: 15px; margin-bottom: 15px;">
                  <p style="margin: 0; font-weight: bold;">{{title}}</p>
                  <p style="margin: 5px 0; color: #777;">{{studentName}} • {{dateTime}}</p>
                </div>
                {{/each}}
              </div>
              {{/if}}

              <!-- Recent Activity -->
              {{#if recentActivity}}
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #667eea;">Recent Activity</h3>
                {{#each recentActivity}}
                <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <p style="margin: 0;">{{description}}</p>
                  <p style="margin: 5px 0 0 0; color: #777; font-size: 14px;">{{timeAgo}}</p>
                </div>
                {{/each}}
              </div>
              {{/if}}

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
              </div>
            </div>
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                GradApp Mentorship Platform | 
                <a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        textContent: `
Hi {{mentorName}},

Here's your weekly mentorship summary for {{weekRange}}:

STATISTICS:
- Sessions Completed: {{sessionsCompleted}}
- New Students: {{newConnections}}

{{#if upcomingSessions}}
UPCOMING SESSIONS:
{{#each upcomingSessions}}
- {{title}} with {{studentName}} on {{dateTime}}
{{/each}}
{{/if}}

{{#if recentActivity}}
RECENT ACTIVITY:
{{#each recentActivity}}
- {{description}} ({{timeAgo}})
{{/each}}
{{/if}}

View Dashboard: {{dashboardLink}}

---
GradApp Mentorship Platform
Unsubscribe: {{unsubscribeLink}}
        `,
        variables: ['mentorName', 'weekRange', 'sessionsCompleted', 'newConnections', 'upcomingSessions', 'recentActivity', 'dashboardLink', 'unsubscribeLink']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Check if email notifications are available
  isAvailable(): boolean {
    return this.isEnabled && Boolean(this.apiKey);
  }

  // Get email preferences for a user
  async getEmailPreferences(userId: string): Promise<EmailPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        sessionReminders: true,
        connectionRequests: true,
        newMessages: true,
        weeklyDigest: true,
        mentorshipUpdates: true,
        systemNotifications: true,
        frequency: 'immediate',
        unsubscribed: false
      };
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      return null;
    }
  }

  // Update email preferences for a user
  async updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {throw error;}
      return true;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      return false;
    }
  }

  // Check if user should receive a specific type of email
  private async shouldSendEmail(userId: string, notificationType: keyof EmailPreferences): Promise<boolean> {
    const preferences = await this.getEmailPreferences(userId);
    
    if (!preferences || preferences.unsubscribed) {
      return false;
    }

    return preferences[notificationType] as boolean;
  }

  // Render template with variables
  private renderTemplate(template: EmailTemplate, variables: Record<string, any>): { subject: string; htmlContent: string; textContent: string } {
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // Simple template variable replacement (in production, use a proper template engine)
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      htmlContent = htmlContent.replace(regex, String(value || ''));
      textContent = textContent.replace(regex, String(value || ''));
    });

    // Handle conditional blocks (basic implementation)
    htmlContent = this.processConditionalBlocks(htmlContent, variables);
    textContent = this.processConditionalBlocks(textContent, variables);

    return { subject, htmlContent, textContent };
  }

  // Process conditional blocks like {{#if variable}}...{{/if}}
  private processConditionalBlocks(content: string, variables: Record<string, any>): string {
    // Simple implementation for {{#if variable}}...{{/if}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return content.replace(ifRegex, (match, variable, block) => {
      return variables[variable] ? block : '';
    });
  }

  // Send email notification
  async sendEmail(options: EmailNotificationOptions): Promise<EmailNotificationResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Email service not configured or disabled'
      };
    }

    try {
      // Get user ID from email (simplified - in production, this would be more robust)
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', options.to)
        .single();

      if (userError || !userData) {
        console.warn('User not found for email:', options.to);
      }

      const userId = userData?.id;

      // Check email preferences if user is found
      if (userId) {
        const notificationTypeMap: Record<string, keyof EmailPreferences> = {
          'session_reminder': 'sessionReminders',
          'connection_request': 'connectionRequests',
          'new_message': 'newMessages',
          'weekly_digest': 'weeklyDigest'
        };

        const notificationType = notificationTypeMap[options.templateId];
        if (notificationType && !(await this.shouldSendEmail(userId, notificationType))) {
          return {
            success: false,
            error: 'User has disabled this type of email notification'
          };
        }
      }

      // Get template
      const template = this.templates.get(options.templateId);
      if (!template) {
        return {
          success: false,
          error: `Template not found: ${options.templateId}`
        };
      }

      // Add unsubscribe link to variables
      const unsubscribeToken = userId ? this.generateUnsubscribeToken(userId) : '';
      const enhancedVariables = {
        ...options.variables,
        unsubscribeLink: `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
      };

      // Render template
      const { subject, htmlContent, textContent } = this.renderTemplate(template, enhancedVariables);

      // Send email based on provider
      const result = await this.sendEmailWithProvider({
        to: options.to,
        subject,
        htmlContent,
        textContent,
        priority: options.priority || 'normal',
        scheduleAt: options.scheduleAt
      });

      // Log email sent
      if (userId && result.success) {
        await this.logEmailSent(userId, options.templateId, result.messageId || '');
      }

      return result;

    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send email with configured provider
  private async sendEmailWithProvider(emailData: {
    to: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    priority: string;
    scheduleAt?: Date;
  }): Promise<EmailNotificationResult> {
    
    // For development/demo purposes, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.textContent.substring(0, 100) + '...'
      });
      
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        deliveryStatus: 'sent'
      };
    }

    // In production, implement actual email sending based on provider
    switch (this.emailProvider) {
      case 'sendgrid':
        return await this.sendWithSendGrid(emailData);
      case 'mailgun':
        return await this.sendWithMailgun(emailData);
      case 'ses':
        return await this.sendWithSES(emailData);
      default:
        return await this.sendWithSMTP(emailData);
    }
  }

  // Placeholder methods for different email providers
  private async sendWithSendGrid(emailData: any): Promise<EmailNotificationResult> {
    // Implement SendGrid integration
    throw new Error('SendGrid integration not implemented');
  }

  private async sendWithMailgun(emailData: any): Promise<EmailNotificationResult> {
    // Implement Mailgun integration
    throw new Error('Mailgun integration not implemented');
  }

  private async sendWithSES(emailData: any): Promise<EmailNotificationResult> {
    // Implement AWS SES integration
    throw new Error('AWS SES integration not implemented');
  }

  private async sendWithSMTP(emailData: any): Promise<EmailNotificationResult> {
    // Implement SMTP integration
    throw new Error('SMTP integration not implemented');
  }

  // Generate unsubscribe token
  private generateUnsubscribeToken(userId: string): string {
    // In production, use a proper JWT or signed token
    return btoa(`${userId}:${Date.now()}`);
  }

  // Log email sent for analytics
  private async logEmailSent(userId: string, templateId: string, messageId: string): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          template_id: templateId,
          message_id: messageId,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging email sent:', error);
    }
  }

  // Convenience methods for specific notification types
  async sendSessionReminder(mentorEmail: string, sessionData: any): Promise<EmailNotificationResult> {
    return this.sendEmail({
      to: mentorEmail,
      templateId: 'session_reminder',
      variables: sessionData,
      priority: 'high'
    });
  }

  async sendConnectionRequest(mentorEmail: string, requestData: any): Promise<EmailNotificationResult> {
    return this.sendEmail({
      to: mentorEmail,
      templateId: 'connection_request',
      variables: requestData,
      priority: 'normal'
    });
  }

  async sendWeeklyDigest(mentorEmail: string, digestData: any): Promise<EmailNotificationResult> {
    return this.sendEmail({
      to: mentorEmail,
      templateId: 'weekly_digest',
      variables: digestData,
      priority: 'low'
    });
  }

  // Get all available templates
  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  // Add or update a template
  setTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }
}

// Create singleton instance
const emailNotificationService = new EmailNotificationService();

export default emailNotificationService;