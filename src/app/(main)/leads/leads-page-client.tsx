"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty";
import { getMsdcLeads } from "@/lib/leads";
import type { MsdcLead, MsdcLeadsQueryParams } from "@/types/leads";

import { LeadsFilterBar } from "./_components/leads-filter-bar";
import { LeadsLoadingSkeleton } from "./_components/leads-loading-skeleton";
import { LeadsPagination } from "./_components/leads-pagination";
import { LeadsTable } from "./_components/leads-table";

type SortField = "customer_name" | "project_value_m" | null;
type SortDirection = "asc" | "desc";

function useSearchParamsUpdate() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (updates: Partial<MsdcLeadsQueryParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.status !== undefined) {
        if (updates.status === "all" || !updates.status) {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      if (updates.q !== undefined) {
        if (updates.q) {
          params.set("q", updates.q);
        } else {
          params.delete("q");
        }
        params.set("page", "1");
      }

      if (updates.page !== undefined) {
        if (updates.page === 1) {
          params.delete("page");
        } else {
          params.set("page", updates.page.toString());
        }
      }

      if (updates.pageSize !== undefined) {
        if (updates.pageSize === 20) {
          params.delete("pageSize");
        } else {
          params.set("pageSize", updates.pageSize.toString());
        }
        params.set("page", "1");
      }

      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams],
  );
}

function getSortValue(lead: MsdcLead, field: SortField): string | number {
  if (field === "customer_name") {
    return lead.customer_name ?? "";
  }
  if (field === "project_value_m") {
    return lead.project_value_m ?? 0;
  }
  return "";
}

function compareLeads(a: MsdcLead, b: MsdcLead, field: SortField, direction: SortDirection): number {
  const aVal = getSortValue(a, field);
  const bVal = getSortValue(b, field);

  if (aVal < bVal) return direction === "asc" ? -1 : 1;
  if (aVal > bVal) return direction === "asc" ? 1 : -1;
  return 0;
}

function useSortedLeads(leads: MsdcLead[], sortField: SortField, sortDirection: SortDirection) {
  return useMemo(() => {
    if (!sortField) return leads;
    return [...leads].sort((a, b) => compareLeads(a, b, sortField, sortDirection));
  }, [leads, sortField, sortDirection]);
}

function useLeadsData(status: string, q: string, page: number, pageSize: number) {
  const [leads, setLeads] = useState<MsdcLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: MsdcLeadsQueryParams = {
          page,
          pageSize,
        };

        if (status && status !== "all") {
          params.status = status;
        }

        if (q) {
          params.q = q;
        }

        const response = await getMsdcLeads(params);
        setLeads(response.data);
        setTotal(response.meta.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data Leads");
        setLeads([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [status, q, page, pageSize]);

  return { leads, loading, error, total };
}

function useSearchDebounce(
  searchInput: string,
  q: string,
  updateSearchParams: (updates: Partial<MsdcLeadsQueryParams>) => void,
) {
  useEffect(() => {
    if (searchInput === q) return;

    const timer = setTimeout(() => {
      updateSearchParams({ q: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, q, updateSearchParams]);
}

// eslint-disable-next-line complexity
export default function LeadsPageClient() {
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const status = searchParams.get("status") ?? "all";
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  const [searchInput, setSearchInput] = useState(q);
  const updateSearchParams = useSearchParamsUpdate();
  const { leads, loading, error, total } = useLeadsData(status, q, page, pageSize);
  const sortedLeads = useSortedLeads(leads, sortField, sortDirection);

  useSearchDebounce(searchInput, q, updateSearchParams);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    updateSearchParams({ status: "all", q: "", page: 1 });
  };

  const handleStatusChange = (value: string) => {
    updateSearchParams({ status: value, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handlePageSizeChange = (value: number) => {
    updateSearchParams({ pageSize: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">MSDC Leads</h1>
        <p className="text-muted-foreground text-sm">
          Single view untuk seluruh Leads MSDC yang sudah di-cleaning dan diperkaya data tender.
        </p>
      </div>

      <LeadsFilterBar
        status={status}
        searchInput={searchInput}
        pageSize={pageSize}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-0 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full min-w-[1200px]">
              <LeadsLoadingSkeleton />
            </div>
          ) : error ? (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Empty>
                <EmptyMedia>
                  <RefreshCwIcon className="size-8 text-red-500" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Gagal memuat data Leads</EmptyTitle>
                  <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => window.location.reload()}>Coba lagi</Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          ) : sortedLeads.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Belum ada Leads yang cocok dengan filter saat ini.</EmptyTitle>
                  <EmptyDescription>
                    Coba ubah filter atau hapus pencarian untuk melihat lebih banyak hasil.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleResetFilters} variant="outline">
                    Reset Filter
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          ) : (
            <LeadsTable leads={sortedLeads} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          )}
        </div>
      </div>

      {!loading && !error && sortedLeads.length > 0 && (
        <LeadsPagination
          page={page}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          total={total}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}
