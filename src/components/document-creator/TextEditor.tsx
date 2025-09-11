
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Save, 
  Download, 
  Eye, 
  Clock,
  AlignLeft,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

interface TextEditorProps {
  documentType: 'sop' | 'ps';
  universityName?: string;
  programName?: string;
  enhancedContent?: string;
  onSave?: (content: { title: string; content: string }) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  documentType, 
  universityName, 
  programName,
  enhancedContent,
  onSave 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(content.length);
  }, [content]);

  useEffect(() => {
    // Set default title based on document type and university
    if (!title) {
      const docTypeName = documentType === 'sop' ? 'Statement of Purpose' : 'Personal Statement';
      const defaultTitle = universityName 
        ? `${docTypeName} - ${universityName}`
        : docTypeName;
      setTitle(defaultTitle);
    }
  }, [documentType, universityName, title]);

  useEffect(() => {
    // Load enhanced content when it becomes available
    if (enhancedContent && enhancedContent !== content) {
      setContent(enhancedContent);
      toast({
        title: 'Enhanced Content Loaded',
        description: 'AI-enhanced content has been loaded into the editor.',
      });
    }
  }, [enhancedContent]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Cannot Save',
        description: 'Please provide both a title and content for your document.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Simulate save process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSaved(new Date());
      onSave?.({ title: title.trim(), content: content.trim() });
      
      toast({
        title: 'Document Saved',
        description: 'Your document has been saved successfully.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!content.trim()) {
      toast({
        title: 'Nothing to Download',
        description: 'Please write some content before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'Document Downloaded',
      description: 'Your document has been downloaded as a text file.',
    });
  };

  const handlePreview = () => {
    if (!content.trim()) {
      toast({
        title: 'Nothing to Preview',
        description: 'Please write some content before previewing.',
        variant: 'destructive',
      });
      return;
    }

    // Open preview in a new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                line-height: 1.6; 
                max-width: 8.5in; 
                margin: 0 auto; 
                padding: 1in;
                background: white;
              }
              h1 { 
                text-align: center; 
                margin-bottom: 2em;
                font-size: 18px;
                font-weight: bold;
              }
              p { 
                text-align: justify; 
                margin-bottom: 1em;
                text-indent: 0.5in;
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${content.split('\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('')}
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  const getPlaceholderText = () => {
    if (documentType === 'sop') {
      return universityName 
        ? `Begin writing your Statement of Purpose for ${universityName}...\n\nConsider addressing:\n• Your academic and research background\n• Why you're interested in this specific program\n• Your research goals and how they align with the faculty\n• Your career objectives and how this program fits into your plans`
        : `Begin writing your Statement of Purpose...\n\nConsider addressing:\n• Your academic and research background\n• Your research interests and goals\n• Why you're pursuing graduate study\n• Your career objectives`;
    } 
      return universityName
        ? `Begin writing your Personal Statement for ${universityName}...\n\nConsider sharing:\n• Your personal journey and what led you to this field\n• Significant experiences that shaped your interests\n• Challenges you've overcome and what you learned\n• What you hope to contribute to the university community`
        : `Begin writing your Personal Statement...\n\nConsider sharing:\n• Your personal journey and motivations\n• Significant experiences that shaped you\n• Your unique perspective and background\n• What drives your passion for this field`;
    
  };

  return (
    <div className="space-y-6">
      {/* Header with Context */}
      {universityName && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradapp-primary text-white">University-Specific</Badge>
            </div>
            <CardTitle className="text-lg">
              Writing for {universityName}
            </CardTitle>
            {programName && (
              <CardDescription>
                Program: {programName}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Editor Interface */}
      <Card className="border-2 border-gradapp-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-gradapp-primary" />
              <div>
                <CardTitle className="text-xl">
                  {documentType === 'sop' ? 'Statement of Purpose' : 'Personal Statement'} Editor
                </CardTitle>
                <CardDescription>
                  Write your document directly in the editor below
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="text-lg font-medium"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-3 w-3" />
            </Button>
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              title="Align Left"
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
          </div>

          {/* Text Editor */}
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholderText()}
              className="min-h-[500px] text-base leading-relaxed resize-none focus:ring-2 focus:ring-gradapp-primary border-2"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                lineHeight: '1.6',
              }}
            />
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!content.trim()}
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!content.trim()}
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || (!title.trim() || !content.trim())}
                className="bg-gradapp-primary hover:bg-gradapp-accent text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextEditor;
