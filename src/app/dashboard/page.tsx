
'use client';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { ReportsByStatusChart } from "@/components/dashboard/reports-by-status-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { Report, AuditLog } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const firestore = useFirestore();
  
  const highPriorityReportsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'reports'),
      where('severity', '==', 'High'),
      where('status', '==', 'New'),
      orderBy('submittedAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const auditLogsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  const { data: reports } = useCollection<Report>(highPriorityReportsQuery);
  const { data: auditLogs, loading: auditLogsLoading } = useCollection<AuditLog>(auditLogsQuery);


  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
      <OverviewCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
        <div className="space-y-6">
           <ReportsByStatusChart />
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A summary of the latest actions taken in the portal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {auditLogsLoading && <p>Loading activity...</p>}
                  {auditLogs?.map((log) => (
                    <div key={log.docId} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{log.actor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <p className="text-sm font-medium leading-none">
                          <span className="font-semibold">{log.actor.name}</span> {log.action}
                          {log.reportId && (
                            <Button variant="link" asChild className="p-1 h-auto">
                              <Link href={`/dashboard/reports/${log.reportId}`}>
                                (report)
                              </Link>
                            </Button>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!auditLogsLoading && auditLogs?.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                          <p>No recent activity.</p>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

