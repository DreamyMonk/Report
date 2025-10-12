"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [is2fa, setIs2fa] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIs2fa(true); // Move to 2FA step
    }, 1000);
  };
  
  const handle2fa = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <Card>
      {is2fa ? (
         <form onSubmit={handle2fa}>
          <CardHeader>
            <CardTitle className="font-headline">Two-Factor Authentication</CardTitle>
            <CardDescription>Enter the code from your authenticator app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input id="2fa-code" type="text" required inputMode="numeric" pattern="[0-9]{6}" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="font-headline">Sign In</CardTitle>
            <CardDescription>Use your administrator credentials to log in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="relative w-full">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">OR</span>
            </div>
            <Button variant="outline" className="w-full" type="button">Sign in with Google</Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
