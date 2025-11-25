
'use client';
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Shield, Tag, FileText, Bot, Clock, AlertTriangle, Users } from "lucide-react";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { Report, SharedReport } from "@/lib/types";
import { collection, doc, query, where, onSnapshot, getDoc } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function SharedReportPage({ params: { shareId } }: { params: { shareId: string } }) {
  const firestore = useFirestore();
  const [shareInfo, setShareInfo] = useState<SharedReport | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const shareQuery = query(collection(firestore, 'shared_reports'), where('id', '==', shareId));

    const unsubscribeShare = onSnapshot(shareQuery, (snapshot) => {
      if (snapshot.empty) {
        setError("This link is invalid or has been removed.");
        setLoading(false);
        return;
      }

      const shareData = snapshot.docs[0].data() as SharedReport;
      
      if (new Date() > shareData.expiresAt.toDate()) {
        setError("This link has expired.");
        setLoading(false);
        return;
      }
      
      setShareInfo(shareData);

      const reportRef = doc(firestore, 'reports', shareData.reportId);
      const unsubscribeReport = onSnapshot(reportRef, (docSnap) => {
        if (docSnap.exists()) {
          setReport({ docId: docSnap.id, ...docSnap.data() } as Report);
        } else {
          setReport(null);
        }
        setLoading(false);
      }, (reportError) => {
        console.error("Error fetching shared case:", reportError);
        const permissionError = new FirestorePermissionError({
          path: reportRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError("Could not load the case details.");
        setLoading(false);
      });

      return () => unsubscribeReport();

    }, (shareError) => {
      console.error("Error fetching share info:", shareError);
      setError("Could not verify the share link.");
      const permissionError = new FirestorePermissionError({
        path: 'shared_reports',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribeShare();
  }, [firestore, shareId]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50">
            <p>Loading case...</p>
        </div>
    )
  }
  
  if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
             <Card className="w-full max-w-lg text-center">
                 <CardHeader>
                     <CardTitle className="flex items-center justify-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Link Expired or Invalid
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error}</p>
                </CardContent>
             </Card>
        </div>
    )
  }

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-secondary/50">
       <header className="py-4 border-b bg-background">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold">Feedback Management Portal</span>
            </div>
            <p className="text-sm text-muted-foreground">Public Case View</p>
        </div>
       </header>
        <main className="container mx-auto max-w-3xl py-12 px-4">
            <div className="space-y-6">
                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
                    <Clock className="h-5 w-5"/>
                    <p className="text-sm">This is a secure, read-only view. This link will expire on {format(shareInfo!.expiresAt.toDate(), "PPPp")}.</p>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={report.severity === 'High' ? 'destructive' : report.severity === 'Medium' ? 'secondary' : 'default'} className="capitalize">{report.severity} Severity</Badge>
                    </div>
                    <h1 className="font-headline text-4xl font-bold">{report.title}</h1>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                        <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {report.content}
                        </p>
                        </CardContent>
                    </Card>
                    
                    </div>

                    <div className="space-y-6">
                    <Card>
                        <CardHeader>
                        <CardTitle>Case Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Status</span>
                            <span className="font-medium capitalize">{report.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Submitted</span>
                            <span>{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4"/>Category</span>
                            <span className="font-medium">{report.category}</span>
                        </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Assignees</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {report.assignees && report.assignees.length > 0 ? (
                            <div className="space-y-4">
                                {report.assignees.map(assignee => (
                                    <div key={assignee.id} className="flex items-center space-x-4">
                                        <Avatar>
                                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                            <AvatarFallback>{assignee.name ? assignee.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium leading-none">{assignee.name || assignee.email}</p>
                                            {assignee.name && assignee.email && <p className="text-sm text-muted-foreground">{assignee.email}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">Unassigned</div>
                        )}
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}
