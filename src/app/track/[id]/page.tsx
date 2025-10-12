'use client'
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Send, CheckCircle, Hourglass, FileText, XCircle, Shield, User, Calendar, FolderUp, Landmark } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore } from "@/firebase";
import { Report, Message, CaseStatus } from "@/lib/types";
import { collection, doc, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TrackReportDetailPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const reportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'), where('id', '==', params.id.toUpperCase()));
  }, [firestore, params.id]);
  
  const statusesQuery = useMemo(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'statuses'));
  }, [firestore]);

  const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsQuery);
  const { data: statuses } = useCollection<CaseStatus>(statusesQuery);
  
  const report = useMemo(() => reports?.[0], [reports]);

  const messagesQuery = useMemo(() => {
    if (!firestore || !report) return null;
    return query(collection(firestore, 'reports', report.docId!, 'messages'), orderBy('sentAt', 'asc'));
  }, [firestore, report]);

  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);

  const handleSendMessage = async () => {
    if (!message.trim() || !firestore || !report) return;

    try {
      await addDoc(collection(firestore, 'reports', report.docId!, 'messages'), {
        content: message,
        sentAt: serverTimestamp(),
        sender: 'reporter',
      });
      setMessage('');
      toast({
        title: "Message sent!",
      });
    } catch (error) {
      console.error("Error sending message: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      });
    }
  }

  if (reportsLoading) {
    return <div className="text-center p-12">Loading report...</div>
  }

  if (!report) {
    notFound();
  }

  const statusInfo: { [key: string]: { icon: React.ElementType, text: string }} = {
    New: { icon: FileText, text: "Report submitted and pending review." },
    "In Progress": { icon: Hourglass, text: "An investigation is currently underway." },
    Resolved: { icon: CheckCircle, text: "The investigation is complete and the case is closed." },
    Dismissed: { icon: XCircle, text: "The report has been reviewed and dismissed." },
    "Forwarded to Upper Management": { icon: Landmark, text: "This case has been forwarded for further review."}
  };

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
                              
                              <div className="relative mb-8">
                                <div className="absolute left-0 top-1 w-3 h-3 rounded-full" style={{backgroundColor: currentStatusColor}}></div>
                                <div className="pl-6">
                                  <p className="font-semibold flex items-center gap-2"><CurrentStatusIcon className="h-4 w-4" />{report.status}</p>
                                  <p className="text-sm text-muted-foreground">{currentStatusInfo.text}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</p>
                                </div>
                              </div>
                              
                               <div className="relative">
                                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-border"></div>
                                <div className="pl-6">
                                  <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Report Submitted</p>
                                  <p className="text-sm text-muted-foreground">The initial report was received.</p>
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
                               <div className="space-y-4 h-64 overflow-y-auto pr-4 border rounded-md p-4 bg-background">
                                {messagesLoading && <p>Loading messages...</p>}
                                {messages?.map((msg) => (
                                    msg.sender === 'reporter' ? (
                                      <div key={msg.docId} className="flex items-start gap-3 justify-end">
                                          <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-[80%]">
                                              <p className="text-sm">{msg.content}</p>
                                              <p className="text-xs text-primary-foreground/70 text-right mt-1">{msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : 'sending...'}</p>
                                          </div>
                                          <Avatar className="h-8 w-8">
                                              <AvatarFallback>
                                                  <User className="h-5 w-5"/>
                                              </AvatarFallback>
                                          </Avatar>
                                      </div>
                                    ) : (
                                      <div key={msg.docId} className="flex items-start gap-3">
                                          <Avatar className="h-8 w-8">
                                              <AvatarImage src={report.assignee?.avatarUrl} />
                                              <AvatarFallback>{report.assignee?.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="p-3 rounded-lg bg-secondary max-w-[80%]">
                                              <p className="text-sm font-semibold">{report.assignee?.name}</p>
                                              <p className="text-sm">{msg.content}</p>
                                              <p className="text-xs text-muted-foreground text-right mt-1">{msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : '...'}</p>
                                          </div>
                                      </div>
                                    )
                                ))}
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
                            <CardTitle>Assigned Case Officer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {report.assignee ? (
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarImage src={report.assignee.avatarUrl} />
                                        <AvatarFallback>{report.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{report.assignee.name}</p>
                                        <p className="text-xs text-muted-foreground">Case Officer</p>
                                    </div>
                                </div>
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
