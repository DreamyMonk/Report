
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Report, User } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { collection, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase/auth-provider";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface CloseCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
}

export function CloseCaseDialog({ open, onOpenChange, report }: CloseCaseDialogProps) {
  const firestore = useFirestore();
  const { user, userData } = useAuth();
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCloseCase = async () => {
    if (!firestore || !report.docId || !user || !userData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not close case. Missing required information.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const reportRef = doc(firestore, 'reports', report.docId);
      
      // Update the report status to 'Resolved'
      await updateDoc(reportRef, { status: 'Resolved' });

      const finalMessage = `Case closed with the following remarks: ${remarks || 'No remarks provided.'}`;

      // Add the final remark as a message
      await addDoc(collection(firestore, 'reports', report.docId, 'messages'), {
        content: finalMessage,
        sender: 'officer',
        senderInfo: {
            id: user.uid,
            name: userData.name || userData.email || 'Case Officer',
            avatarUrl: userData.avatarUrl || '',
        },
        sentAt: serverTimestamp(),
      });
      
      // Add an audit log entry
      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: userData.name || user.displayName || 'System'
        },
        action: `closed the case and marked it as "Resolved"`,
        timestamp: serverTimestamp()
      });
      
      toast({
        title: "Case Closed",
        description: `The report has been marked as Resolved.`,
      });
      onOpenChange(false);
      setRemarks('');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close and Resolve Case</DialogTitle>
          <DialogDescription>
            You are about to mark this case as resolved. This action will close the communication channel. You can add final remarks below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <Label htmlFor="remarks">Closing Remarks (Optional)</Label>
            <Textarea
                id="remarks"
                placeholder="Enter any final comments or summary of the resolution..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[120px]"
            />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleCloseCase} disabled={isLoading}>
            {isLoading ? 'Closing...' : 'Mark as Resolved'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
