"use client";

import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatProjectValue, formatDate } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { MsdcLead } from "@/types/leads";

type SortField = "customer_name" | "project_value_m" | null;
type SortDirection = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) {
    return <ChevronUpIcon className="ml-1 size-4 opacity-30" />;
  }
  return sortDirection === "asc" ? (
    <ChevronUpIcon className="ml-1 size-4" />
  ) : (
    <ChevronDownIcon className="ml-1 size-4" />
  );
}

function getStatusBadgeVariant(status: string | null): string {
  if (!status) return "";
  const normalized = status.toLowerCase();
  if (normalized.includes("open")) {
    return "bg-emerald-100/80 text-emerald-800 border-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/40";
  }
  if (normalized.includes("sedang berjalan") || normalized.includes("berjalan")) {
    return "bg-blue-100/80 text-blue-800 border-blue-200/70 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/40";
  }
  if (normalized.includes("selesai")) {
    return "bg-slate-100/80 text-slate-800 border-slate-200/70 dark:bg-slate-500/20 dark:text-slate-100 dark:border-slate-500/40";
  }
  if (normalized.includes("gagal")) {
    return "bg-red-100/80 text-red-800 border-red-200/70 dark:bg-red-500/20 dark:text-red-100 dark:border-red-500/40";
  }
  return "bg-slate-100/80 text-slate-800 border-slate-200/70 dark:bg-slate-500/20 dark:text-slate-100 dark:border-slate-500/40";
}

interface LeadsTableProps {
  leads: MsdcLead[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function LeadsTable({ leads, sortField, sortDirection, onSort }: LeadsTableProps) {
  return (
    <Table className="w-full min-w-[1200px] text-sm">
      <TableHeader>
        <TableRow className="border-slate-200/70 dark:border-slate-800/60">
          <TableHead
            className="cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            onClick={() => onSort("customer_name")}
          >
            <div className="flex items-center">
              Nama Lembaga / Customer
              <SortIcon field="customer_name" sortField={sortField} sortDirection={sortDirection} />
            </div>
          </TableHead>
          <TableHead>PIC / Contact</TableHead>
          <TableHead>Segment</TableHead>
          <TableHead>Channel / Sumber Leads</TableHead>
          <TableHead>Kebutuhan / Deskripsi</TableHead>
          <TableHead>Permintaan (Nama Tender)</TableHead>
          <TableHead
            className="cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            onClick={() => onSort("project_value_m")}
          >
            <div className="flex items-center">
              Nilai Proyek (HPS)
              <SortIcon field="project_value_m" sortField={sortField} sortDirection={sortDirection} />
            </div>
          </TableHead>
          <TableHead>Status Tender</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead, index) => (
          <TableRow
            key={lead.lead_id ?? `lead-${index}`}
            className={cn(
              "border-slate-200/70 dark:border-slate-800/60",
              index % 2 === 0 ? "bg-white/60 dark:bg-slate-900/40" : "bg-white/40 dark:bg-slate-900/25",
            )}
          >
            <TableCell className="font-semibold">{lead.customer_name}</TableCell>
            <TableCell>{lead.pic ?? "-"}</TableCell>
            <TableCell>{lead.segment ?? "-"}</TableCell>
            <TableCell>{lead.channel ?? "-"}</TableCell>
            <TableCell className="max-w-xs">
              {lead.need_description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate">{lead.need_description}</div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>{lead.need_description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {lead.tender_name ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="max-w-xs truncate">{lead.tender_name}</div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>{lead.tender_name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>{formatProjectValue(lead.project_value_m)}</TableCell>
            <TableCell>
              {lead.status_tender ? (
                <Badge
                  variant="outline"
                  className={cn("border font-medium", getStatusBadgeVariant(lead.status_tender))}
                >
                  {lead.status_tender}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>{formatDate(lead.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
