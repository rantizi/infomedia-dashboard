"""ETL worker that consumes queued imports from the `imports` table and
loads them into staging tables (`stg_raw_rows`, `stg_clean_rows`)
then upserts into `companies` and `opportunities`.

This version is aligned with the actual Supabase schemas provided
(via the column-name CSVs) and the current project design.
"""

from __future__ import annotations

import io
import logging
import os
import sys
import traceback
from typing import Tuple

import datetime as dt

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import DictCursor, Json, execute_values
import requests

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = "imports"


# ---------------------------------------------------------------------------
# Low-level helpers: DB + Storage
# ---------------------------------------------------------------------------

def get_db_connection() -> psycopg2.extensions.connection:
    """Create a Postgres connection using DATABASE_URL."""
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("Set DATABASE_URL to run the ETL worker.")
    return psycopg2.connect(dsn, cursor_factory=DictCursor)


def download_from_storage(storage_path: str, bucket: str = BUCKET_NAME) -> bytes:
    """Download a file from Supabase Storage using the REST API.

    Requires env vars:
      - SUPABASE_URL
      - SUPABASE_SERVICE_ROLE_KEY
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env "
            "to download from storage."
        )

    # Use storage_path as stored in `imports.storage_path`, stripping
    # only a leading slash if present.
    path = storage_path.lstrip("/")

    # {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
    url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{path}"

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }

    resp = requests.get(url, headers=headers)
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Failed to download from storage ({bucket}/{path}): "
            f"{resp.status_code} {resp.text}"
        ) from exc

    return resp.content


def load_dataframe_from_bytes(file_bytes: bytes, storage_path: str) -> pd.DataFrame:
    """Route bytes to Pandas based on the file extension."""
    _, ext = os.path.splitext(storage_path.lower())
    if ext in (".xls", ".xlsx"):
        return pd.read_excel(io.BytesIO(file_bytes))
    if ext == ".csv":
        return pd.read_csv(io.BytesIO(file_bytes))
    raise ValueError(f"Unsupported file type: {ext}")


# ---------------------------------------------------------------------------
# Cleaning / normalization helpers halo tanpa adanya kelihatan juga harus bisa 
# ---------------------------------------------------------------------------

def pick_series(df: pd.DataFrame, candidates, default="") -> pd.Series:
    """Return first existing column from `candidates` or a default Series."""
    for col in candidates:
        if col in df.columns:
            return df[col]
    return pd.Series([default] * len(df), index=df.index)


def canonicalize_company(name: str | None) -> str | None:
    """Simple canonicalization for company names."""
    if name is None or (isinstance(name, float) and np.isnan(name)):
        return None
    s = str(name).upper().strip()
    if not s:
        return None
    s = " ".join(s.split())
    return s


def canonicalize_project(name: str | None) -> str | None:
    """Canonical project name: uppercase + collapsed spaces."""
    if name is None or (isinstance(name, float) and np.isnan(name)):
        return None
    s = str(name).upper().strip()
    if not s:
        return None
    s = " ".join(s.split())
    return s


def clean_and_normalize(df_raw: pd.DataFrame, division: str) -> pd.DataFrame:
    """Minimal transformation from raw Excel/CSV to standardized columns."""
    df = df_raw.copy()

    # Map likely column headers into our standard names
    df["company_name"] = (
        pick_series(df, ["company_name", "Company"])
        .astype(str)
        .str.strip()
    )

    df["project_name"] = (
        pick_series(df, ["project_name", "Project"])
        .astype(str)
        .str.strip()
    )

    df["sales_person"] = (
        pick_series(df, ["sales_person", "Nama PIC", "Sales"])
        .astype(str)
        .str.strip()
    )

    # Division comes from imports.division (e.g. BIDDING / MSDC / SALES / MARKETING / OTHER)
    df["source_division"] = division

    # Funnel stage: default to "leads"
    df["funnel_stage"] = (
        pick_series(df, ["funnel_stage"], default="leads")
        .fillna("leads")
        .astype(str)
        .str.strip()
    )

    # Revenue: try to coerce to numeric
    est = pick_series(df, ["est_revenue", "Est Revenue", "estimated_revenue"], default=np.nan)
    df["est_revenue"] = pd.to_numeric(est, errors="coerce")

    # Segment (optional)
    if "Segment" in df.columns:
        df["segment"] = df["Segment"].astype(str).str.strip()
    else:
        df["segment"] = np.nan

    # Canonical names
    df["company_name_canonical"] = df["company_name"].apply(canonicalize_company)
    df["project_name_canonical"] = df["project_name"].apply(canonicalize_project)

    return df


def make_json_safe(df: pd.DataFrame) -> pd.DataFrame:
    """Return a copy of df safe to serialise as JSON."""
    def _to_safe(v):
        if pd.isna(v):
            return None
        if isinstance(v, (pd.Timestamp, dt.datetime)):
            return v.isoformat()
        return v

    out = df.copy()
    for col in out.columns:
        out[col] = out[col].map(_to_safe)
    return out


# ---------------------------------------------------------------------------
# Staging inserts
# ---------------------------------------------------------------------------

def insert_staging_raw(cur, import_id: str, tenant_id: str, df_raw: pd.DataFrame) -> int:
    """Insert raw rows into stg_raw_rows (jsonb payloads)."""

    df = make_json_safe(df_raw)
    records = df.to_dict(orient="records")

    rows = [
        (import_id, idx + 1, Json(record))
        for idx, record in enumerate(records)
    ]

    execute_values(
        cur,
        """
        INSERT INTO stg_raw_rows (import_id, row_number, raw_json)
        VALUES %s
        """,
        rows,
    )
    return len(records)


def insert_staging_clean(cur, import_id: str, tenant_id: str, df_clean: pd.DataFrame) -> int:
    """Insert cleaned rows into stg_clean_rows."""
    df = df_clean.copy()

    rows = []
    for idx, row in df.iterrows():
        rows.append(
            (
                import_id,
                idx + 1,  # row_number 1-based
                row.get("company_name"),
                row.get("company_name_canonical"),
                row.get("project_name"),
                row.get("project_name_canonical"),
                row.get("sales_person"),
                row.get("source_division"),
                row.get("funnel_stage"),
                row.get("est_revenue"),
                row.get("segment"),
            )
        )

    execute_values(
        cur,
        """
        INSERT INTO stg_clean_rows (
          import_id,
          row_number,
          company_name,
          company_name_canonical,
          project_name,
          project_name_canonical,
          sales_person,
          source_division,
          funnel_stage,
          est_revenue,
          segment
        )
        VALUES %s
        """,
        rows,
    )

    return len(rows)


# ---------------------------------------------------------------------------
# Upserts into final tables
# ---------------------------------------------------------------------------

def upsert_dimension_tables(cur, tenant_id: str, import_id: str) -> None:
    """
    Upsert data dari stg_clean_rows ke companies dan opportunities
    untuk satu import_id dan tenant_id tertentu.
    """

    # 1) Upsert companies
    #    - 1 company per (tenant_id, name_canonical)
    cur.execute(
        """
        INSERT INTO companies (
          tenant_id,
          name,
          name_canonical,
          segment
        )
        SELECT DISTINCT
          %s::uuid AS tenant_id,
          sc.company_name,
          sc.company_name_canonical,
          sc.segment
        FROM stg_clean_rows sc
        WHERE sc.import_id = %s::uuid
          AND sc.company_name IS NOT NULL
          AND sc.company_name_canonical IS NOT NULL
        ON CONFLICT (tenant_id, name_canonical)
        DO UPDATE SET
          segment   = EXCLUDED.segment,
          updated_at = NOW();
        """,
        (tenant_id, import_id),
    )

    # 2) Upsert opportunities
    #    - unik per (tenant_id, company_id, project_name_canonical)
    cur.execute(
        """
        INSERT INTO opportunities (
          tenant_id,
          company_id,
          project_name,
          project_name_canonical,
          stage,
          amount,
          source_division,
          created_at
        )
        SELECT
          %s::uuid AS tenant_id,
          c.id AS company_id,
          sc.project_name,
          sc.project_name_canonical,
          sc.funnel_stage AS stage,
          sc.est_revenue AS amount,
          sc.source_division,
          COALESCE(sc.created_at, NOW())
        FROM stg_clean_rows sc
        JOIN companies c
          ON c.tenant_id      = %s::uuid
         AND c.name_canonical = sc.company_name_canonical
        WHERE sc.import_id = %s::uuid
          AND sc.project_name IS NOT NULL
          AND sc.project_name_canonical IS NOT NULL
        ON CONFLICT (tenant_id, company_id, project_name_canonical)
        DO UPDATE SET
          stage                  = EXCLUDED.stage,
          amount                 = EXCLUDED.amount,
          source_division        = EXCLUDED.source_division,
          project_name           = EXCLUDED.project_name,
          project_name_canonical = EXCLUDED.project_name_canonical,
          updated_at             = NOW();
        """,
        (tenant_id, tenant_id, import_id),
    )


# ---------------------------------------------------------------------------
# Imports table helpers
# ---------------------------------------------------------------------------

def lock_import(cur, import_id: str) -> Tuple[str, str, str]:
    """Fetch and lock the import row; return (tenant_id, storage_path, division)."""
    cur.execute(
        """
        SELECT tenant_id, storage_path, division
        FROM imports
        WHERE id = %s
        FOR UPDATE
        """,
        (import_id,),
    )
    row = cur.fetchone()
    if not row:
        raise RuntimeError(f"Import {import_id} not found")
    return row["tenant_id"], row["storage_path"], row["division"]


def mark_status(
    cur,
    import_id: str,
    status: str,
    rows_in=None,
    rows_out=None,
    error_log=None,
) -> None:
    """Update imports.status and optional metrics."""
    cur.execute(
        """
        UPDATE imports
        SET status = %s,
            rows_in = COALESCE(%s, rows_in),
            rows_out = COALESCE(%s, rows_out),
            error_log = %s
        WHERE id = %s
        """,
        (status, rows_in, rows_out, error_log, import_id),
    )


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run_import(import_id: str) -> None:
    """Run ETL for a single import_id."""
    conn = get_db_connection()
    try:
        with conn:
            cur = conn.cursor()
            tenant_id, storage_path, division = lock_import(cur, import_id)
            mark_status(cur, import_id, "RUNNING", error_log=None)

        # Download + parse file (outside transaction)
        file_bytes = download_from_storage(storage_path, bucket=BUCKET_NAME)
        df_raw = load_dataframe_from_bytes(file_bytes, storage_path)
        rows_in = len(df_raw)

        df_clean = clean_and_normalize(df_raw, division)
        rows_out = len(df_clean)

        # Staging + upserts (inside transaction)
        with conn:
            cur = conn.cursor()
            insert_staging_raw(cur, import_id, tenant_id, df_raw)
            insert_staging_clean(cur, import_id, tenant_id, df_clean)
            upsert_dimension_tables(cur, tenant_id, import_id)
            mark_status(
                cur,
                import_id,
                "SUCCESS",
                rows_in=rows_in,
                rows_out=rows_out,
                error_log=None,
            )

        logger.info(
            "Import %s completed: rows_in=%s rows_out=%s",
            import_id,
            rows_in,
            rows_out,
        )
    except Exception:
        error_log = traceback.format_exc()
        logger.error("Import %s failed:\n%s", import_id, error_log)
        try:
            with conn:
                cur = conn.cursor()
                mark_status(cur, import_id, "FAILED", error_log=error_log)
        finally:
            conn.close()
        raise
    finally:
        if not conn.closed:
            conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python etl_worker.py <import_id>")
    run_import(sys.argv[1])
