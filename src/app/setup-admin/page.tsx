'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createAdminUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : 'Create Admin User'}
    </Button>
  );
}

export default function SetupAdminPage() {
  const [state, dispatch] = useActionState(createAdminUser, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form action={dispatch}>
          <CardHeader>
            <CardTitle>Create First Admin</CardTitle>
            <CardDescription>
              This is a one-time setup to create the initial administrator account. This page should be removed after use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" placeholder="Admin Name" required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <SubmitButton />
             <p className="text-center text-sm text-muted-foreground">
                After creating the admin, you can log in at the{' '}
                <Link href="/login" className="underline">
                    Admin Portal
                </Link>
                .
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
