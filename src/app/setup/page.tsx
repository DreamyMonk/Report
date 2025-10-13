
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAdminUser, hasAdminUser } from '@/lib/actions';
import { Logo } from '@/components/icons/logo';

const initialState = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Admin Account
    </Button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useActionState(createAdminUser, initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const adminExists = await hasAdminUser();
      if (adminExists) {
        router.replace('/login');
      } else {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Admin Created',
          description: state.message,
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo className="h-8 w-8 text-primary mb-4" />
          <h1 className="font-headline text-3xl font-bold">Portal Setup</h1>
          <p className="text-muted-foreground text-center">
            No administrator account found. Create one to get started.
          </p>
        </div>
        <Card>
          <form action={dispatch}>
            <CardHeader>
              <CardTitle>Create Administrator</CardTitle>
              <CardDescription>This will be the primary account for managing the portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Admin User" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
