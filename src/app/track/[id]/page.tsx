
'use client'
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle, Hourglass, FileText, XCircle, Shield, User, Calendar, Landmark, Building, Briefcase, UserCheck, Paperclip, Link as LinkIcon, Loader2, UploadCloud, ChevronDown, ChevronUp, Fingerprint } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFirestore } from "@/firebase";
import { Report, Message, CaseStatus, Attachment, User as AppUser } from "@/lib/types";
import { collection, doc, query, where, orderBy, addDoc, serverTimestamp, getDocs, onSnapshot } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { getSignedR2Url } from "@/lib/actions";

const ReadMore = ({ text, maxLength = 100 }: { text: string, maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) {
        return null;
    }

    const isLongText = text.length > maxLength;

    const toggle = () => setIsExpanded(!isExpanded);

    return (
        <div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {isExpanded || !isLongText ? text : `${text.substring(0, maxLength)}...`}
            </p>
            {isLongText && (
                <button onClick={toggle} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                    {isExpanded ? "Read Less" : "Read More"}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            )}
        </div>
    );
};


export default function TrackReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [message, setMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [statuses, setStatuses] = useState<CaseStatus[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const findReport = async () => {
      setLoading(true);
      const reportsCollection = collection(firestore, 'reports');
      const q = query(reportsCollection, where('id', '==', id.toUpperCase()));
      
      try {
        const reportSnapshot = await getDocs(q);
        if (!reportSnapshot.empty) {
            const reportDoc = reportSnapshot.docs[0];
            const reportData = { docId: reportDoc.id, ...reportDoc.data() } as Report;
            setReport(reportData);
        } else {
            setReport(null);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        const permissionError = new FirestorePermissionError({ path: `reports collection with id ${id}`, operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    findReport();

    const statusesCollection = collection(firestore, 'statuses');
    const statusesQuery = query(statusesCollection);
    const unsubscribeStatuses = onSnapshot(statusesQuery, (snapshot) => {
      const statusList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as CaseStatus));
      setStatuses(statusList);
    }, (error) => {
        console.error("Error fetching statuses:", error);
        const permissionError = new FirestorePermissionError({
          path: statusesCollection.path,
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
      unsubscribeStatuses();
      unsubscribeUsers();
    };
  }, [firestore, id]);

  useEffect(() => {
    if (!firestore || !report?.docId) return;

    const messagesCollection = collection(firestore, 'reports', report.docId, 'messages');
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
    
    const attachmentsCollection = collection(firestore, 'reports', report.docId, 'attachments');
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
    
    return () => {
      unsubscribeMessages();
      unsubscribeAttachments();
    }

  }, [firestore, report?.docId])


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
    if (!fileToUpload || !firestore || !report?.docId) return;
    
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
          id: 'reporter',
          name: 'Reporter',
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
    if (!message.trim() || !firestore || !report?.docId) return;
    
    setIsUploading(true); // Disable button
    try {
      const messagesCollection = collection(firestore, 'reports', report.docId, 'messages');
      const messagePayload: Omit<Message, 'docId' | 'sentAt'> = {
          content: message,
          sender: 'reporter',
      };
      
      await addDoc(messagesCollection, {
          ...messagePayload,
          sentAt: serverTimestamp(),
      });
      setMessage('');
    } catch(error) {
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

  if (loading) {
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
  
  const customStatus = (report.status !== 'New' && report.status !== 'In Progress' && report.status !== 'Case Officer Assigned') ? report.status : null;


  const currentStatusInfo = statusInfo[report.status] || { icon: Hourglass, text: "The status has been updated."};
  const CurrentStatusIcon = currentStatusInfo.icon;
  const currentStatusColor = statuses?.find(s => s.label === report.status)?.color || '#64748b';
  const isResolved = report.status === 'Resolved' || report.status === 'Dismissed';

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
                                <div ref={chatContainerRef} className="h-96 overflow-y-auto pr-4 space-y-4 border rounded-md p-4 bg-background flex flex-col">
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
                                            {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
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
                                    <Textarea placeholder={isResolved ? "Chat is closed." : "Type your message..."} value={message} onChange={(e) => setMessage(e.target.value)} disabled={isResolved} />
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

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4"/>Case ID</span>
                                <span className="font-medium font-mono text-right">{report.caseId}</span>
                            </div>
                             <div className="flex items-start justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/>Status</span>
                                <span className="font-medium capitalize text-right">{report.status}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Submitted</span>
                                <span className="text-right">{report.submittedAt ? format(report.submittedAt.toDate(), "PPP") : 'N/A'}</span>
                            </div>
                            <div className="flex items-start justify-between">
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
                                            {assignee.about && <ReadMore text={assignee.about} />}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Pending assignment</p>
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
                                  className="flex items-center gap-3 p-2 rounded-md bg-background hover:bg-muted transition-colors text-sm"
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
                                <p className="text-sm text-muted-foreground text-center py-4">No attachments uploaded.</p>
                              )}
                          </div>
                          <div className="mt-4 pt-4 border-t">
                              <Label htmlFor="reporter-file-upload" className="text-sm font-medium mb-2 block">Add Attachment</Label>
                               <div className="flex items-center gap-2">
                                  <Input id="reporter-file-upload" type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading || isResolved}/>
                                  <Label htmlFor="reporter-file-upload" className={cn("flex-grow min-w-0", !fileToUpload && "text-muted-foreground")}>
                                      <div className="border-2 border-dashed rounded-md px-3 py-2 text-sm cursor-pointer text-center hover:bg-muted truncate">
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
        </div>
    </div>
  );
}

    