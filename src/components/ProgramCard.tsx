
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Clock, MapPin, Star } from 'lucide-react';

export interface ProgramProps {
  id: string;
  title: string;
  university: string;
  location: string;
  deadline: string;
  duration: string;
  type: string;
  rating: number;
  imageUrl: string;
}

const ProgramCard: React.FC<ProgramProps> = ({
  title,
  university,
  location,
  deadline,
  duration,
  type,
  rating,
  imageUrl,
}) => {
  return (
    <Card className="overflow-hidden card-hover">
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={`${title} at ${university}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradapp-primary text-white">
            <Star className="h-3 w-3 mr-1 fill-current" />
            {rating.toFixed(1)}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{university}</p>
          </div>
          <Badge variant="outline" className="border-gradapp-secondary text-gradapp-secondary">
            {type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Deadline: {deadline}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{duration}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between gap-2">
        <Button variant="outline" size="sm" className="w-full">
          <BookOpen className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button size="sm" className="w-full bg-gradapp-primary hover:bg-gradapp-accent">
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
