
import React from 'react';
import ProgramCard, { ProgramProps } from './ProgramCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const FeaturedPrograms: React.FC = () => {
  // Mock data for featured programs
  const featuredPrograms: ProgramProps[] = [
    {
      id: '1',
      title: 'Master of Computer Science',
      university: 'Stanford University',
      location: 'Stanford, California',
      deadline: 'Dec 15, 2025',
      duration: '2 years',
      type: 'Full-time',
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    },
    {
      id: '2',
      title: 'MBA in Business Analytics',
      university: 'Harvard Business School',
      location: 'Cambridge, Massachusetts',
      deadline: 'Jan 5, 2026',
      duration: '2 years',
      type: 'Full-time',
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    },
    {
      id: '3',
      title: 'PhD in Artificial Intelligence',
      university: 'Massachusetts Institute of Technology',
      location: 'Cambridge, Massachusetts',
      deadline: 'Nov 1, 2025',
      duration: '4-5 years',
      type: 'Research',
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    },
  ];

  return (
    <section className="section-padding bg-slate-50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Programs</h2>
            <p className="text-muted-foreground max-w-2xl">
              Explore our handpicked selection of top graduate programs from prestigious institutions worldwide.
            </p>
          </div>
          <Button variant="link" className="text-gradapp-primary flex items-center mt-2 md:mt-0">
            View All Programs
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPrograms.map((program) => (
            <ProgramCard key={program.id} {...program} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPrograms;
