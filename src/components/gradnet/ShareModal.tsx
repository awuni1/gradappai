// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Textarea } from '@/components/ui/textarea';
// import { 
//   Share2, 
//   Copy, 
//   ExternalLink,
//   MessageCircle,
//   Mail,
//   X,
//   CheckCircle,
//   Users,
//   Repeat,
//   Send
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { socialFeedService } from '@/services/socialFeedService';

// interface ShareModalProps {
//   postId: string;
//   postContent: string;
//   authorName: string;
//   isOpen: boolean;
//   onClose: () => void;
//   onShare: () => void;
//   userId: string;
//   onRepost?: (newPost: any) => void;
// }

// const ShareModal: React.FC<ShareModalProps> = ({ 
//   postId, 
//   postContent, 
//   authorName, 
//   isOpen, 
//   onClose, 
//   onShare,
//   userId,
//   onRepost
// }) => {
//   const [copied, setCopied] = useState(false);
//   const [repostContent, setRepostContent] = useState('');
//   const [reposting, setReposting] = useState(false);

//   if (!isOpen) {return null;}

//   const postUrl = `${window.location.origin}/gradnet/post/${postId}`;
//   const shareText = `Check out this post by ${authorName} on GradNet: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

//   const handleCopyLink = async () => {
//     try {
//       await navigator.clipboard.writeText(postUrl);
//       setCopied(true);
//       toast.success('Link copied to clipboard!');
//       setTimeout(() => setCopied(false), 2000);
//     } catch (error) {
//       console.error('Failed to copy link:', error);
//       toast.error('Failed to copy link');
//     }
//   };

//   const handleShareVia = (platform: string) => {
//     let shareUrl = '';
    
//     switch (platform) {
//       case 'twitter':
//         shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
//         break;
//       case 'linkedin':
//         shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
//         break;
//       case 'facebook':
//         shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
//         break;
//       case 'email':
//         shareUrl = `mailto:?subject=${encodeURIComponent('Check out this GradNet post')}&body=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
//         break;
//       case 'whatsapp':
//         shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
//         break;
//       default:
//         return;
//     }
    
//     window.open(shareUrl, '_blank', 'width=600,height=400');
//     onShare(); // Track the share
//     toast.success(`Shared via ${platform}!`);
//   };

//   const handleNativeShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: 'GradNet Post',
//           text: shareText,
//           url: postUrl,
//         });
//         onShare();
//         toast.success('Shared successfully!');
//       } catch (error) {
//         if (error.name !== 'AbortError') {
//           console.error('Error sharing:', error);
//         }
//       }
//     }
//   };

//   const handleRepost = async () => {
//     if (!userId) {return;}
    
//     setReposting(true);
//     try {
//       const newPost = await socialFeedService.createRepost(postId, userId, repostContent || undefined);
//       if (newPost && onRepost) {
//         onRepost(newPost);
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error reposting:', error);
//     } finally {
//       setReposting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <Card className="w-full max-w-md mx-4">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-lg flex items-center gap-2">
//               <Share2 className="h-5 w-5" />
//               Share Post
//             </CardTitle>
//             <Button variant="ghost" size="sm" onClick={onClose}>
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {/* Post Preview */}
//             <div className="bg-gray-50 rounded-lg p-3 border">
//               <p className="text-sm text-gray-600 mb-1">Sharing post by <strong>{authorName}</strong></p>
//               <p className="text-sm text-gray-800 line-clamp-3">
//                 {postContent.substring(0, 150)}{postContent.length > 150 ? '...' : ''}
//               </p>
//             </div>

//             {/* Copy Link */}
//             <div className="space-y-2">
//               <h4 className="font-medium text-sm text-gray-900">Copy Link</h4>
//               <div className="flex gap-2">
//                 <div className="flex-1 bg-gray-50 rounded border p-2 text-sm text-gray-600 truncate">
//                   {postUrl}
//                 </div>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={handleCopyLink}
//                   className={copied ? 'text-green-600 border-green-300' : ''}
//                 >
//                   {copied ? (
//                     <CheckCircle className="h-4 w-4" />
//                   ) : (
//                     <Copy className="h-4 w-4" />
//                   )}
//                 </Button>
//               </div>
//             </div>

//             {/* Internal Platform Sharing */}
//             <div className="space-y-2">
//               <h4 className="font-medium text-sm text-gray-900">Share on GradNet</h4>
//               <div className="space-y-3">
//                 <div className="bg-gray-50 rounded-lg p-3 border">
//                   <Textarea
//                     placeholder="Add your thoughts (optional)..."
//                     value={repostContent}
//                     onChange={(e) => setRepostContent(e.target.value)}
//                     className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm"
//                   />
//                 </div>
//                 <Button 
//                   onClick={handleRepost}
//                   disabled={reposting}
//                   className="w-full bg-gradapp-primary hover:bg-gradapp-accent"
//                 >
//                   {reposting ? (
//                     <>
//                       <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
//                       Sharing...
//                     </>
//                   ) : (
//                     <>
//                       <Repeat className="h-4 w-4 mr-2" />
//                       Share to Your Feed
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>

