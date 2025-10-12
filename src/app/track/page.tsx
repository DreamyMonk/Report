'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '@/firebase/client';


export default function TrackReportPage() {
  const [reportId, setReportId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleTrackReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!reportId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid ID',
        description: 'Please enter a valid report ID.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const db = getFirestore(app);
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('id', '==', reportId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        router.push(`/track/${reportId.toUpperCase()}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Report not found',
          description: 'Please check the ID and try again.',
        });
      }
    } catch (error) {
       toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not verify report ID. Please try again later.',
        });
       console.error(error)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold">Integrity Beacon</span>
          </Link>
          <h1 className="text-2xl font-bold">Track Your Report</h1>
          <p className="text-muted-foreground">Enter the unique ID you received upon submission.</p>
        </div>
        <form onSubmit={handleTrackReport}>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="report-id">Report ID</Label>
                <Input
                  id="report-id"
                  placeholder="e.g., IB-K5A8-9G3H1J"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  required
                  className="font-mono tracking-widest text-center"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Track Status'}
              </Button>
            </CardFooter>
          </Card>
        </form>
         <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
