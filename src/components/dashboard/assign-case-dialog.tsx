
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
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/firebase/auth-provider";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

interface AssignCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
  mode?: 'assign' | 'transfer' | 'add';
}

export function AssignCaseDialog({ open, onOpenChange, report, mode = 'assign' }: AssignCaseDialogProps) {
  const firestore = useFirestore();
  const { user, userData } = useAuth();
  
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['admin', 'officer']));
  }, [firestore]);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!usersQuery) return;
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    }, (error) => {
        console.error("Error fetching users:", error);
        const permissionError = new FirestorePermissionError({
          path: (usersQuery as any)._query.path.toString(),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [usersQuery]);

  const isTransferOrAdd = mode === 'transfer' || mode === 'add';

  const dialogTitle = mode === 'assign' ? 'Assign Case' : mode === 'transfer' ? 'Transfer Case' : 'Add Assignees';
  const dialogDescription = mode === 'assign' 
    ? "Select one or more case officers to investigate this report. The status will be changed to 'Case Officer Assigned'." 
    : mode === 'transfer' 
    ? "Select new case officers. The previous assignees will be replaced." 
    : "Select additional case officers to add to this report.";
  const buttonText = mode === 'assign' ? 'Assign Case' : mode === 'transfer' ? 'Transfer Case' : 'Add Assignees';
  const loadingButtonText = mode === 'assign' ? 'Assigning...' : mode === 'transfer' ? 'Transferring...' : 'Adding...';

  useEffect(() => {
    if (open) {
      if (mode === 'transfer' && report.assignees) {
        // Pre-select current assignees when transferring
        setSelectedUserIds(report.assignees.map(a => a.id));
      } else {
        setSelectedUserIds([]);
      }
      setSearchTerm('');
    }
  }, [report, open, mode]);
  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    const existingAssigneeIds = report.assignees?.map(a => a.id) || [];
    
    let availableUsers = users;

    // In add or transfer mode, filter out users who are already assigned
    if (mode === 'add' || mode === 'transfer') {
        availableUsers = users.filter(u => !existingAssigneeIds.includes(u.id));
    }
    
    if (searchTerm) {
        return availableUsers.filter(u => 
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    return availableUsers;

  }, [users, searchTerm, mode, report.assignees]);


  const handleUpdateAssignees = async () => {
    if (!firestore || !report.docId || !user || !userData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update assignees. Missing required information.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newSelection = users?.filter(u => selectedUserIds.includes(u.id)) || [];
      const reportRef = doc(firestore, 'reports', report.docId);
      
      let finalAssignees: User[] = [];
      let actionText = '';

      const newAssigneeData = newSelection.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          about: u.about
        }));
      
      if (mode === 'assign') {
        finalAssignees = newAssigneeData;
        actionText = `assigned the case to ${finalAssignees.map(a => a.name || a.email).join(', ')}`;
        await updateDoc(reportRef, { assignees: finalAssignees, status: 'Case Officer Assigned' });
      } else if (mode === 'transfer') {
        finalAssignees = newAssigneeData;
        actionText = `transferred the case to ${finalAssignees.map(a => a.name || a.email).join(', ')}`;
        await updateDoc(reportRef, { assignees: finalAssignees });
      } else if (mode === 'add') {
        const existingAssignees = report.assignees || [];
        const existingIds = existingAssignees.map(a => a.id);
        const trulyNewAssignees = newAssigneeData.filter(a => !existingIds.includes(a.id));
        finalAssignees = [...existingAssignees, ...trulyNewAssignees];
        actionText = `added ${trulyNewAssignees.map(a => a.name || a.email).join(', ')} to the case`;
        await updateDoc(reportRef, { assignees: finalAssignees });
      }


      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: userData.name || user.displayName || 'System'
        },
        action: actionText,
        timestamp: serverTimestamp()
      });
      
      toast({
        title: "Case Updated",
        description: `Case assignees have been updated successfully.`,
      });
      onOpenChange(false);
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
  
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const finalSelection = useMemo(() => {
     let selection = users?.filter(u => selectedUserIds.includes(u.id)) || [];
     if(mode === 'add' && report.assignees) {
        return [...report.assignees, ...selection]
     }
      if (mode === 'transfer') {
        return selection;
      }
     return selection;
  }, [users, selectedUserIds, mode, report.assignees]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <Input 
                placeholder="Search for user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                    {filteredUsers?.map(u => {
                        if (!u.id) return null;
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                             <Label
                                key={u.id}
                                htmlFor={`user-checkbox-${u.id}`}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                                <Checkbox
                                    id={`user-checkbox-${u.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleUserSelection(u.id)}
                                />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.avatarUrl} alt={u.name} />
                                    <AvatarFallback>{u.name ? u.name.charAt(0).toUpperCase() : u.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-medium">{u.name || u.email}</p>
                                    {u.name && u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                                </div>
                           </Label>
                        )
                    })}
                     {filteredUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No available users found.</p>}
                </div>
            </ScrollArea>
        </div>
        
        <div className="py-2">
          <p className="text-sm font-medium mb-2">Final Assignees:</p>
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {finalSelection.map(u => (
              <Badge key={u.id} variant="secondary">{u.name || u.email}</Badge>
            ))}
             {finalSelection.length === 0 && <p className="text-xs text-muted-foreground">No officers selected.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdateAssignees} disabled={isLoading || selectedUserIds.length === 0}>
            {isLoading ? loadingButtonText : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
