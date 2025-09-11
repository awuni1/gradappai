import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProfilePictureUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export interface ProfilePictureUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  quality?: number;
}

export class ProfilePictureService {
  private static instance: ProfilePictureService;
  
  public static getInstance(): ProfilePictureService {
    if (!ProfilePictureService.instance) {
      ProfilePictureService.instance = new ProfilePictureService();
    }
    return ProfilePictureService.instance;
  }

  private readonly DEFAULT_OPTIONS: Required<ProfilePictureUploadOptions> = {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 0.9
  };

  /**
   * Upload a profile picture for a user
   */
  async uploadProfilePicture(
    file: File, 
    userId: string, 
    options: ProfilePictureUploadOptions = {}
  ): Promise<ProfilePictureUploadResult | null> {
    try {
      const config = { ...this.DEFAULT_OPTIONS, ...options };
      
      console.log('🖼️ Starting profile picture upload for user:', userId);
      
      // Validate file
      const validation = this.validateProfileImage(file, config);
      if (!validation.isValid) {
        toast.error('Invalid file', { description: validation.error });
        return null;
      }

      // Show upload progress
      const uploadToast = toast.loading('Uploading profile picture...');

      try {
        // Process and resize image
        const processedFile = await this.processImage(file, config);
        
        // Delete old profile picture if exists
        await this.deleteOldProfilePicture(userId);

        // Generate unique filename
        const fileExt = this.getFileExtension(file.name);
        const timestamp = Date.now();
        const fileName = `${userId}/profile_${timestamp}.${fileExt}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(uploadData.path);

        console.log('✅ Profile picture uploaded successfully:', publicUrl);

        // Update user profile in database
        const updateResult = await this.updateUserProfileImage(userId, publicUrl);
        if (!updateResult.success) {
          // If database update fails, clean up the uploaded file
          await this.deleteProfilePicture(fileName);
          throw new Error(updateResult.error || 'Failed to update profile');
        }

        toast.dismiss(uploadToast);
        toast.success('Profile picture updated successfully!');

        return {
          url: publicUrl,
          fileName: uploadData.path,
          fileSize: processedFile.size
        };

      } catch (error: any) {
        toast.dismiss(uploadToast);
        console.error('❌ Error during upload process:', error);
        
        // Handle specific errors
        if (error.message?.includes('Storage bucket not found')) {
          toast.error('Storage not configured', {
            description: 'Please deploy the GRADNET database schema first.'
          });
        } else if (error.message?.includes('permission denied')) {
          toast.error('Permission denied', {
            description: 'You do not have permission to upload profile pictures.'
          });
        } else if (error.message?.includes('relation "user_profiles" does not exist')) {
          toast.error('Database not configured', {
            description: 'User profiles table is missing. Please deploy the database schema.'
          });
        } else {
          toast.error('Upload failed', {
            description: error.message || 'Please try again or contact support.'
          });
        }
        return null;
      }

    } catch (error) {
      console.error('❌ Unexpected error in uploadProfilePicture:', error);
      toast.error('Unexpected error occurred');
      return null;
    }
  }

  /**
   * Update user profile image URL in database
   */
  async updateUserProfileImage(userId: string, imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Updating user profile image in database:', { userId, imageUrl });

      // First, check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, profile_image_url')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing profile:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            profile_image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          return { success: false, error: updateError.message };
        }

        console.log('✅ Profile image updated successfully');
      } else {
        // Create new profile record
        console.log('📝 Creating new user profile record');
        
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            profile_image_url: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('✅ Profile created with image successfully');
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Unexpected error updating profile image:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current profile picture URL for a user
   */
  async getProfilePicture(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_image_url')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        console.error('Error fetching profile picture:', error);
        return null;
      }

      return data?.profile_image_url || null;
    } catch (error) {
      console.error('Error in getProfilePicture:', error);
      return null;
    }
  }

  /**
   * Delete old profile picture from storage
   */
  private async deleteOldProfilePicture(userId: string): Promise<void> {
    try {
      const currentImageUrl = await this.getProfilePicture(userId);
      if (!currentImageUrl) {return;}

      // Extract file path from URL
      const urlPath = new URL(currentImageUrl).pathname;
      const filePath = urlPath.split('/').slice(-2).join('/'); // Get userId/filename.ext

      if (filePath.startsWith(userId)) {
        await this.deleteProfilePicture(filePath);
        console.log('🗑️ Old profile picture deleted:', filePath);
      }
    } catch (error) {
      console.warn('⚠️ Could not delete old profile picture:', error);
      // Don't throw error - this is not critical
    }
  }

  /**
   * Delete a profile picture from storage
   */
  private async deleteProfilePicture(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('profiles')
      .remove([filePath]);

    if (error) {
      console.warn('Could not delete profile picture:', error);
    }
  }

  /**
   * Validate and prepare files for upload (public method for compatibility)
   */
  validateFiles(files: FileList | File[]): { valid: File[], invalid: { file: File, reason: string }[] } {
    const filesArray = Array.from(files);
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of filesArray) {
      const validation = this.validateProfileImage(file, this.DEFAULT_OPTIONS);
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, reason: validation.error || 'Invalid file' });
      }
    }

    return { valid, invalid };
  }

  /**
   * Validate profile image file
   */
  private validateProfileImage(file: File, options: Required<ProfilePictureUploadOptions>): 
    { isValid: boolean; error?: string } {
    
    // Check file size
    if (file.size > options.maxSizeBytes) {
      const maxSizeMB = options.maxSizeBytes / (1024 * 1024);
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB.`
      };
    }

    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload JPEG, PNG, or WebP images.'
      };
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'File must be an image.'
      };
    }

    return { isValid: true };
  }

  /**
   * Process and resize image
   */
  private async processImage(file: File, options: Required<ProfilePictureUploadOptions>): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Set maximum dimensions for profile pictures
          const maxWidth = 400;
          const maxHeight = 400;
          
          const { width, height } = img;

          // Calculate new dimensions (square crop from center)
          const minDimension = Math.min(width, height);
          const size = Math.min(minDimension, maxWidth);
          
          canvas.width = size;
          canvas.height = size;

          // Calculate crop position (center crop)
          const xOffset = (width - minDimension) / 2;
          const yOffset = (height - minDimension) / 2;

          // Draw image to canvas with center crop
          ctx?.drawImage(
            img, 
            xOffset, yOffset, minDimension, minDimension, // Source rectangle
            0, 0, size, size // Destination rectangle
          );

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(processedFile);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            'image/jpeg',
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  /**
   * Generate initials from display name
   */
  generateInitials(displayName?: string): string {
    if (!displayName) {return '?';}
    
    const names = displayName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
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
}

// Export singleton instance
export const profilePictureService = ProfilePictureService.getInstance();