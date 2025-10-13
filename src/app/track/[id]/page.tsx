
'use client'
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Send, CheckCircle, Hourglass, FileText, XCircle, Shield, User, Calendar, Landmark, Building, Briefcase, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore } from "@/firebase";
import { Report, Message, CaseStatus } from "@/lib/types";
import { collection, doc, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

export default function TrackReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const reportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'), where('id', '==', id.toUpperCase()));
  }, [firestore, id]);
  
  const statusesQuery = useMemo(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'statuses'));
  }, [firestore]);

  const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsQuery);
  const { data: statuses } = useCollection<CaseStatus>(statusesQuery);
  
  const report = useMemo(() => reports?.[0], [reports]);

  const messagesQuery = useMemo(() => {
    if (!firestore || !report?.docId) return null;
    return query(collection(firestore, 'reports', report.docId, 'messages'), orderBy('sentAt', 'asc'));
  }, [firestore, report?.docId]);

  const { data: messages } = useCollection<Message>(messagesQuery);


 const handleSendMessage = () => {
    if (!message.trim() || !firestore || !report?.docId) return;

    const messagesCollection = collection(firestore, 'reports', report.docId, 'messages');
    
    addDoc(messagesCollection, {
        content: message,
        sentAt: serverTimestamp(),
        sender: 'reporter',
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: messagesCollection.path,
        operation: 'create',
        requestResourceData: { content: message },
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    setMessage('');
    toast({
        title: "Message sent!",
    });
};

  if (reportsLoading) {
    return <div className="text-center p-12">Loading report...</div>
  }

  if (!report) {
    notFound();
  }

  const statusInfo: { [key: string]: { icon: React.ElementType, text: string }} = {
    New: { icon: FileText, text: "Report submitted and pending review." },
    "In Progress": { icon: Hourglass, text: "An investigation is currently underway." },
    "Case Officer Assigned": { icon: UserCheck, text: "A case officer has been assigned and is reviewing the report." },
    Resolved: { icon: CheckCircle, text: "The investigation is complete and the case is closed." },
    Dismissed: { icon: XCircle, text: "The report has been reviewed and dismissed." },
    "Forwarded to Upper Management": { icon: Landmark, text: "This case has been forwarded for further review."}
  };

  const isCaseAssigned = report.assignees && report.assignees.length > 0;
  const isCaseClosed = report.status === 'Resolved' || report.status === 'Dismissed';
  
  const timelineStatus = isCaseAssigned ? "Case Officer Assigned" : "Report Submitted";
  const customStatus = (report.status !== 'New' && report.status !== 'In Progress' && report.status !== 'Case Officer Assigned') ? report.status : null;


  const currentStatusInfo = statusInfo[report.status] || { icon: Hourglass, text: "The status has been updated."};
  const CurrentStatusIcon = currentStatusInfo.icon;
  const currentStatusColor = statuses?.find(s => s.label === report.status)?.color || '#64748b';
  const isResolved = report.status === 'Resolved';

  return (
    <div className="min-h-screen bg-secondary/50">
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="mb-8 text-center">
                <h1 className="font-headline text-3xl font-bold tracking-tight">Report Status</h1>
                <p className="text-muted-foreground">Tracking ID: <span className="font-mono">{report.id}</span></p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="relative pl-6">
                              <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                              
                              {customStatus && (
                                <div className="relative mb-8">
                                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full" style={{backgroundColor: currentStatusColor}}></div>
                                  <div className="pl-6">
                                    <p className="font-semibold flex items-center gap-2"><CurrentStatusIcon className="h-4 w-4" />{customStatus}</p>
                                    <p className="text-sm text-muted-foreground">{statusInfo[customStatus]?.text || "The case has been updated."}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</p>
                                  </div>
                                </div>
                              )}
                              
                              {isCaseAssigned && (
                                <div className="relative mb-8">
                                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full" style={{backgroundColor: statuses?.find(s => s.label === 'In Progress')?.color || '#f97316' }}></div>
                                    <div className="pl-6">
                                    <p className="font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4" />Case Officer Assigned</p>
                                    <p className="text-sm text-muted-foreground">A case officer has been assigned and is reviewing the report.</p>
                                     <p className="text-xs text-muted-foreground mt-1">{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</p>
                                    </div>
                                </div>
                              )}
                              
                               <div className="relative">
                                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-border"></div>
                                <div className="pl-6">
                                  <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Report Submitted</p>
                                  <p className="text-sm text-muted-foreground">The initial report was received and is awaiting assignment.</p>
                                   <p className="text-xs text-muted-foreground mt-1">{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</p>
                                </div>
                              </div>
                           </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Communication Channel</CardTitle>
                            <CardDescription>{isResolved ? 'This case is resolved. The chat is closed.' : 'Securely communicate with the case officer. Your identity remains protected.'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <div className="h-96 overflow-y-auto pr-4 space-y-4 border rounded-md p-4 bg-background flex flex-col">
                                {messages?.map((msg) => (
                                     <div key={msg.docId} className={cn("flex items-end gap-3", msg.sender === 'reporter' ? 'justify-end' : 'justify-start')}>
                                        {msg.sender === 'officer' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={msg.senderInfo?.avatarUrl} />
                                                <AvatarFallback>{msg.senderInfo?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "p-3 rounded-lg max-w-[80%]",
                                            msg.sender === 'reporter' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                                        )}>
                                            {msg.sender === 'officer' && <p className="text-sm font-semibold mb-1">{msg.senderInfo?.name}</p>}
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={cn("text-xs mt-1 text-right", msg.sender === 'reporter' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                                {msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : 'sending...'}
                                            </p>
                                        </div>
                                        {msg.sender === 'reporter' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>
                                                    <User className="h-5 w-5"/>
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {(!messages || messages.length === 0) && <p className="text-center text-muted-foreground m-auto">No messages yet.</p>}
                                </div>

                                <div className="pt-4 space-y-3 border-t">
                                    <Textarea placeholder={isResolved ? "Chat is closed." : "Type your message..."} value={message} onChange={(e) => setMessage(e.target.value)} disabled={isResolved}/>
                                     <div className="flex justify-between items-center">
                                         <Button variant="outline" size="sm" asChild disabled={isResolved}>
                                             <Label htmlFor="file-upload"><FileUp className="mr-2 h-4 w-4"/> Attach File</Label>
                                         </Button>
                                         <Input id="file-upload" type="file" className="hidden" disabled={isResolved}/>
                                        <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || isResolved}>
                                            <Send className="mr-2 h-4 w-4"/>Send Message
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                             <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Status</span>
                                <span className="font-medium capitalize">{report.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Submitted</span>
                                <span>{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4"/>Severity</span>
                                <Badge variant={report.severity === 'High' ? 'destructive' : report.severity === 'Medium' ? 'secondary' : 'default'}>{report.severity}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Case Officers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.assignees && report.assignees.length > 0 ? (
                                report.assignees.map(assignee => (
                                    <div key={assignee.id} className="flex items-start space-x-4">
                                        <Avatar>
                                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                            <AvatarFallback>
                                              {assignee.name ? assignee.name.split(' ').map(n => n[0]).join('') : (assignee.email ? assignee.email.charAt(0).toUpperCase() : 'U')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-semibold">{assignee.name || assignee.email}</p>
                                            {assignee.designation && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {assignee.designation}</p>}
                                            {assignee.department && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building className="h-3 w-3" /> {assignee.department}</p>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Pending assignment</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}
