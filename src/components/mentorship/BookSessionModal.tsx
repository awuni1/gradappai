
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  mentorField: string;
}

const BookSessionModal: React.FC<BookSessionModalProps> = ({
  isOpen,
  onClose,
  mentorName,
  mentorField
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const sessionTypes = [
    'General Mentoring',
    'Career Guidance',
    'Research Discussion',
    'Application Review',
    'Interview Preparation'
  ];

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !sessionType) {
      toast({
        title: "Missing Information",
        description: "Please select date, time, and session type.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate booking session
    setTimeout(() => {
      toast({
        title: "Session Booked!",
        description: `Your session with ${mentorName} has been scheduled for ${selectedDate.toDateString()} at ${selectedTime}.`,
      });
      setSelectedTime('');
      setSessionType('');
      setDescription('');
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Session with {mentorName}</DialogTitle>
          <DialogDescription>
            Schedule a mentoring session in {mentorField}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="time">Available Time Slots</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className={selectedTime === time ? "bg-gradapp-primary" : ""}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="sessionType">Session Type</Label>
              <div className="space-y-2 mt-2">
                {sessionTypes.map((type) => (
                  <Button
                    key={type}
                    variant={sessionType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSessionType(type)}
                    className={`w-full justify-start ${sessionType === type ? "bg-gradapp-primary" : ""}`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Additional Notes (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any specific topics you'd like to discuss?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleBookSession}
            disabled={isLoading}
            className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {isLoading ? 'Booking...' : 'Book Session'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSessionModal;
