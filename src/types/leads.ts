/**
 * TypeScript types for MSDC Leads data structures
 */

export type MsdcLead = {
  lead_id: string;
  customer_name: string; // Nama lembaga / customer
  pic: string | null; // PIC / Contact
  segment: string | null; // Segment (SOE / Private / Gov / SME & Reg / etc.)
  channel: string | null; // Sumber leads / channel
  need_description: string | null; // Keterangan kebutuhan
  tender_name: string | null; // Permintaan / nama tender
  project_value_m: number | null; // Nilai HPS dalam "M" (miliar), e.g. 1.5 = 1,5M
  status_tender: string | null; // Open / Sedang Berjalan / Selesai / Gagal / etc.
  created_at: string | null; // ISO datetime string
};

export type MsdcLeadsResponse = {
  data: MsdcLead[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
};

export type MsdcLeadsQueryParams = {
  status?: string; // Filter by status_tender
  q?: string; // Text search (customer_name, tender_name, pic)
  page?: number;
  pageSize?: number;
  lembaga?: string; // Optional for future extension
  year?: number; // Optional for future extension
};
