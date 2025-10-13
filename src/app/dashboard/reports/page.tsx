
'use client';
import { ReportsTable } from "@/components/dashboard/reports-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { Report } from "@/lib/types";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AllReportsPage() {
  const firestore = useFirestore();
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');

  const reportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'), orderBy('submittedAt', 'desc'));
  }, [firestore]);
  
  useEffect(() => {
    if (!reportsQuery) return;
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    }, (error) => {
        console.error("Error fetching all reports:", error);
        const permissionError = new FirestorePermissionError({
          path: 'reports',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [reportsQuery]);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter(report => report.status === statusFilter);
  }, [reports, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">All Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Case Management</CardTitle>
          <CardDescription>Review, assign, and track all submitted reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
             <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="New">New</TabsTrigger>
                <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                <TabsTrigger value="Resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ReportsTable reports={filteredReports || []} />
        </CardContent>
      </Card>
    </div>
  );
}
