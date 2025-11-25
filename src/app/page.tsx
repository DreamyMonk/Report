
'use client'
import Link from 'next/link';
import { ReportSubmissionForm } from '@/components/forms/report-submission-form';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppContent } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { initializeData } from '@/lib/actions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Home() {
    const firestore = useFirestore();
    const [content, setContent] = useState<AppContent | null>(null);
    
    const contentRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'content', 'siteCopy');
    }, [firestore]);

    useEffect(() => {
      if (!contentRef) return;
      const unsubscribe = onSnapshot(contentRef, (docSnap) => {
        if (docSnap.exists()) {
          setContent(docSnap.data() as AppContent);
        }
      },
      (error) => {
          console.error("Error fetching content:", error);
          const permissionError = new FirestorePermissionError({
            path: contentRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      return () => unsubscribe();
    }, [contentRef]);


  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
        </Link>
        <div className="flex items-center gap-2">
           <Button asChild>
              <Link href="/track">View Submission</Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 bg-secondary/50 py-12">
        <div className="container mx-auto max-w-4xl space-y-12">
             <Card className="w-full">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Submit Feedback</CardTitle>
                    <CardDescription>
                    Your voice matters. Submit feedback securely. You can choose to submit anonymously or confidentially.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportSubmissionForm />
                </CardContent>
            </Card>
            <div className="space-y-6 pt-2">
                <h2 className="font-headline text-2xl font-bold text-center">How to Submit Good Feedback</h2>
                 <Card>
                    <CardContent className="p-6">
                         <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {content?.submissionGuidelines || 'Loading guidelines...'}
                        </div>
                    </CardContent>
                </Card>
                 <Alert variant="default" className="border-blue-500/50 text-blue-900 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        This form does not collect your IP address, If you choose "Confidential", your details will only be visible to the assigned case officer(s). To maintain full anonymity, avoid including details in your feedback that could inadvertently identify you.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Feedback Management. All rights reserved.
      </footer>
    </div>
  );
}
