
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
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/firebase/auth-provider";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface TransferCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
  mode: 'transfer' | 'add';
}

export function TransferCaseDialog({ open, onOpenChange, report, mode }: TransferCaseDialogProps) {
  const firestore = useFirestore();
  const { user, userData } = useAuth();
  
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['admin', 'officer']));
  }, [firestore]);

  const { data: users } = useCollection<User>(usersQuery);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const dialogTitle = mode === 'transfer' ? 'Transfer Case' : 'Add Assignee';
  const dialogDescription = mode === 'transfer' 
    ? "Select new case officers. The previous assignees will be replaced." 
    : "Select additional case officers to add to this report.";
  const buttonText = mode === 'transfer' ? 'Transfer Case' : 'Add Assignees';
  const loadingButtonText = mode === 'transfer' ? 'Transferring...' : 'Adding...';

  useEffect(() => {
    if (open) {
      if (mode === 'transfer') {
        setSelectedUserIds([]);
      } else {
        setSelectedUserIds(report.assignees?.map(a => a.id) || []);
      }
      setSearchTerm('');
    }
  }, [report, open, mode]);
  
  const availableUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users;
    if (mode === 'add') {
        const currentAssigneeIds = report.assignees?.map(a => a.id) || [];
        filtered = users.filter(u => !currentAssigneeIds.includes(u.id));
    }
    
    if (searchTerm) {
        return filtered.filter(u => 
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    return filtered;

  }, [users, report, mode, searchTerm]);


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
      const allSelectedUsers = users?.filter(u => selectedUserIds.includes(u.id)) || [];
      const reportRef = doc(firestore, 'reports', report.docId);
      
      await updateDoc(reportRef, {
        assignees: allSelectedUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          designation: u.designation,
          department: u.department,
        })),
      });
      
      const newAssignees = allSelectedUsers.filter(u => !(report.assignees || []).some(a => a.id === u.id));
      const newAssigneeNames = newAssignees.map(u => u.name).join(', ');
      const transferredToNames = allSelectedUsers.map(u => u.name).join(', ');


      let actionText = '';
      if (mode === 'transfer') {
        actionText = `transferred the case to ${transferredToNames}`;
      } else {
        actionText = `added ${newAssigneeNames} to the case`;
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
     return users?.filter(u => selectedUserIds.includes(u.id)) || [];
  }, [users, selectedUserIds])

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
                    {availableUsers?.map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        const isAlreadyAssigned = mode === 'add' && (report.assignees?.some(a => a.id === user.id));

                        return (
                             <Label
                                key={user.id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                    disabled={isAlreadyAssigned}
                                />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                           </Label>
                        )
                    })}
                     {availableUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No users found.</p>}
                </div>
            </ScrollArea>
        </div>
        
        <div className="py-2">
          <p className="text-sm font-medium mb-2">Final Assignees:</p>
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {finalSelection.map(u => (
              <Badge key={u.id} variant="secondary">{u.name}</Badge>
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
