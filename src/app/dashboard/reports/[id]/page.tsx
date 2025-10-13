
'use client'
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, Calendar, User, Shield, Tag, FileText, EyeOff, Lock, Send, ChevronsUpDown, Phone, Share2, Users, UserPlus, Replace, Paperclip, Link as LinkIcon, Loader2, UploadCloud, FileX2, Fingerprint, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { Report, Message, User as AppUser, CaseStatus, Attachment } from "@/lib/types";
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { AssignCaseDialog } from "@/components/dashboard/assign-case-dialog";
import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "@/firebase/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ShareReportDialog } from "@/components/dashboard/share-report-dialog";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { getSignedR2Url } from "@/lib/actions";
import { CloseCaseDialog } from "@/components/dashboard/close-case-dialog";


export default function ReportDetailPage({ params: { id } }: { params: { id: string } }) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'transfer' | 'add'>('assign');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCloseCaseDialogOpen, setIsCloseCaseDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const firestore = useFirestore();
  const { userData, user } = useAuth();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<CaseStatus[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const reportRef = doc(firestore, 'reports', id);
    const unsubscribeReport = onSnapshot(reportRef, (docSnap) => {
      if (docSnap.exists()) {
        setReport({ docId: docSnap.id, ...docSnap.data() } as Report);
      } else {
        setReport(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching report:", error);
        const permissionError = new FirestorePermissionError({
          path: reportRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    const messagesCollection = collection(firestore, 'reports', id, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('sentAt', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
    }, (error) => {
        console.error("Error fetching messages:", error);
        const permissionError = new FirestorePermissionError({
          path: messagesCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    const statusesCollection = collection(firestore, 'statuses');
    const statusesQuery = query(statusesCollection, orderBy('label'));
    const unsubscribeStatuses = onSnapshot(statusesQuery, (querySnapshot) => {
        const statusList = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as CaseStatus));
        setStatuses(statusList);
    }, (error) => {
        console.error("Error fetching statuses:", error);
        const permissionError = new FirestorePermissionError({
          path: statusesCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
    const attachmentsCollection = collection(firestore, 'reports', id, 'attachments');
    const attachmentsQuery = query(attachmentsCollection, orderBy('uploadedAt', 'desc'));
    const unsubscribeAttachments = onSnapshot(attachmentsQuery, (querySnapshot) => {
        const atts = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Attachment));
        setAttachments(atts);
    }, (error) => {
        console.error("Error fetching attachments:", error);
        const permissionError = new FirestorePermissionError({
          path: attachmentsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    const usersCollection = collection(firestore, 'users');
    const unsubscribeUsers = onSnapshot(usersCollection, (querySnapshot) => {
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
        setAllUsers(usersList);
    }, (error) => {
        console.error("Error fetching users:", error);
        const permissionError = new FirestorePermissionError({ path: 'users', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    });


    return () => {
        unsubscribeReport();
        unsubscribeMessages();
        unsubscribeStatuses();
        unsubscribeAttachments();
        unsubscribeUsers();
    };

  }, [firestore, id]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUploadAttachment = async () => {
    if (!fileToUpload || !firestore || !report?.docId || !user || !userData) return;
    
    setIsUploading(true);
    
    try {
      const signedUrlResult = await getSignedR2Url(report.docId, fileToUpload.name, fileToUpload.type);
      
      if (!signedUrlResult.success || !signedUrlResult.url) {
        throw new Error(signedUrlResult.error || "Failed to get signed URL.");
      }
      
      const uploadResponse = await fetch(signedUrlResult.url, {
        method: "PUT",
        body: fileToUpload,
        headers: {
          "Content-Type": fileToUpload.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${await uploadResponse.text()}`);
      }

      const attachmentsCollection = collection(firestore, 'reports', report.docId, 'attachments');
      await addDoc(attachmentsCollection, {
        url: signedUrlResult.publicUrl,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        uploadedAt: serverTimestamp(),
        uploadedBy: {
          id: user.uid,
          name: userData.name || userData.email || 'Case Officer',
        }
      });
      
      toast({ title: "Attachment uploaded" });
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error: any) {
       console.error("Error uploading attachment:", error);
      toast({
          variant: 'destructive',
          title: "Upload Failed",
          description: error.message || "Could not upload attachment. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !firestore || !report?.docId || !user || !userData) return;

    setIsUploading(true); // Using this to disable send button
    
    try {
        const messagesCollection = collection(firestore, 'reports', report.docId, 'messages');
        const messagePayload: Omit<Message, 'docId' | 'sentAt'> = {
            content: message,
            sender: 'officer',
            senderInfo: {
                id: user.uid,
                name: userData.name || userData.email || 'Case Officer',
                avatarUrl: userData.avatarUrl || '',
            },
        };

        await addDoc(messagesCollection, {
            ...messagePayload,
            sentAt: serverTimestamp(),
        });
        setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      const permissionError = new FirestorePermissionError({
        path: `reports/${report.docId}/messages`,
        operation: 'create',
        requestResourceData: { content: message },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
          variant: 'destructive',
          title: "Send Failed",
          description: "Could not send message. Please try again.",
      });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSeverityChange = async (severity: "Low" | "Medium" | "High" | "Critical") => {
    if (!firestore || !report?.docId || !userData || !user) return;

    try {
      const reportRef = doc(firestore, 'reports', report.docId);
      await updateDoc(reportRef, { severity });

      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: { id: user.uid, name: userData.name },
        action: `changed severity from "${report.severity}" to "${severity}"`,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "Severity Updated",
        description: `Report severity changed to ${severity}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update severity.",
      });
    }
  };

  
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

  const selectableStatuses = useMemo(() => {
    if (!statuses) return [];
    // Exclude the final "Resolved" status and other obsolete statuses from the dropdown
    const excludedStatuses = ["Resolved", "New", "Case Closed"];
    return statuses.filter(s => !excludedStatuses.includes(s.label));
  }, [statuses]);


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
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize flex items-center gap-1">
                {isConfidential ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {report.submissionType}
            </Badge>
            </div>
            <h1 className="font-headline text-4xl font-bold break-words">{report.title}</h1>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button variant="destructive" onClick={() => setIsCloseCaseDialogOpen(true)} disabled={isResolved}>
                <FileX2 className="mr-2 h-4 w-4" /> Close Case
            </Button>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
        </div>
      </div>


      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
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
                    <div ref={chatContainerRef} className="h-96 overflow-y-auto pr-4 space-y-4 border rounded-md p-4 bg-secondary/50 flex flex-col">
                        {messages?.map((msg) => (
                            <div key={msg.docId} className={cn("flex items-end gap-3", msg.sender === 'officer' ? 'justify-end' : 'justify-start')}>
                                {msg.sender === 'reporter' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            <User className="h-5 w-5"/>
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "p-3 rounded-lg max-w-[80%]",
                                    msg.sender === 'officer' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                                )}>
                                    {msg.sender === 'officer' && <p className="text-sm font-semibold mb-1">{msg.senderInfo?.name || 'Case Officer'}</p>}
                                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                    <p className={cn("text-xs mt-1 text-right", msg.sender === 'officer' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                        {msg.sentAt ? format(msg.sentAt.toDate(), 'PPp') : 'sending...'}
                                    </p>
                                </div>
                                {msg.sender === 'officer' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={msg.senderInfo?.avatarUrl} />
                                        <AvatarFallback>{msg.senderInfo?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {(!messages || messages.length === 0) && <p className="text-center text-muted-foreground m-auto">No messages yet.</p>}
                    </div>

                    <div className="pt-4 space-y-3 border-t">
                        <Textarea placeholder={isResolved ? "Chat is closed." : "Type your message to the reporter..."} value={message} onChange={(e) => setMessage(e.target.value)} disabled={isResolved} />
                         <div className="flex justify-end items-center">
                            <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || isResolved || isUploading}>
                                <Send className="mr-2 h-4 w-4"/>
                                Send Message
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
                <span className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4"/>Case ID</span>
                <span className="font-medium font-mono">{report.caseId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Status</span>
                <Select
                  value={currentStatus?.docId}
                  onValueChange={handleStatusChange}
                  disabled={isResolved}
                >
                  <SelectTrigger
                    className="w-[160px] justify-between capitalize"
                    style={currentStatus ? { backgroundColor: currentStatus.color, color: '#fff' } : {}}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableStatuses?.map((status) => (
                      <SelectItem key={status.docId} value={status.docId!}>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                            {status.label}
                          </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4"/>Severity</span>
                <Select
                  value={report.severity}
                  onValueChange={(value: "Low" | "Medium" | "High" | "Critical") => handleSeverityChange(value)}
                  disabled={isResolved}
                >
                  <SelectTrigger
                    className={cn("w-[120px] justify-between capitalize",
                        report.severity === 'Critical' && 'bg-destructive text-destructive-foreground',
                        report.severity === 'High' && 'bg-orange-500 text-white',
                        report.severity === 'Medium' && 'bg-yellow-500 text-white',
                        report.severity === 'Low' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Critical">
                         <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            Critical
                          </div>
                      </SelectItem>
                      <SelectItem value="High">
                         <div className="flex items-center gap-2">
                            <ShieldX className="h-4 w-4 text-orange-500" />
                            High
                          </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                         <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-yellow-500" />
                            Medium
                          </div>
                      </SelectItem>
                      <SelectItem value="Low">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            Low
                          </div>
                      </SelectItem>
                  </SelectContent>
                </Select>
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
                  <span className="font-medium text-right break-all">{report.reporter.email}</span>
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
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none break-words">{assignee.name || assignee.email}</p>
                                {assignee.name && assignee.email && <p className="text-sm text-muted-foreground break-all">{assignee.email}</p>}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col gap-2 pt-4">
                        <Button variant="outline" className="w-full" onClick={() => openAssignDialog('transfer')} disabled={isResolved}>
                            <Replace className="mr-2 h-4 w-4" /> Transfer Case
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => openAssignDialog('add')} disabled={isResolved}>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Assignee
                        </Button>
                    </div>
                </div>
              ) : (
                <>
                    <div className="text-sm text-muted-foreground text-center py-4">Unassigned</div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => openAssignDialog('assign')} disabled={isResolved}>
                        Assign Case
                    </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Paperclip className="h-5 w-5" /> Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                 {attachments.map((att) => {
                    const uploaderIsReporter = att.uploadedBy.id === 'reporter';
                    const uploader = uploaderIsReporter ? null : allUsers.find(u => u.id === att.uploadedBy.id);

                    return (
                        <a 
                        key={att.docId}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                        >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={uploader?.avatarUrl} />
                            <AvatarFallback>
                                {uploaderIsReporter ? <User className="h-5 w-5"/> : uploader?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                Uploaded by {uploaderIsReporter ? 'Reporter' : att.uploadedBy.name}
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{att.uploadedAt ? format(att.uploadedAt.toDate(), "PP") : ''}</span>
                        </a>
                    )
                 })}
                  {attachments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No attachments found.</p>
                  )}
              </div>
              <div className="mt-4 pt-4 border-t">
                  <Label htmlFor="officer-file-upload" className="text-sm font-medium mb-2 block">Add Attachment</Label>
                   <div className="flex items-center gap-2">
                      <Input id="officer-file-upload" type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading || isResolved}/>
                      <Label htmlFor="officer-file-upload" className={cn("flex-grow min-w-0", !fileToUpload && "text-muted-foreground")}>
                          <div className="border-2 border-dashed rounded-md px-3 py-2 text-sm cursor-pointer text-center hover:bg-accent truncate">
                          {fileToUpload ? fileToUpload.name : 'Click to select a file'}
                          </div>
                      </Label>
                      <Button size="sm" onClick={handleUploadAttachment} disabled={!fileToUpload || isUploading || isResolved}>
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4"/>}
                          {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                  </div>
              </div>
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
       <CloseCaseDialog 
        open={isCloseCaseDialogOpen} 
        onOpenChange={setIsCloseCaseDialogOpen} 
        report={report} 
      />
    </div>
  );
}
