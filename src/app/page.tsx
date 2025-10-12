import Link from 'next/link';
import { ReportSubmissionForm } from '@/components/forms/report-submission-form';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Integrity Beacon</span>
        </Link>
        <div className="flex items-center gap-2">
           <Button asChild variant="outline">
              <Link href="/track">Track a Report</Link>
            </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Admin Login</Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Submit a Report</CardTitle>
            <CardDescription>
              Your voice matters. Report misconduct securely. You can choose to report anonymously or confidentially.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportSubmissionForm />
          </CardContent>
        </Card>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Integrity Beacon. All rights reserved.
      </footer>
    </div>
  );
}
