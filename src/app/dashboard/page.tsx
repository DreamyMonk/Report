
'use client';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { ReportsByStatusChart } from "@/components/dashboard/reports-by-status-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { useAuth } from "@/firebase/auth-provider";
import { Report, AuditLog } from "@/lib/types";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, userData } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(true);
  
  const highPriorityReportsQuery = useMemo(() => {
    if (!firestore || !user || !userData) return null;

    if (userData.role === 'admin') {
      return query(
        collection(firestore, 'reports'),
        where('status', '==', 'Report Submitted'),
        where('severity', 'in', ['High', 'Critical']),
        orderBy('submittedAt', 'desc'),
        limit(5)
      );
    }
    
    return query(
      collection(firestore, 'reports'),
      where('assignees', 'array-contains', user.uid),
      where('status', '==', 'Report Submitted'),
      where('severity', 'in', ['High', 'Critical']),
      orderBy('submittedAt', 'desc'),
      limit(5)
    );
  }, [firestore, user, userData]);

  const auditLogsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  useEffect(() => {
    if (!highPriorityReportsQuery) return;
    const unsubscribe = onSnapshot(highPriorityReportsQuery, (snapshot) => {
        let reportData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Report));
        setReports(reportData);
    }, (error) => {
        console.error("Error fetching high priority cases:", error);
        const permissionError = new FirestorePermissionError({
          path: 'reports',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [highPriorityReportsQuery, userData]);

  useEffect(() => {
    if (!auditLogsQuery) return;
    setAuditLogsLoading(true);
    const unsubscribe = onSnapshot(auditLogsQuery, (snapshot) => {
        const logData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as AuditLog));
        setAuditLogs(logData);
        setAuditLogsLoading(false);
    }, (error) => {
        console.error("Error fetching audit logs:", error);
        const permissionError = new FirestorePermissionError({
          path: (auditLogsQuery as any)._query.path.toString(),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setAuditLogsLoading(false);
    });
    return () => unsubscribe();
  }, [auditLogsQuery]);


  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
      <OverviewCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent High-Priority Cases</CardTitle>
              <CardDescription>Newly submitted cases marked with high severity.</CardDescription>
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
                                (case)
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
