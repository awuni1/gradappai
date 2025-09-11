
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const RecentDocuments: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Documents</CardTitle>
        <CardDescription>Your recently created or modified draft documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No documents created yet</p>
          <p className="text-sm">Start by creating your first SOP or Personal Statement above</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentDocuments;
