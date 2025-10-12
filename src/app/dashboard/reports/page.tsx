import { ReportsTable } from "@/components/dashboard/reports-table";
import { reports } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AllReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">All Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Case Management</CardTitle>
          <CardDescription>Review, assign, and track all submitted reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
