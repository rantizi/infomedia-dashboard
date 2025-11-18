"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LeadsLoadingSkeleton() {
  return (
    <Table className="w-full min-w-[1200px] text-sm">
      <TableHeader>
        <TableRow>
          {Array.from({ length: 9 }).map((_, i) => (
            <TableHead key={`header-${i}`}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`row-${i}`}>
            {Array.from({ length: 9 }).map((_, j) => (
              <TableCell key={`cell-${i}-${j}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
