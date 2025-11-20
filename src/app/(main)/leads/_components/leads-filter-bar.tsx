"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Sedang Berjalan", label: "Sedang Berjalan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Gagal", label: "Gagal" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface LeadsFilterBarProps {
  status: string;
  searchInput: string;
  pageSize: number;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
}

export function LeadsFilterBar({
  status,
  searchInput,
  pageSize,
  onStatusChange,
  onSearchChange,
  onPageSizeChange,
}: LeadsFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Status Tender:
          </label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="search-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Search:
          </label>
          <Input
            id="search-input"
            type="text"
            placeholder="Cari lembaga / tender / PIC..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Per page:
          </label>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}>
            <SelectTrigger id="page-size" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
