
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalAdded: (goal: any) => void;
}

const SetGoalModal: React.FC<SetGoalModalProps> = ({
  isOpen,
  onClose,
  onGoalAdded
}) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState('Weekly');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const priorities = ['Low', 'Medium', 'High'];
  const categories = [
    'Application Preparation',
    'Research',
    'Personal Statement',
    'Test Preparation',
    'Networking',
    'Skill Development',
    'Other'
  ];
  const reminderOptions = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];

  const handleSetGoal = async () => {
    if (!goalTitle.trim() || !targetDate || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in goal title, target date, and category.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const newGoal = {
      id: Date.now(),
      title: goalTitle,
      description: goalDescription,
      targetDate: targetDate,
      priority,
      category,
      reminderFrequency,
      progress: 0,
      createdAt: new Date(),
      completed: false
    };

    // Simulate saving goal
    setTimeout(() => {
      onGoalAdded(newGoal);
      toast({
        title: "Goal Set Successfully!",
        description: `Your goal "${goalTitle}" has been added with ${reminderFrequency.toLowerCase()} reminders.`,
      });
      
      // Reset form
      setGoalTitle('');
      setGoalDescription('');
      setTargetDate(new Date());
      setPriority('Medium');
      setCategory('');
      setReminderFrequency('Weekly');
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Set New Goal
          </DialogTitle>
          <DialogDescription>
            Create a goal with timeline and reminders to track your progress
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalTitle">Goal Title</Label>
              <Input
                id="goalTitle"
                placeholder="e.g., Complete Personal Statement"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={category === cat ? "default" : "outline"}
                    className={`cursor-pointer ${category === cat ? "bg-gradapp-primary" : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <div className="flex gap-2 mt-2">
                {priorities.map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className={priority === p ? "bg-gradapp-primary" : ""}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="reminderFrequency">Reminder Frequency</Label>
              <div className="flex gap-2 mt-2">
                {reminderOptions.map((freq) => (
                  <Button
                    key={freq}
                    variant={reminderFrequency === freq ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReminderFrequency(freq)}
                    className={reminderFrequency === freq ? "bg-gradapp-primary" : ""}
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    {freq}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Calendar
                mode="single"
                selected={targetDate}
                onSelect={setTargetDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your goal and any specific milestones..."
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSetGoal}
            disabled={isLoading}
            className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
          >
            <Target className="w-4 h-4 mr-2" />
            {isLoading ? 'Setting Goal...' : 'Set Goal'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetGoalModal;
