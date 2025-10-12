
'use client'
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, Calendar, User, Shield, Tag, FileText, EyeOff, Lock, Send, ChevronsUpDown, Phone, Share2, Users, UserPlus, Replace } from "lucide-react";
import { format } from "date-fns";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { Report, Message, User as AppUser, CaseStatus } from "@/lib/types";
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { AssignCaseDialog } from "@/components/dashboard/assign-case-dialog";
import { useMemo, useState } from "react";
import { useAuth } from "@/firebase/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ShareReportDialog } from "@/components/dashboard/share-report-dialog";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'transfer' | 'add'>('assign');
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const firestore = useFirestore();
  const { userData, user } = useAuth();
  const { toast } = useToast();

  const reportRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'reports', params.id);
  }, [firestore, params.id]);
  
  const { data: report, loading } = useDoc<Report>(reportRef);

  const messagesQuery = useMemo(() => {
    if (!firestore || !report) return null;
    return query(collection(firestore, 'reports', report.docId!, 'messages'), orderBy('sentAt', 'asc'));
  }, [firestore, report]);
  
  const statusesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'statuses'), orderBy('label'));
  }, [firestore]);

  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  const { data: statuses } = useCollection<CaseStatus>(statusesQuery);

  const handleSendMessage = async () => {
    if (!message.trim() || !firestore || !report || !userData) return;

    try {
      await addDoc(collection(firestore, 'reports', report.docId!, 'messages'), {
        content: message,
        sentAt: serverTimestamp(),
        sender: 'officer',
        senderInfo: {
          id: userData.id,
          name: userData.name,
          avatarUrl: userData.avatarUrl
        }
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
  
  const handleStatusChange = async (statusId: string) => {
    if (!firestore || !report?.docId || !statuses || !userData || !user) return;
    const selectedStatus = statuses.find(s => s.docId === statusId);
    if (!selectedStatus) return;

    try {
      const reportRef = doc(firestore, 'reports', report.docId);
      await updateDoc(reportRef, {
        status: selectedStatus.label,
      });

      // Add to audit log
      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: userData.name,
        },
        action: `changed status from "${report.status}" to "${selectedStatus.label}"`,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "Status Updated",
        description: `Report status changed to ${selectedStatus.label}.`
      });
      setIsStatusPopoverOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update status.",
      });
    }
  };

  const openAssignDialog = (mode: 'assign' | 'transfer' | 'add') => {
    setAssignMode(mode);
    setIsAssignDialogOpen(true);
  }

  const currentStatus = useMemo(() => {
    return statuses?.find(s => s.label === report?.status);
  }, [statuses, report]);


  if (loading) {
    return <div>Loading...</div>
  }

  if (!report) {
    notFound();
  }

  const isConfidential = report.submissionType === 'confidential';
  const isResolved = report.status === 'Resolved';


  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2 mb-2">
            <Badge variant={report.severity === 'High' ? 'destructive' : report.severity === 'Medium' ? 'secondary' : 'default'} className="capitalize">{report.severity} Severity</Badge>
            <Badge variant="outline" className="capitalize flex items-center gap-1">
                {isConfidential ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {report.submissionType}
            </Badge>
            </div>
            <h1 className="font-headline text-4xl font-bold">{report.title}</h1>
        </div>
        <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
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

          <Card>
            <CardHeader>
                <CardTitle>Communication Channel</CardTitle>
                <CardDescription>{isResolved ? 'This case is resolved. The chat is closed.' : 'Communicate with the reporter. Your messages will appear with your name and role.'}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                   <div className="space-y-4 h-64 overflow-y-auto pr-4 border rounded-md p-4 bg-secondary/50">
                    {messagesLoading && <p>Loading messages...</p>}
                    {messages?.map((msg) => (
                        msg.sender === 'officer' ? (
                          <div key={msg.docId} className="flex items-start gap-3 justify-end">
                              <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-[80%]">
                                  <p className="text-sm font-semibold">{msg.senderInfo?.name || 'Case Officer'}</p>
                                  <p className="text-sm">{msg.content}</p>
                                  <p className="text-xs text-primary-foreground/70 text-right mt-1">{msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : 'sending...'}</p>
                              </div>
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.senderInfo?.avatarUrl} />
                                  <AvatarFallback>{msg.senderInfo?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                          </div>
                        ) : (
                          <div key={msg.docId} className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                      <User className="h-5 w-5"/>
                                  </AvatarFallback>
                              </Avatar>
                              <div className="p-3 rounded-lg bg-background max-w-[80%] border">
                                  <p className="text-sm font-semibold">Reporter</p>
                                  <p className="text-sm">{msg.content}</p>
                                  <p className="text-xs text-muted-foreground text-right mt-1">{msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : '...'}</p>
                              </div>
                          </div>
                        )
                    ))}
                    </div>

                    <div className="pt-4 space-y-3">
                        <Textarea placeholder={isResolved ? "Chat is closed." : "Type your message to the reporter..."} value={message} onChange={(e) => setMessage(e.target.value)} disabled={isResolved} />
                         <div className="flex justify-end">
                            <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || isResolved}>
                                <Send className="mr-2 h-4 w-4"/>Send Message
                            </Button>
                        </div>
                    </div>
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
                 <Popover open={isStatusPopoverOpen} onOpenChange={setIsStatusPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isStatusPopoverOpen}
                      className="w-[200px] justify-between capitalize"
                      style={currentStatus ? { backgroundColor: currentStatus.color, color: '#fff' } : {}}
                    >
                      {report.status}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search status..." />
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {statuses?.map((status) => (
                          <CommandItem
                            key={status.docId}
                            value={status.label}
                            onSelect={() => handleStatusChange(status.docId!)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                              {status.label}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Submitted</span>
                <span>{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground flex items-center gap-2 shrink-0"><Tag className="h-4 w-4"/>Category</span>
                <span className="font-medium text-right break-words">{report.category}</span>
              </div>
              {isConfidential && report.reporter?.name && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2 shrink-0"><User className="h-4 w-4"/>Reporter Name</span>
                  <span className="font-medium text-right break-words">{report.reporter.name}</span>
                </div>
              )}
               {isConfidential && report.reporter?.email && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2 shrink-0"><User className="h-4 w-4"/>Reporter Email</span>
                  <span className="font-medium text-right break-words">{report.reporter.email}</span>
                </div>
              )}
               {isConfidential && report.reporter?.phone && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground flex items-center gap-2 shrink-0"><Phone className="h-4 w-4"/>Reporter Phone</span>
                  <span className="font-medium text-right break-words">{report.reporter.phone}</span>
                </div>
              )}
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
                                <AvatarFallback>{assignee.name ? assignee.name.split(' ').map(n => n[0]).join('') : (assignee.email ? assignee.email.charAt(0).toUpperCase() : 'U')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium leading-none">{assignee.name || assignee.email}</p>
                                {assignee.name && assignee.email && <p className="text-sm text-muted-foreground">{assignee.email}</p>}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col gap-2 pt-4">
                        <Button variant="outline" className="w-full" onClick={() => openAssignDialog('transfer')}>
                            <Replace className="mr-2 h-4 w-4" /> Transfer Case
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => openAssignDialog('add')}>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Assignee
                        </Button>
                    </div>
                </div>
              ) : (
                <>
                    <div className="text-sm text-muted-foreground text-center py-4">Unassigned</div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => openAssignDialog('assign')}>
                        Assign Case
                    </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AssignCaseDialog 
        open={isAssignDialogOpen} 
        onOpenChange={setIsAssignDialogOpen} 
        report={report} 
        mode={assignMode}
      />
      <ShareReportDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} reportId={report.docId!} />
    </div>
  );
}
