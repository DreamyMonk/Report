
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
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { inviteUser, updateUser } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { User } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  
  const isEditMode = useMemo(() => !!userToEdit, [userToEdit]);
  const action = isEditMode ? updateUser : inviteUser;
  const [state, dispatch] = useActionState(action, initialState);
  const { toast } = useToast();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(userToEdit?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const dialogTitle = isEditMode ? 'Edit User' : 'Add a New User';
  const dialogDescription = isEditMode
    ? 'Update the details for this user.'
    : 'Create a new user account. The user will be required to change their password upon first login.';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setAvatarPreview(userToEdit?.avatarUrl || null);
        }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-4 py-4">
          {isEditMode && userToEdit?.docId && (
            <input type="hidden" name="userId" value={userToEdit.docId} />
          )}

           <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                   <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted">
                     {avatarPreview ? (
                        <Image src={avatarPreview} alt="Avatar preview" layout="fill" objectFit="cover" />
                     ) : (
                        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                            <UploadCloud />
                        </div>
                     )}
                   </div>
                    <Input id="avatar" name="avatar" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        {avatarPreview ? 'Change' : 'Upload'} Image
                    </Button>
                </div>
            </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required defaultValue={userToEdit?.name || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required defaultValue={userToEdit?.email || ''} readOnly={isEditMode} />
          </div>
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          )}
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
            <Label htmlFor="about">About</Label>
            <Textarea id="about" name="about" placeholder="e.g. Specializes in financial investigations with 10 years of experience." defaultValue={userToEdit?.about || ''} />
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
