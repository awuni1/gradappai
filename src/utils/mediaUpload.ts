import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaUploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export class MediaUploadService {
  private static instance: MediaUploadService;
  
  public static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  /**
   * Upload media file for posts
   */
  async uploadPostMedia(file: File, userId: string): Promise<MediaUploadResult | null> {
    try {
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 50MB.');
        return null;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'video/mp4',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported. Please upload images, videos, or documents.');
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${userId}/${timestamp}_${randomId}.${fileExt}`;

      // Show upload progress
      const uploadToast = toast.loading('Uploading media...');

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast.dismiss(uploadToast);
        
        if (error.message.includes('Storage bucket not found')) {
          toast.error('Storage not configured. Please deploy the database schema first.');
        } else {
          toast.error('Failed to upload media. Please try again.');
        }
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(data.path);

      toast.dismiss(uploadToast);
      toast.success('Media uploaded successfully!');

      return {
        url: publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
      return null;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], userId: string): Promise<MediaUploadResult[]> {
    const results: MediaUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadPostMedia(file, userId);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Validate and prepare files for upload
   */
  validateFiles(files: FileList | File[]): { valid: File[], invalid: { file: File, reason: string }[] } {
    const filesArray = Array.from(files);
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of filesArray) {
      // Check file size
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        invalid.push({ file, reason: 'File too large (max 50MB)' });
        continue;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'video/mp4',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        invalid.push({ file, reason: 'Unsupported file type' });
        continue;
      }

      valid.push(file);
    }

    return { valid, invalid };
  }

  /**
   * Get file type icon for display
   */
  getFileTypeIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType.startsWith('video/')) {
      return '🎥';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return '📝';
    }
    return '📎';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 Bytes';}
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create thumbnail for images
   */
  async createImageThumbnail(file: File, maxWidth = 300, maxHeight = 300): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and convert to data URL
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
export const mediaUploadService = MediaUploadService.getInstance();