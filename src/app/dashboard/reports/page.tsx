'use client';
import { ReportsTable } from "@/components/dashboard/reports-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import { Report } from "@/lib/types";
import { collection, query, orderBy } from "firebase/firestore";

export default function AllReportsPage() {
  const { data: reports, firestore } = useCollection<Report>(
    firestore ? query(collection(firestore, 'reports'), orderBy('submittedAt', 'desc')) : null
  );

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">All Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Case Management</CardTitle>
          <CardDescription>Review, assign, and track all submitted reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsTable reports={reports || []} />
        </CardContent>
      </Card>
    </div>
  );
}
