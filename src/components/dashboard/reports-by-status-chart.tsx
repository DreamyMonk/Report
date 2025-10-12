
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useCollection, useFirestore } from "@/firebase";
import { CaseStatus, Report } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { useMemo } from "react";
import { Pie, PieChart, Cell } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

export function ReportsByStatusChart() {
    const firestore = useFirestore();

    const reportsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reports'));
    }, [firestore]);

    const statusesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'statuses'));
    }, [firestore]);

    const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsQuery);
    const { data: statuses, loading: statusesLoading } = useCollection<CaseStatus>(statusesQuery);
    
    const chartData = useMemo(() => {
        if (!reports || !statuses) return [];
        
        const statusCounts = reports.reduce((acc, report) => {
            acc[report.status] = (acc[report.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return statuses.map(status => ({
            status: status.label,
            count: statusCounts[status.label] || 0,
            fill: status.color,
        }));

    }, [reports, statuses]);

    const chartConfig = useMemo(() => {
        if (!statuses) return {} as ChartConfig;

        return statuses.reduce((acc, status) => {
            acc[status.label] = {
                label: status.label,
                color: status.color,
            };
            return acc;
        }, {} as ChartConfig);

    }, [statuses]);

    const totalReports = useMemo(() => chartData.reduce((acc, curr) => acc + curr.count, 0), [chartData]);


    if (reportsLoading || statusesLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Reports by Status</CardTitle>
                    <CardDescription>Distribution of all submitted reports.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[250px]">
                    <p>Loading chart...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Reports by Status</CardTitle>
                <CardDescription>Distribution of all submitted reports.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full max-h-[250px]"
                >
                <PieChart>
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                    />
                     <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={60}
                        strokeWidth={5}
                     >
                        {chartData.map((entry) => (
                           <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                        ))}
                     </Pie>
                     <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
                </ChartContainer>
            </CardContent>
             <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                Total Reports: {totalReports}
                <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                Showing the distribution of all reports by status.
                </div>
            </CardFooter>
        </Card>
    )
}
