'use client';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { Report } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";

export default function DashboardPage() {
  const firestore = useFirestore();
  const reportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'reports'),
      where('severity', '==', 'High'),
      where('status', '==', 'New'),
      orderBy('submittedAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: reports } = useCollection<Report>(reportsQuery);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
      <OverviewCards />
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Priority Reports</CardTitle>
            <CardDescription>Newly submitted reports marked with high severity.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsTable reports={reports || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
