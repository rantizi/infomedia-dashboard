"use client";

import { Button } from "@/components/ui/button";

interface LeadsPaginationProps {
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function LeadsPagination({ page, totalPages, startIndex, endIndex, total, onPageChange }: LeadsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Menampilkan {startIndex}-{endIndex} dari {total} Leads
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          Sebelumnya
        </Button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Halaman {page} dari {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
