import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import { profilePictureService, ProfilePictureUploadResult } from '@/services/profilePictureService';

export interface ProfilePictureUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  displayName?: string;
  onUploadSuccess?: (result: ProfilePictureUploadResult) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | '2xl';
  showChangeButton?: boolean;
  disabled?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  userId,
  currentImageUrl,
  displayName,
  onUploadSuccess,
  onUploadError,
  className,
  size = 'xl',
  showChangeButton = true,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    console.log('🎯 File selected:', file.name, file.type, file.size);
    
    if (disabled) {
      console.log('❌ Upload disabled, ignoring file selection');
      return;
    }

    try {
      // Validate file
      console.log('🔍 Validating file...');
      const validation = profilePictureService.validateFiles([file]);
      
      if (validation.invalid.length > 0) {
        console.error('❌ File validation failed:', validation.invalid[0].reason);
        toast.error('Invalid file', {
          description: validation.invalid[0].reason
        });
        return;
      }

      console.log('✅ File validation passed');
      setSelectedFile(file);
      
      // Create preview URL
      console.log('🖼️ Creating preview...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewResult = e.target?.result as string;
        console.log('✅ Preview created:', previewResult ? 'success' : 'failed');
        setPreviewUrl(previewResult);
      };
      reader.onerror = (e) => {
        console.error('❌ Error creating preview:', e);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error in handleFileSelect:', error);
      toast.error('Error processing file', {
        description: 'Please try again or choose a different file.'
      });
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    if (disabled) {return;}

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    console.log('🚀 Starting upload process...', { 
      hasFile: Boolean(selectedFile), 
      userId, 
      disabled 
    });

    if (!selectedFile || disabled) {
      console.log('❌ Upload aborted: missing file or disabled');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Uploading file to storage...', selectedFile.name);
      const result = await profilePictureService.uploadProfilePicture(selectedFile, userId);
      
      console.log('📤 Upload result:', result);
      
      if (result) {
        console.log('✅ Upload successful, cleaning up UI...');
        setPreviewUrl(null);
        setSelectedFile(null);
        
        console.log('🔄 Calling onUploadSuccess callback...');
        onUploadSuccess?.(result);
        
        console.log('✅ Upload completed successfully!');
        toast.success('Profile picture updated successfully!');
      } else {
        console.error('❌ Upload failed: no result returned');
        onUploadError?.('Upload failed - no result returned');
        toast.error('Upload failed', {
          description: 'No result returned from upload service'
        });
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      const errorMessage = error.message || 'Failed to upload profile picture';
      onUploadError?.(errorMessage);
      toast.error('Upload failed', {
        description: errorMessage
      });
    } finally {
      console.log('🏁 Upload process finished, setting loading to false');
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const currentImage = previewUrl || currentImageUrl;
  const showPreview = selectedFile && previewUrl;

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar Display */}
      <div className="relative">
        <ProfileAvatar
          userId={userId}
          src={currentImage}
          displayName={displayName}
          size={size}
          loading={isUploading}
          onClick={showChangeButton ? openFileDialog : undefined}
        />

        {/* Upload overlay for drag and drop */}
        {showChangeButton && (
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 border-dashed transition-all duration-200',
              dragOver ? 'border-gradapp-primary bg-gradapp-primary/10' : 'border-transparent',
              !disabled && 'hover:border-gradapp-primary/50 hover:bg-gradapp-primary/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradapp-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-gradapp-primary" />
              </div>
            )}
          </div>
        )}

        {/* Camera icon overlay */}
        {showChangeButton && !isUploading && !dragOver && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 shadow-md border-2 border-white"
            onClick={openFileDialog}
            disabled={disabled}
          >
            <Camera className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview and Actions */}
      {showPreview && (
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>Ready to upload: {selectedFile.name}</span>
            <span className="text-gray-400">
              ({profilePictureService.formatFileSize(selectedFile.size)})
            </span>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || disabled}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {showChangeButton && !showPreview && !isUploading && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Click the camera icon or drag & drop to upload
          </p>
          <p className="text-xs text-gray-500">
            Supported: JPEG, PNG, WebP • Max size: 10MB
          </p>
        </div>
      )}

      {/* Change Picture Button (Alternative) */}
      {showChangeButton && !showPreview && !isUploading && (
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled}
          className="mt-2"
        >
          <Camera className="w-4 h-4 mr-2" />
          {currentImage ? 'Change Picture' : 'Upload Picture'}
        </Button>
      )}
    </div>
  );
};

export default ProfilePictureUpload;