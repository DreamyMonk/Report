
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

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
    }
  }, [report, open, mode]);

  const availableUsers = useMemo(() => {
    if (!users) return [];
    if (mode === 'transfer') return users;
    
    // In 'add' mode, only show users who are not already assignees
    const currentAssigneeIds = report.assignees?.map(a => a.id) || [];
    return users.filter(u => !currentAssigneeIds.includes(u.id));
  }, [users, report, mode]);


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

      let actionText = '';
      if (mode === 'transfer') {
        actionText = `transferred the case to ${newAssigneeNames}`;
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
    // For 'add' mode, we append. For 'transfer', we can allow multi-select or single-select.
    // Current implementation allows multi-select for both.
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
        
        <Command>
            <CommandInput placeholder="Search for user..." />
            <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                    {availableUsers?.map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                            <CommandItem
                                key={user.id}
                                onSelect={() => toggleUserSelection(user.id)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                                          <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                      </Avatar>
                                       <span>{user.name}</span>
                                      <span className="text-xs text-muted-foreground">({user.email})</span>
                                  </div>
                                  <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                </div>
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
        
        <div className="py-2">
          <p className="text-sm font-medium mb-2">Final Assignees:</p>
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {finalSelection.map(u => (
              <Badge key={u.id} variant="secondary">{u.name}</Badge>
            ))}
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
