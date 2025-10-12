import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { reports } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const recentHighPriorityReports = reports
    .filter(r => r.severity === 'High' && r.status === 'New')
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

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
            <ReportsTable reports={recentHighPriorityReports} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
