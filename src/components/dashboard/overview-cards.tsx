
'use client';
import { useFirestore } from "@/firebase";
import { Report } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, Hourglass, CheckCircle } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

export function OverviewCards() {
  const firestore = useFirestore();
  const [reports, setReports] = useState<Report[]>([]);

  const reportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'));
  }, [firestore]);

  useEffect(() => {
    if (!reportsQuery) return;
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    }, (error) => {
        console.error("Error fetching reports for overview:", error);
        const permissionError = new FirestorePermissionError({
          path: (reportsQuery as any)._query.path.toString(),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [reportsQuery]);

  const totalReports = reports?.length || 0;
  const newReports = reports?.filter(r => r.status === "New").length || 0;
  const inProgress = reports?.filter(r => r.status === "In Progress").length || 0;
  const resolved = reports?.filter(r => r.status === "Resolved").length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalReports}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Reports</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newReports}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resolved}</div>
        </CardContent>
      </Card>
    </div>
  );
}
