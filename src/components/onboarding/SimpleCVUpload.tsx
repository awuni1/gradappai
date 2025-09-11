import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SimpleCVUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  className?: string;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SimpleCVUpload: React.FC<SimpleCVUploadProps> = ({
  file,
  onFileSelect,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Quick basic validation only
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        error: 'Please upload a PDF, Word document, or text file'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    if (file.size < 100) {
      return {
        isValid: false,
        error: 'File appears to be empty'
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    console.log('📁 Onboarding CV file selected:', { 
      name: selectedFile.name, 
      size: selectedFile.size,
      sizeInMB: (selectedFile.size / 1024 / 1024).toFixed(2),
      type: selectedFile.type 
    });

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      console.error('❌ CV file validation failed:', validation.error);
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ CV file validation passed');
    onFileSelect(selectedFile);
    toast({
      title: 'CV selected',
      description: 'Your CV will be analyzed after completing your profile',
    });
  }, [onFileSelect, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    onFileSelect(null);
  }, [onFileSelect]);

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-green-50 border-2 border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-800">{file.name}</p>
              <p className="text-sm text-green-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Upload className="h-6 w-6 text-gray-400" />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900">Upload your CV</p>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop or click to select
          </p>
          <p className="text-xs text-gray-400 mt-2">
            PDF, Word, or text files up to 10MB
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="mt-4"
        >
          <FileText className="h-4 w-4 mr-2" />
          Choose File
        </Button>
      </div>
    </div>
  );
};