//             {/* Native Share (if supported) */}
//             {navigator.share && (
//               <div className="space-y-2">
//                 <h4 className="font-medium text-sm text-gray-900">Quick Share</h4>
//                 <Button 
//                   onClick={handleNativeShare}
//                   className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
//                 >
//                   <Share2 className="h-4 w-4 mr-2" />
//                   Share via Device
//                 </Button>
//               </div>
//             )}

//             {/* Social Platforms */}
//             <div className="space-y-2">
//               <h4 className="font-medium text-sm text-gray-900">Share to Social Media</h4>
//               <div className="grid grid-cols-2 gap-2">
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => handleShareVia('twitter')}
//                   className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
//                 >
//                   <div className="w-4 h-4 bg-blue-400 rounded"></div>
//                   Twitter/X
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => handleShareVia('linkedin')}
//                   className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-600"
//                 >
//                   <div className="w-4 h-4 bg-blue-600 rounded"></div>
//                   LinkedIn
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => handleShareVia('facebook')}
//                   className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-500"
//                 >
//                   <div className="w-4 h-4 bg-blue-500 rounded"></div>
//                   Facebook
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => handleShareVia('whatsapp')}
//                   className="flex items-center gap-2 hover:bg-green-50 hover:border-green-500"
//                 >
//                   <div className="w-4 h-4 bg-green-500 rounded"></div>
//                   WhatsApp
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => handleShareVia('email')}
//                   className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 col-span-2"
//                 >
//                   <Mail className="h-4 w-4" />
//                   Email
//                 </Button>
//               </div>
//             </div>

//             {/* Close Button */}
//             <div className="pt-2">
//               <Button variant="ghost" onClick={onClose} className="w-full">
//                 Close
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ShareModal;







import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Share2, 
  Copy, 
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  CheckCircle,
  Users,
  Repeat,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { socialFeedService } from '@/services/socialFeedService';

interface ShareModalProps {
  postId: string;
  postContent: string;
  authorName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  userId: string;
  onRepost?: (newPost: any) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  postId, 
  postContent, 
  authorName, 
  isOpen, 
  onClose, 
  onShare,
  userId,
  onRepost
}) => {
  const [copied, setCopied] = useState(false);
  const [repostContent, setRepostContent] = useState('');
  const [reposting, setReposting] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {return null;}

  const postUrl = `${window.location.origin}/gradnet/post/${postId}`;
  const shareText = `Check out this post by ${authorName} on GradNet: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleShareVia = (platform: string) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out this GradNet post')}&body=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onShare(); // Track the share
    toast.success(`Shared via ${platform}!`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GradNet Post',
          text: shareText,
          url: postUrl,
        });
        onShare();
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleRepost = async () => {
    if (!userId) {return;}
    
    setReposting(true);
    try {
      const newPost = await socialFeedService.createRepost(postId, userId, repostContent || undefined);
      if (newPost && onRepost) {
        onRepost(newPost);
        onClose();
      }
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setReposting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Post
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Post Preview */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-sm text-gray-600 mb-1">Sharing post by <strong>{authorName}</strong></p>
              <p className="text-sm text-gray-800 line-clamp-3">
                {postContent.substring(0, 150)}{postContent.length > 150 ? '...' : ''}
              </p>
            </div>

            {/* Copy Link */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Copy Link</h4>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded border p-2 text-sm text-gray-600 truncate">
                  {postUrl}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className={copied ? 'text-green-600 border-green-300' : ''}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Internal Platform Sharing */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Share on GradNet</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <Textarea
                    placeholder="Add your thoughts (optional)..."
                    value={repostContent}
                    onChange={(e) => setRepostContent(e.target.value)}
                    className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm"
                  />
                </div>
                <Button 
                  onClick={handleRepost}
                  disabled={reposting}
                  className="w-full bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  {reposting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Repeat className="h-4 w-4 mr-2" />
                      Share to Your Feed
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Native Share (if supported) */}
            {navigator.share && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900">Quick Share</h4>
                <Button 
                  onClick={handleNativeShare}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share via Device
                </Button>
              </div>
            )}

            {/* Social Platforms */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Share to Social Media</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareVia('twitter')}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  Twitter/X
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareVia('linkedin')}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-600"
                >
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareVia('facebook')}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-500"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareVia('whatsapp')}
                  className="flex items-center gap-2 hover:bg-green-50 hover:border-green-500"
                >
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareVia('email')}
                  className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 col-span-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareModal;