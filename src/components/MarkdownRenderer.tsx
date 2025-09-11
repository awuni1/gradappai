import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const formatContent = (text: string) => {
    if (!text) {return '';}
    
    return text
      // Clean up the text first
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Headers with beautiful styling
      .replace(/^# (.*$)/gim, '<div class="mb-6"><h1 class="text-3xl font-bold text-gray-900 mb-3 pb-3 border-b-3 border-blue-500">$1</h1></div>')
      .replace(/^## (.*$)/gim, '<div class="mb-4 mt-6"><h2 class="text-xl font-semibold text-gray-800 mb-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500 rounded-r-lg flex items-center"><span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">•</span>$1</h2></div>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-gray-700 mb-3 mt-5 flex items-center"><span class="w-2 h-6 bg-gray-400 mr-3"></span>$1</h3>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">$1</strong>')
      
      // Bullet points with beautiful icons
      .replace(/^• (.*$)/gim, '<div class="flex items-start mb-3 pl-2"><div class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div><span class="text-gray-700 leading-relaxed">$1</span></div>')
      .replace(/^- (.*$)/gim, '<div class="flex items-start mb-2 pl-2"><div class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-4 flex-shrink-0"></div><span class="text-gray-600 leading-relaxed">$1</span></div>')
      
      // Emojis with consistent spacing
      .replace(/(📍|🎓|📝|🎯|📋|📅|💰|🛂|📞|🏠|💡|✅|❌|⚠️|🌍|🎉|🏆|📊|🔍|📚|🖼️)/g, '<span class="inline-block mr-2 text-lg emoji-icon">$1</span>')
      
      // Convert line breaks to proper HTML
      .replace(/\n\n+/g, '</div><div class="mb-4"></div><div>')
      .replace(/\n/g, '<br />');
  };

  const formattedContent = `<div>${formatContent(content)}</div>`;

  return (
    <div 
      className={`prose prose-sm max-w-none university-guide-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};