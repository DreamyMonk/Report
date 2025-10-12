'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { AuditLog } from "@/lib/types";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuditLogPage() {
  const firestore = useFirestore();
  
  const auditLogsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'));
  }, [firestore]);
  
  const { data: auditLogs, loading } = useCollection<AuditLog>(auditLogsQuery);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>A chronological record of all actions taken within the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {loading && <p>Loading audit trail...</p>}
            {auditLogs?.map((log) => (
              <div key={log.docId} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                   <AvatarFallback>{log.actor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    <span className="font-semibold">{log.actor.name}</span> {log.action}
                    {log.reportId && (
                       <Button variant="link" asChild className="p-1 h-auto">
                        <Link href={`/dashboard/reports/${log.reportId}`}>
                          (view report)
                        </Link>
                      </Button>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {log.timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
             {!loading && auditLogs?.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No audit log entries found.</p>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
