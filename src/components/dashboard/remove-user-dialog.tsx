
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "@/lib/actions";
import { User } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";


interface RemoveUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User;
}

const initialState = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction type="submit" disabled={pending} className="bg-destructive hover:bg-destructive/90">
      {pending ? <Loader2 className="animate-spin" /> : "Delete"}
    </AlertDialogAction>
  );
}

export function RemoveUserDialog({ open, onOpenChange, user }: RemoveUserDialogProps) {
  const [state, dispatch] = useActionState(deleteUser, initialState);
  const { toast } = useToast();

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
        <form action={dispatch}>
            <input type="hidden" name="userId" value={user.docId} />
            <input type="hidden" name="userUid" value={user.id} />
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for <span className="font-semibold">{user.name}</span> and remove all of their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <SubmitButton />
          </AlertDialogFooter>
        </form>
        </AlertDialogContent>
      </AlertDialog>
  )
}

    