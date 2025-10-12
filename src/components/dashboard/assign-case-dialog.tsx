
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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (report?.assignees) {
      setSelectedUserIds(report.assignees.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [report]);

  const handleAssignCase = async () => {
    if (!firestore || !report.docId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not assign case. Missing required information.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedUsers = users?.filter(u => selectedUserIds.includes(u.id)) || [];
      const reportRef = doc(firestore, 'reports', report.docId);
      
      await updateDoc(reportRef, {
        assignees: selectedUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          designation: u.designation,
          department: u.department,
        })),
        status: 'In Progress'
      });

      const currentUser = users?.find(u => u.id === user.uid);
      const assigneeNames = selectedUsers.map(u => u.name).join(', ');

      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: currentUser?.name || user.displayName || 'System'
        },
        action: `assigned the case to ${assigneeNames}`,
        timestamp: serverTimestamp()
      });
      
      toast({
        title: "Case Updated",
        description: `Report has been assigned to ${assigneeNames}.`,
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
  
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign / Transfer Case</DialogTitle>
          <DialogDescription>
            Select one or more case officers to investigate this report. The status will be changed to 'In Progress'.
          </DialogDescription>
        </DialogHeader>
        
        <Command>
            <CommandInput placeholder="Search for user..." />
            <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                    {users?.map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                            <CommandItem
                                key={user.id}
                                onSelect={() => toggleUserSelection(user.id)}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.name || 'Unnamed User'} ({user.email})</span>
                                </div>
                                <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
        
        <div className="py-2">
          <p className="text-sm font-medium mb-2">Selected Officers:</p>
          <div className="flex flex-wrap gap-2">
            {users?.filter(u => selectedUserIds.includes(u.id)).map(u => (
              <Badge key={u.id} variant="secondary">{u.name}</Badge>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssignCase} disabled={isLoading || selectedUserIds.length === 0}>
            {isLoading ? "Updating..." : "Update Assignees"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
