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
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/firebase/auth-provider";

interface AssignCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
}

export function AssignCaseDialog({ open, onOpenChange, report }: AssignCaseDialogProps) {
  const firestore = useFirestore();
  const { user } = useAuth();
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['admin', 'officer']));
  }, [firestore]);

  const { data: users } = useCollection<User>(usersQuery);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(report.assignee?.id);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAssignCase = async () => {
    if (!firestore || !report.docId || !selectedUserId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not assign case. Missing required information.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedUser = users?.find(u => u.id === selectedUserId);
      if (!selectedUser) {
        throw new Error("Selected user not found");
      }
      
      const reportRef = doc(firestore, 'reports', report.docId);
      
      await updateDoc(reportRef, {
        assignee: {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          avatarUrl: selectedUser.avatarUrl,
        },
        status: 'In Progress'
      });

      // Add to audit log
      const currentUser = users?.find(u => u.id === user.uid);
      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: currentUser?.name || user.displayName || 'System'
        },
        action: `assigned the case to ${selectedUser.name}`,
        timestamp: serverTimestamp()
      });
      
      toast({
        title: "Case Assigned",
        description: `Report has been assigned to ${selectedUser.name}.`,
      });
      onOpenChange(false);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Assignment Failed",
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
          <DialogTitle>Assign Case</DialogTitle>
          <DialogDescription>
            Select a case officer to investigate this report. The status will be changed to 'In Progress'.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
             <Select onValueChange={setSelectedUserId} defaultValue={selectedUserId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a case officer..." />
                </SelectTrigger>
                <SelectContent>
                    {users?.map(user => (
                         <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssignCase} disabled={isLoading || !selectedUserId}>
            {isLoading ? "Assigning..." : "Assign Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
