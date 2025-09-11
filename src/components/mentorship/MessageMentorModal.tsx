
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  mentorField: string;
}

const MessageMentorModal: React.FC<MessageMentorModalProps> = ({
  isOpen,
  onClose,
  mentorName,
  mentorField
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate sending message
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${mentorName}.`,
      });
      setSubject('');
      setMessage('');
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message to {mentorName}</DialogTitle>
          <DialogDescription>
            Reach out to your mentor in {mentorField}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What would you like to discuss?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageMentorModal;
