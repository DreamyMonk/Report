import Link from 'next/link';
import { LoginForm } from '@/components/forms/login-form';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
          </Link>
          <h1 className="font-headline text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground">Sign in to manage reports</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline">
            Back to report submission
          </Link>
        </p>
      </div>
    </div>
  );
}
