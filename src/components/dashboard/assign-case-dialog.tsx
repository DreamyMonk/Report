
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
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AssignCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
}

export function AssignCaseDialog({ open, onOpenChange, report }: AssignCaseDialogProps) {
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedUserIds([]);
      setSearchTerm('');
    }
  }, [open]);

  const filteredUsers = useMemo(() => {
      if (!users) return [];
      return users.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm]);

  const handleAssignCase = async () => {
    if (!firestore || !report.docId || !user || !userData) {
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

      const assigneeNames = selectedUsers.map(u => u.name).join(', ');

      await addDoc(collection(firestore, 'audit_logs'), {
        reportId: report.docId,
        actor: {
          id: user.uid,
          name: userData.name || user.displayName || 'System'
        },
        action: `assigned the case to ${assigneeNames}`,
        timestamp: serverTimestamp()
      });
      
      toast({
        title: "Case Assigned",
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
          <DialogTitle>Assign Case</DialogTitle>
          <DialogDescription>
            Select one or more case officers to investigate this report. The status will be changed to 'In Progress'.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <Input 
                placeholder="Search for user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                    {filteredUsers?.map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                            <Label
                                key={user.id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleUserSelection(user.id)}
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
                     {filteredUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No users found.</p>}
                </div>
            </ScrollArea>
        </div>
        
        <div className="py-2">
          <p className="text-sm font-medium mb-2">Selected Officers:</p>
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {users?.filter(u => selectedUserIds.includes(u.id)).map(u => (
              <Badge key={u.id} variant="secondary">{u.name}</Badge>
            ))}
             {selectedUserIds.length === 0 && <p className="text-xs text-muted-foreground">No officers selected.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssignCase} disabled={isLoading || selectedUserIds.length === 0}>
            {isLoading ? "Assigning..." : "Assign Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
