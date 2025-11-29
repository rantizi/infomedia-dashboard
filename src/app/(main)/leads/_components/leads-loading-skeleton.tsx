"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const HEADER_KEYS = Array.from({ length: 9 }, (_, idx) => `header-${idx + 1}`);
const ROW_KEYS = Array.from({ length: 5 }, (_, idx) => `row-${idx + 1}`);
const COL_KEYS = Array.from({ length: 9 }, (_, idx) => `col-${idx + 1}`);

export function LeadsLoadingSkeleton() {
  return (
    <Table className="w-full min-w-[1200px] text-sm">
      <TableHeader>
        <TableRow>
          {HEADER_KEYS.map((headerKey) => (
            <TableHead key={headerKey}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROW_KEYS.map((rowKey) => (
          <TableRow key={rowKey}>
            {COL_KEYS.map((colKey) => (
              <TableCell key={`${rowKey}-${colKey}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
