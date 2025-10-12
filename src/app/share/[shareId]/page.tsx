
'use client';
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Shield, Tag, FileText, Bot, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { Report, SharedReport } from "@/lib/types";
import { collection, doc, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Logo } from "@/components/icons/logo";

export default function SharedReportPage({ params }: { params: { shareId: string } }) {
  const firestore = useFirestore();
  const router = useRouter();

  const shareQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shared_reports'), where('id', '==', params.shareId));
  }, [firestore, params.shareId]);

  const { data: shareData, loading: shareLoading } = useCollection<SharedReport>(shareQuery);
  const shareInfo = useMemo(() => shareData?.[0], [shareData]);
  
  const isExpired = shareInfo ? new Date() > shareInfo.expiresAt.toDate() : false;

  const reportRef = useMemo(() => {
    if (!firestore || !shareInfo?.reportId || isExpired) return null;
    return doc(firestore, 'reports', shareInfo.reportId);
  }, [firestore, shareInfo, isExpired]);

  const { data: report, loading: reportLoading } = useDoc<Report>(reportRef);
  
  const loading = shareLoading || reportLoading;
  
  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50">
            <p>Loading report...</p>
        </div>
    )
  }
  
  if (!shareInfo || isExpired) {
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
                    <p className="text-muted-foreground">The link you are trying to access is either invalid or has expired. Please request a new link from the case manager.</p>
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
              <span className="font-headline text-xl font-bold">Integrity Beacon</span>
            </div>
            <p className="text-sm text-muted-foreground">Public Report View</p>
        </div>
       </header>
        <main className="container mx-auto max-w-3xl py-12 px-4">
            <div className="space-y-6">
                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
                    <Clock className="h-5 w-5"/>
                    <p className="text-sm">This is a secure, read-only view. This link will expire on {format(shareInfo.expiresAt.toDate(), "PPPp")}.</p>
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
                        <CardTitle>Report Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {report.content}
                        </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-6 w-6 text-primary" />
                            AI-Powered Analysis
                        </CardTitle>
                        <CardDescription>
                            Automated summary and risk assessment generated by Integrity Beacon AI.
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Summary</h3>
                            <p className="text-sm text-muted-foreground">{report.aiSummary}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Risk Assessment</h3>
                            <p className="text-sm text-muted-foreground">{report.aiRiskAssessment}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Reasoning</h3>
                            <p className="text-sm text-muted-foreground">{report.aiReasoning}</p>
                        </div>
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
                        <CardTitle>Assignee</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {report.assignee ? (
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarImage src={report.assignee.avatarUrl} alt={report.assignee.name} />
                                    <AvatarFallback>{report.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium leading-none">{report.assignee.name}</p>
                                    <p className="text-sm text-muted-foreground">{report.assignee.email}</p>
                                </div>
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
