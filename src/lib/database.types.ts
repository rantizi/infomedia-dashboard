/**
 * Typed representation of the Supabase schema used by the dashboard.
 * Generated types are recommended; this hand-written version mirrors the tables/views the app queries.
 */
export type ActivitiesRow = {
  id: string;
  tenant_id: string;
  created_at: string | null;
  user_id: string | null;
  description: string | null;
};

export type AliasDictionaryRow = {
  id: string;
  tenant_id: string;
  source_label: string;
  canonical_name: string;
  created_at: string | null;
};

export type CompaniesRow = {
  id: string;
  tenant_id: string;
  name: string | null;
  name_canonical: string | null;
  created_at: string | null;
};

export type ImportsRow = {
  id: string;
  tenant_id: string;
  status: string | null;
  created_at: string | null;
  file_path: string | null;
  error_message: string | null;
  rows_in: number | null;
  rows_out: number | null;
};

export type LeadsRow = {
  lead_id: string;
  tenant_id: string;
  customer_name: string | null;
  pic: string | null;
  segment: string | null;
  channel: string | null;
  need_description: string | null;
  tender_name: string | null;
  project_value_m: number | null;
  status_tender: string | null;
  created_at: string | null;
};

export type MembershipsRow = {
  tenant_id: string;
  user_id: string;
  role: string | null;
  division: "BIDDING" | "MSDC" | "SALES" | "MARKETING" | "OTHER" | null;
  created_at: string | null;
};

export type OpportunitiesRow = {
  id: string;
  tenant_id: string;
  company_id: string | null;
  project_name: string | null;
  project_name_canonical: string | null;
  stage: string | null;
  amount_m: number | null;
  source_division: string | null;
  created_at: string | null;
};

export type OpportunityStageHistoryRow = {
  id: string;
  opportunity_id: string;
  stage: string | null;
  changed_at: string | null;
};

export type StgCleanRowsRow = { id: string; tenant_id: string; payload: Record<string, unknown> | null };
export type StgRawRowsRow = { id: string; tenant_id: string; payload: Record<string, unknown> | null };

export type TenantsRow = { id: string; name: string | null; created_at: string | null };
export type UsersRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  job_title: string | null;
  email_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  extra: Record<string, unknown> | null;
};

export type VwFunnelKpiPerSegmentRow = {
  tenant_id: string;
  segment: string;
  stage: string;
  project_count: number | null;
  total_m: number | null;
};

export type VwLopVsTargetPerSegmentRow = {
  tenant_id: string;
  year: number;
  segment: string;
  target_rkap_m: number | null;
  target_stg_m: number | null;
  kecukupan_lop_m: number | null;
  qualified_lop_m: number | null;
  kecukupan_vs_rkap_pct: number | null;
  kecukupan_vs_stg_pct: number | null;
  qualified_vs_rkap_pct: number | null;
  qualified_vs_stg_pct: number | null;
};

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: ActivitiesRow;
        Insert: Partial<ActivitiesRow>;
        Update: Partial<ActivitiesRow>;
        Relationships: [];
      };
      alias_dictionary: {
        Row: AliasDictionaryRow;
        Insert: Partial<AliasDictionaryRow>;
        Update: Partial<AliasDictionaryRow>;
        Relationships: [];
      };
      companies: {
        Row: CompaniesRow;
        Insert: Partial<CompaniesRow>;
        Update: Partial<CompaniesRow>;
        Relationships: [];
      };
      imports: {
        Row: ImportsRow;
        Insert: Partial<ImportsRow>;
        Update: Partial<ImportsRow>;
        Relationships: [];
      };
      leads: {
        Row: LeadsRow;
        Insert: Partial<LeadsRow>;
        Update: Partial<LeadsRow>;
        Relationships: [];
      };
      memberships: {
        Row: MembershipsRow;
        Insert: Partial<MembershipsRow>;
        Update: Partial<MembershipsRow>;
        Relationships: [];
      };
      opportunities: {
        Row: OpportunitiesRow;
        Insert: Partial<OpportunitiesRow>;
        Update: Partial<OpportunitiesRow>;
        Relationships: [];
      };
      opportunity_stage_history: {
        Row: OpportunityStageHistoryRow;
        Insert: Partial<OpportunityStageHistoryRow>;
        Update: Partial<OpportunityStageHistoryRow>;
        Relationships: [];
      };
      stg_clean_rows: {
        Row: StgCleanRowsRow;
        Insert: Partial<StgCleanRowsRow>;
        Update: Partial<StgCleanRowsRow>;
        Relationships: [];
      };
      stg_raw_rows: {
        Row: StgRawRowsRow;
        Insert: Partial<StgRawRowsRow>;
        Update: Partial<StgRawRowsRow>;
        Relationships: [];
      };
      tenants: {
        Row: TenantsRow;
        Insert: Partial<TenantsRow>;
        Update: Partial<TenantsRow>;
        Relationships: [];
      };
      users: {
        Row: UsersRow;
        Insert: Partial<UsersRow>;
        Update: Partial<UsersRow>;
        Relationships: [];
      };
      vw_funnel_kpi_per_segment: {
        Row: VwFunnelKpiPerSegmentRow;
        Insert: VwFunnelKpiPerSegmentRow;
        Update: VwFunnelKpiPerSegmentRow;
        Relationships: [];
      };
      vw_lop_vs_target_per_segment: {
        Row: VwLopVsTargetPerSegmentRow;
        Insert: VwLopVsTargetPerSegmentRow;
        Update: VwLopVsTargetPerSegmentRow;
        Relationships: [];
      };
    };
    Views: {
      vw_funnel_kpi_per_segment: {
        Row: VwFunnelKpiPerSegmentRow;
        Relationships: [];
      };
      vw_lop_vs_target_per_segment: {
        Row: VwLopVsTargetPerSegmentRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
