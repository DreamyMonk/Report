
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { inviteUser } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { User } from "@/lib/types";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: User | null;
}

const initialState = {
  message: null,
  success: false,
};

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : (isEditMode ? 'Update User' : 'Invite User')}
    </Button>
  );
}

export function InviteUserDialog({ open, onOpenChange, userToEdit }: InviteUserDialogProps) {
  const [state, dispatch] = useActionState(inviteUser, initialState);
  const { toast } = useToast();
  
  const isEditMode = useMemo(() => !!userToEdit, [userToEdit]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Add a New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Update the details for ${userToEdit?.name}.`
              : 'Create a new user account. The user will be required to change their password upon first login.'
            }
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-4 py-4">
          {isEditMode && <input type="hidden" name="userId" value={userToEdit?.id} />}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required defaultValue={userToEdit?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required defaultValue={userToEdit?.email} readOnly={isEditMode}/>
          </div>
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" required defaultValue={userToEdit?.role || 'officer'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="officer">Case Officer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" placeholder="e.g. Lead Investigator" defaultValue={userToEdit?.designation} />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" placeholder="e.g. Internal Affairs" defaultValue={userToEdit?.department} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton isEditMode={isEditMode} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
