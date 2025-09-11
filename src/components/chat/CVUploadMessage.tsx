import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'cv_upload' | 'universities_list' | 'cv_analysis' | 'file';
  metadata: Record<string, unknown>;
  created_at: string;
}

interface CVUploadMessageProps {
  message: Message;
}

export const CVUploadMessage: React.FC<CVUploadMessageProps> = ({ message }) => {
  const { metadata } = message;
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (metadata?.fileUrl) {
      window.open(metadata.fileUrl, '_blank');
    }
  };

  const handlePreview = () => {
    if (metadata?.fileUrl) {
      window.open(metadata.fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* File Information */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {metadata?.fileName || 'CV/Resume'}
          </div>
          <div className="text-sm text-gray-500">
            {metadata?.fileSize ? formatFileSize(metadata.fileSize) : 'Unknown size'}
            {metadata?.fileType && ` • ${metadata.fileType}`}
          </div>
        </div>
        <div className="flex gap-2">
          {metadata?.fileUrl && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreview}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="text-sm leading-relaxed">
        {message.content}
      </div>

      {/* Processing Status */}
      {metadata?.processingStatus && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          Status: {metadata.processingStatus}
        </div>
      )}
    </div>
  );
};