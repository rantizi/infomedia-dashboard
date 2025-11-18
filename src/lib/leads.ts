/**
 * Client-side API helper for fetching MSDC Leads
 */

import type { MsdcLeadsQueryParams, MsdcLeadsResponse } from "@/types/leads";

/**
 * Build URL search params from query params object
 */
function buildSearchParams(params: MsdcLeadsQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.append("status", params.status);
  }
  if (params.q) {
    searchParams.append("q", params.q);
  }
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }
  if (params.pageSize !== undefined) {
    searchParams.append("pageSize", params.pageSize.toString());
  }
  if (params.lembaga) {
    searchParams.append("lembaga", params.lembaga);
  }
  if (params.year !== undefined) {
    searchParams.append("year", params.year.toString());
  }

  return searchParams;
}

/**
 * Extract error message from API error response
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    return String(err.error ?? err.message ?? err.details ?? "Unknown error");
  }
  return "Unknown error";
}

/**
 * Fetch MSDC leads data from the API.
 *
 * @example
 *   const data = await getMsdcLeads({
 *     status: 'Open',
 *     q: 'telkom',
 *     page: 1,
 *     pageSize: 20
 *   })
 */
export async function getMsdcLeads(params: MsdcLeadsQueryParams = {}): Promise<MsdcLeadsResponse> {
  const searchParams = buildSearchParams(params);
  const queryString = searchParams.toString();
  const url = `/api/leads/msdc${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    const errorMessage = extractErrorMessage(error);
    throw new Error(`MSDC Leads API error [${response.status}]: ${errorMessage}`);
  }

  return response.json();
}
