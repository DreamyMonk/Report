
'use client';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { Report } from "@/lib/types";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import { format } from "date-fns";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/firebase/auth-provider";
import { useRouter } from "next/navigation";

const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "caseId",
    header: "Case ID",
    cell: ({ row }) => <div className="font-mono">{row.getValue("caseId")}</div>,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
        return (
            <Link href={`/dashboard/reports/${row.original.docId}`} className="font-medium hover:underline">
                {row.getValue("title")}
            </Link>
        )
    },
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string;
      let Icon;
      switch (severity) {
        case "Critical": Icon = ShieldAlert; break;
        case "High": Icon = ShieldX; break;
        case "Medium": Icon = Shield; break;
        default: Icon = ShieldCheck; break;
      }
      return <Badge variant="outline" className="capitalize gap-1.5"><Icon className="h-3 w-3" />{severity}</Badge>;
    },
  },
   {
    accessorKey: "submittedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Resolved
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("submittedAt") as any;
      if (!date) return 'N/A';
      return <div>{format(date.toDate(), "MMM d, yyyy")}</div>;
    },
  },
];


export default function ArchivePage() {
  const firestore = useFirestore();
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submittedAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    if (!authLoading && userData?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [userData, authLoading, router]);

  const reportsQuery = useMemo(() => {
    if (!firestore || userData?.role !== 'admin') return null;
    return query(
        collection(firestore, 'reports'), 
        where('status', '==', 'Resolved'),
        orderBy('submittedAt', 'desc')
    );
  }, [firestore, userData]);
  
  useEffect(() => {
    if (!reportsQuery) return;
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    }, (error) => {
        console.error("Error fetching resolved cases:", error);
        const permissionError = new FirestorePermissionError({
          path: 'reports',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [reportsQuery]);

  const table = useReactTable({
    data: reports,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (authLoading || userData?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Resolved Case Archive</h1>
      <Card>
        <CardHeader>
          <CardTitle>Archived Cases</CardTitle>
          <CardDescription>A complete history of all resolved cases.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by title..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No resolved cases found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} case(s).
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
