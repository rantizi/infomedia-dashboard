/**
 * Stub data for the Infomedia dashboard mockup.
 * These numbers match the mockup screenshot and will be replaced with real Supabase data later.
 */

import { Funnel2RowsResponse } from "@/types/funnel";

export const STUB_FUNNEL_DATA: Funnel2RowsResponse = {
  stages: {
    leads: {
      TELKOM_GROUP: { valueM: 18.45, projects: 26 },
      SOE: { valueM: 12.34, projects: 18 },
      PRIVATE: { valueM: 25.67, projects: 42 },
      GOV: { valueM: 15.23, projects: 21 },
      SME_REG: { valueM: 8.91, projects: 35 },
      TOTAL: { valueM: 80.6, projects: 142 },
    },
    prospect: {
      TELKOM_GROUP: { valueM: 15.23, projects: 22 },
      SOE: { valueM: 10.45, projects: 15 },
      PRIVATE: { valueM: 20.34, projects: 35 },
      GOV: { valueM: 12.67, projects: 18 },
      SME_REG: { valueM: 7.45, projects: 28 },
      TOTAL: { valueM: 66.14, projects: 118 },
    },
    qualified: {
      TELKOM_GROUP: { valueM: 12.34, projects: 18 },
      SOE: { valueM: 8.67, projects: 12 },
      PRIVATE: { valueM: 16.78, projects: 28 },
      GOV: { valueM: 10.23, projects: 15 },
      SME_REG: { valueM: 6.12, projects: 22 },
      TOTAL: { valueM: 54.14, projects: 95 },
    },
    submission: {
      TELKOM_GROUP: { valueM: 10.12, projects: 15 },
      SOE: { valueM: 7.23, projects: 10 },
      PRIVATE: { valueM: 13.45, projects: 22 },
      GOV: { valueM: 8.34, projects: 12 },
      SME_REG: { valueM: 5.01, projects: 18 },
      TOTAL: { valueM: 44.15, projects: 77 },
    },
    win: {
      TELKOM_GROUP: { valueM: 8.23, projects: 12 },
      SOE: { valueM: 5.67, projects: 8 },
      PRIVATE: { valueM: 10.89, projects: 18 },
      GOV: { valueM: 6.78, projects: 10 },
      SME_REG: { valueM: 3.89, projects: 14 },
      TOTAL: { valueM: 35.46, projects: 62 },
    },
  },

  targetRkap: {
    TELKOM_GROUP: 120.0,
    SOE: 80.0,
    PRIVATE: 150.0,
    GOV: 95.0,
    SME_REG: 60.0,
    TOTAL: 505.0,
  },

  targetStg: {
    TELKOM_GROUP: 100.0,
    SOE: 65.0,
    PRIVATE: 125.0,
    GOV: 78.0,
    SME_REG: 50.0,
    TOTAL: 418.0,
  },

  kecukupanLop: {
    TELKOM_GROUP: {
      valueM: 30.69,
      pctRkap: 25.58,
      pctStg: 30.69,
    },
    SOE: {
      valueM: 21.57,
      pctRkap: 26.96,
      pctStg: 33.18,
    },
    PRIVATE: {
      valueM: 41.12,
      pctRkap: 27.41,
      pctStg: 32.9,
    },
    GOV: {
      valueM: 25.35,
      pctRkap: 26.68,
      pctStg: 32.5,
    },
    SME_REG: {
      valueM: 15.02,
      pctRkap: 25.03,
      pctStg: 30.04,
    },
    TOTAL: {
      valueM: 133.75,
      pctRkap: 26.49,
      pctStg: 32.0,
    },
  },

  qualifiedLop: {
    TELKOM_GROUP: {
      valueM: 30.69,
      pctRkap: 25.58,
      pctStg: 30.69,
    },
    SOE: {
      valueM: 21.57,
      pctRkap: 26.96,
      pctStg: 33.18,
    },
    PRIVATE: {
      valueM: 41.12,
      pctRkap: 27.41,
      pctStg: 32.9,
    },
    GOV: {
      valueM: 25.35,
      pctRkap: 26.68,
      pctStg: 32.5,
    },
    SME_REG: {
      valueM: 15.02,
      pctRkap: 25.03,
      pctStg: 30.04,
    },
    TOTAL: {
      valueM: 133.75,
      pctRkap: 26.49,
      pctStg: 32.0,
    },
  },
};

