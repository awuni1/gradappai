import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CVUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  className?: string;
}

interface CVUploadStatus {
  status: 'idle' | 'uploading' | 'uploaded' | 'failed';
  fileUrl?: string;
  error?: string;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const CVUpload: React.FC<CVUploadProps> = ({
  file,
  onFileSelect,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<CVUploadStatus>({ status: 'idle' });
  const { toast } = useToast();

  const validateFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a PDF or Word document (.pdf, .doc, .docx)'
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check minimum file size (empty or corrupted files)
    if (file.size < 1024) { // Less than 1KB
      return {
        isValid: false,
        error: 'File appears to be empty or too small. Please upload a valid CV document.'
      };
    }

    // Advanced file validation
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Check file signatures for corruption detection
      if (file.type === 'application/pdf') {
        // PDF files should start with %PDF
        const pdfSignature = new TextDecoder().decode(uint8Array.slice(0, 4));
        if (!pdfSignature.startsWith('%PDF')) {
          return {
            isValid: false,
            error: 'The uploaded file appears to be corrupted or is not a valid PDF.'
          };
        }
        
        // Check for password protection (simplified detection)
        const fileContent = new TextDecoder('latin1').decode(uint8Array);
        if (fileContent.includes('/Encrypt') || fileContent.includes('/U ') || fileContent.includes('/O ')) {
          return {
            isValid: false,
            error: 'This PDF is password-protected. Please upload an unprotected version.'
          };
        }
      }
      
      // Check for Word documents
      if (file.type.includes('word') || file.name.toLowerCase().endsWith('.docx')) {
        // DOCX files are ZIP archives, should start with PK
        if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) {
          // Valid DOCX signature
        } else if (file.name.toLowerCase().endsWith('.doc')) {
          // DOC files have different signature
          const docSignature = uint8Array.slice(0, 8);
          const validDocSignatures = [
            [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // Standard DOC
            [0x0D, 0x44, 0x4F, 0x43] // Some DOC variants
          ];
          
          const isValidDoc = validDocSignatures.some(signature => 
            signature.every((byte, index) => docSignature[index] === byte)
          );
          
          if (!isValidDoc) {
            return {
              isValid: false,
              error: 'The uploaded file appears to be corrupted or is not a valid Word document.'
            };
          }
        } else {
          return {
            isValid: false,
            error: 'The uploaded file does not appear to be a valid Word document.'
          };
        }
      }
      
      return { isValid: true };
      
    } catch (error) {
      console.error('File validation error:', error);
      return {
        isValid: false,
        error: 'Unable to validate the file. It may be corrupted or in an unsupported format.'
      };
    }
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    // Show validation in progress
    setUploadStatus({ status: 'uploading' });
    
    // Validate file with enhanced checks
    const validation = await validateFile(selectedFile);
    
    if (!validation.isValid) {
      setUploadStatus({ status: 'failed', error: validation.error });
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    // File is valid, proceed with upload
    onFileSelect(selectedFile);

    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔐 Auth check result:', { user: user?.id, error: userError });
      
      if (!user) {
        console.error('❌ No authenticated user found');
        throw new Error('Authentication required');
      }
      
      // Also check the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🎫 Session check result:', { 
        session: session?.access_token ? 'Valid' : 'None', 
        error: sessionError 
      });

      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/cv_${Date.now()}.${fileExt}`;

      console.log('📁 Uploading CV to Supabase storage:', fileName);

      // Upload file to Supabase storage (resumes bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get file path for storage reference (not public URL)
      const filePath = fileName;

      // Create CV analysis record using the correct schema fields
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('cv_analysis')
        .insert({
          user_id: user.id,
          // Use resume_id to link to storage file path
          resume_id: null, // Will be updated after processing
          // Store basic extracted info - will be updated by analysis
          field_of_study: null,
          education_level: null,
          experience_years: null,
          skills: null,
          strengths: null,
          improvement_areas: null,
          match_score: null,
          recommended_programs: null
        })
        .select()
        .single();

      if (analysisError) {
        // Clean up uploaded file if analysis record creation fails
        await supabase.storage.from('resumes').remove([fileName]);
        const errorMessage = analysisError?.message || analysisError?.details || JSON.stringify(analysisError) || 'Unknown database error';
        throw new Error(`CV analysis record creation failed: ${errorMessage}`);
      }

      console.log('✅ CV uploaded to storage and document record created:', analysisRecord);

      // Now trigger the actual CV analysis
      try {
        console.log('🧠 Starting CV analysis...');
        const analysisResult = await import('@/services/cvAnalysisService').then(
          module => module.cvAnalysisService.uploadAndAnalyzeCV(selectedFile, user.id)
        );
        
        if (analysisResult.success) {
          console.log('✅ CV analysis completed successfully');
        } else {
          console.warn('⚠️ CV analysis failed:', analysisResult.error);
        }
      } catch (analysisError) {
        console.error('❌ CV analysis error:', analysisError);
        // Don't fail the upload, just log the analysis error
      }

      setUploadStatus({ 
        status: 'uploaded', 
        fileUrl: filePath 
      });

      toast({
        title: 'Upload successful',
        description: 'Your CV has been uploaded and will be processed in the background.',
      });

    } catch (error) {
      console.error('❌ CV upload failed:', error);
      setUploadStatus({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
      
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload your CV. Please try again.',
        variant: 'destructive'
      });
    }
  }, [onFileSelect, toast]);


  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    setUploadStatus({ status: 'idle' });
    toast({
      title: 'File removed',
      description: 'Your CV has been removed.',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${
                isDragOver ? 'bg-blue-500' : 'bg-gray-100'
              }`}>
                <Upload className={`h-8 w-8 ${isDragOver ? 'text-white' : 'text-gray-500'}`} />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragOver ? 'Drop your CV here' : 'Upload your CV or Resume'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="relative"
                  disabled={uploadStatus.status === 'uploading'}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadStatus.status === 'uploading'}
                  />
                  {uploadStatus.status === 'uploading' ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                <p>Supported formats: PDF, DOC, DOCX</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>

            {uploadStatus.status === 'uploading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading your CV...</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-green-200 bg-green-50 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-medium text-green-900">
                    File uploaded successfully
                  </h4>
                </div>
                <p className="text-sm text-green-700 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Status Display */}
            {uploadStatus.status === 'failed' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <div className="flex items-start space-x-2">
                  <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700">
                    <p className="font-medium mb-1">Upload Failed</p>
                    <p>
                      {uploadStatus.error || 'Could not upload your CV. Please try again.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};