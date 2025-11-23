import os
import re
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path

# ========== Konfigurasi path & parameter ==========
def _get_base_dir() -> Path:
    try:
        return Path(__file__).parent.resolve()
    except NameError:
        return Path.cwd().resolve()

BASE_DIR = _get_base_dir()

EXCEL_PATH = os.getenv("EXCEL_PATH", str(BASE_DIR / "Template LOP 2026 Upd_SF 041125.xlsx"))
OUTPUT_DIR = os.getenv("OUTPUT_DIR", str(BASE_DIR / "output"))
SHEET_NAME = os.getenv("SHEET_NAME", "").strip() or None

HEADER_ROW_ONE_BASED = int(os.getenv("HEADER_ROW_ONE_BASED", "3"))
HEADER_INDEX = max(HEADER_ROW_ONE_BASED - 1, 0)

# prioritas sumber untuk dedupe
SOURCE_PRIORITY = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"]

# ========== Helper: normalisasi ==========
def normalize_text(x: str) -> str:
    if pd.isna(x):
        return None
    x = str(x).strip()
    x = re.sub(r"\s+", " ", x)
    return x if x else None

def normalize_company(name: str) -> str:
    if not name or pd.isna(name):
        return None
    x = str(name).upper().strip()
    x = x.replace("P.T.", "PT").replace("PT.", "PT").replace(" C V ", " CV ")
    x = re.sub(r"\bP\s*T\b\.?", "PT", x)
    x = re.sub(r"\bC\s*V\b\.?", "CV", x)
    x = re.sub(r"\bT\s*B\s*K\b\.?", "TBK", x)
    x = re.sub(r"[.,;:/\\]+", " ", x)
    x = re.sub(r"\s+", " ", x).strip()
    return x

def parse_money(val):
    if pd.isna(val):
        return np.nan
    s = str(val).strip()
    if not s:
        return np.nan
    sign = "-" if s.startswith("-") else ""
    s = s.lstrip("+-")
    s = re.sub(r"[^0-9.,]", "", s)
    if not s:
        return np.nan
    last_dot = s.rfind(".")
    last_comma = s.rfind(",")
    dec_pos = max(last_dot, last_comma)
    if dec_pos == -1:
        cleaned = re.sub(r"[.,]", "", s)
    else:
        int_part = re.sub(r"[.,]", "", s[:dec_pos])
        frac_part = re.sub(r"[.,]", "", s[dec_pos + 1 :])
        cleaned = f"{int_part}.{frac_part}"
    try:
        return float(f"{sign}{cleaned}")
    except Exception:
        return np.nan

def parse_datetime(val):
    # Kept for backward compatibility; prefer vectorized branch below.
    if pd.isna(val):
        return pd.NaT
    return pd.to_datetime(val, errors="coerce", dayfirst=True)

def normalize_stage(stage):
    if pd.isna(stage): return None
    x = str(stage).strip().lower()
    mapping = {
        "lead": "leads", "leads": "leads",
        "prospect": "prospect",
        "qualified": "qualified", "qualify": "qualified",
        "submission": "submission", "submitted": "submission",
        "win": "win", "won": "win", "closed won": "win"
    }
    return mapping.get(x, x)

def normalize_source(src):
    if pd.isna(src): return "OTHER"
    x = str(src).strip().upper()
    if "BIDD" in x: return "BIDDING"
    if "MSDC" in x: return "MSDC"
    if "MARKET" in x or "MKT" in x: return "MARKETING"
    if "SALES" in x: return "SALES"
    return "OTHER"

def source_rank(src):
    src = normalize_source(src)
    return SOURCE_PRIORITY.index(src) if src in SOURCE_PRIORITY else len(SOURCE_PRIORITY) + 1

# ========== Peta alias -> canonical ==========
COLUMN_ALIASES = {
    "company_name":   ["nama_perusahaan", "nama perusahaan", "customer", "company", "account", "klien"],
    "project_name":   ["nama_project", "nama project", "judul", "project", "opportunity", "lop_name", "lop"],
    "sales_person":   ["sales", "pic_sales", "account_manager", "am", "owner", "nama am"],
    "source_division":["sumber", "divisi_sumber", "source", "asal data", "origin"],
    "funnel_stage":   ["stage", "status", "funnel", "tahap"],
    "est_revenue":    [ "nilai 2026",       # ← PRIORITAS UTAMA
                        "nilai project",   # fallback kalau tidak ada Nilai 2026
                        "nilai",
                        "value",
                        "amount",
                        "est_value",
                        "revenue",
                        "nominal",
                        "est win (mm)",
                        "est live (mm)",],
    "created_at":     ["tanggal", "created_at", "created date", "tgl dibuat", "date"],
    "updated_at":     ["updated_at", "last update", "tgl update", "modified"],
    "segment":       ["segment sales", "segment_sales", "segment"]
}

def canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    new_names = {}
    lower_cols = {str(c).lower().strip(): c for c in df.columns}
    for canon, aliases in COLUMN_ALIASES.items():
        for a in aliases:
            if a in lower_cols:
                new_names[lower_cols[a]] = canon
                break
    df = df.rename(columns={c: str(c).strip() for c in df.columns})
    return df.rename(columns=new_names)

def drop_unnamed_and_empty(df: pd.DataFrame) -> pd.DataFrame:
    cols = [c for c in df.columns if not str(c).startswith("Unnamed:")]
    df = df[cols]
    df = df.dropna(axis=1, how="all")
    df = df.dropna(axis=0, how="all")
    return df

# ========== 1) Read Excel (header di baris ke-3 default) ==========
print(f"Reading: {EXCEL_PATH}")
read_kwargs = dict(sheet_name=SHEET_NAME or 0, dtype=str, header=HEADER_INDEX)
df = pd.read_excel(EXCEL_PATH, **read_kwargs)

df = drop_unnamed_and_empty(df)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = [c[-1] if isinstance(c, tuple) else c for c in df.columns]
df = canonicalize_columns(df)

# Pastikan kolom kunci minimal ada
for required in ["company_name", "project_name", "funnel_stage", "source_division", "created_at"]:
    if required not in df.columns:
        df[required] = np.nan

# Trim semua kolom teks
for c in df.columns:
    df[c] = df[c].apply(normalize_text)

# Default sumber & fallback tanggal
if "source_division" not in df.columns or df["source_division"].isna().all():
    df["source_division"] = "SALES"

# Jika ada beberapa kandidat uang, pilih satu → est_revenue
money_candidates = [
    c for c in ["Nilai 2026", "est_revenue", "nilai project", "est win (mm)", "est live (mm)"]
    if c in df.columns
]

if money_candidates:
    df["est_revenue"] = df[money_candidates[0]]

# ========== 2) Cleaning kolom spesifik ==========
df["company_name"]    = df["company_name"].apply(normalize_company)
df["project_name"]    = df["project_name"].str.upper().str.strip()
df["funnel_stage"]    = df["funnel_stage"].apply(normalize_stage)
df["source_division"] = df["source_division"].apply(normalize_source)

if "est_revenue" in df.columns:
    df["est_revenue"] = df["est_revenue"].apply(parse_money).astype("float64")

for dt_col in ["created_at", "updated_at"]:
    if dt_col in df.columns:
        raw = df[dt_col]
        parsed = pd.to_datetime(raw, errors="coerce", dayfirst=True)
        serial_mask = parsed.isna()
        if serial_mask.any():
            serials = pd.to_numeric(raw, errors="coerce")
            serial_mask &= serials.notna()
            parsed.loc[serial_mask] = pd.to_datetime(
                serials.loc[serial_mask],
                unit="d",
                origin="1899-12-30",
                errors="coerce",
            )
        df[dt_col] = parsed

# Buang baris tanpa key
before_rows = len(df)
df = df[~(df["company_name"].isna() | df["project_name"].isna())].copy()
after_drop_key = len(df)

# ========== 3) Dedupe (company_name, project_name) + timestamp fallback ==========
df["_src_rank"] = df["source_division"].apply(source_rank)
upd = df["updated_at"] if "updated_at" in df.columns else pd.Series(pd.NaT, index=df.index)
cre = df["created_at"] if "created_at" in df.columns else pd.Series(pd.NaT, index=df.index)
df["_ts"] = upd.fillna(cre)

df = df.sort_values(by=["company_name", "project_name", "_src_rank", "_ts"],
                    ascending=[True, True, True, False])
df = df.drop_duplicates(subset=["company_name", "project_name"], keep="first").copy()
df = df.drop(columns=["_src_rank", "_ts"])

# Audit
df["ingested_at_utc"] = pd.Timestamp.now(tz=timezone.utc)

# ========== 4) Validasi ringkas ==========
issues = {}
allowed_stages = {"leads", "prospect", "qualified", "submission", "win", None}
bad_stage = df[~df["funnel_stage"].isin(allowed_stages)]
if len(bad_stage) > 0:
    issues["invalid_stage_rows"] = len(bad_stage)

if "est_revenue" in df.columns:
    neg_rev = df[df["est_revenue"] < 0]
    if len(neg_rev) > 0:
        issues["negative_revenue_rows"] = len(neg_rev)

missing_created = df["created_at"].isna().sum()
if missing_created > 0:
    issues["missing_created_at"] = int(missing_created)

print("\n=== VALIDATION SUMMARY ===")
print(f"Rows read                : {before_rows}")
print(f"Rows after drop key-null : {after_drop_key}")
print(f"Rows after dedupe        : {len(df)}")
if issues:
    for k, v in issues.items():
        print(f"- {k}: {v}")
else:
    print("- No critical issues found.")

print("\n=== QUICK STATS ===")
if "funnel_stage" in df.columns:
    print("By funnel_stage:")
    print(df["funnel_stage"].value_counts(dropna=False))
if "source_division" in df.columns:
    print("\nBy source_division:")
    print(df["source_division"].value_counts(dropna=False))

# —— Pretty print describe tanpa scientific notation, 3 desimal ——
if "est_revenue" in df.columns:
    print("\nRevenue (est_revenue) describe:")
    desc = df["est_revenue"].describe()
    def _fmt(v):
        if pd.isna(v):
            return "NaN"
        # tampilkan count sebagai integer dengan ribuan
        if isinstance(v, (int, np.integer)) or (isinstance(v, float) and v.is_integer()):
            return f"{int(v):,}"
        # angka lain: ribuan + 3 desimal
        return f"{float(v):,.3f}"
    for k, v in desc.items():
        print(f"{k:>6}  {_fmt(v)}")

# ========== 5) Export hasil ==========
try:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
except Exception as e:
    print(f"Failed to create output dir {OUTPUT_DIR}: {e}")
    sys.exit(1)

# nama file: gunakan UTC lalu jadikan naive untuk string
ts = datetime.now(timezone.utc).replace(tzinfo=None).strftime("%Y%m%d-%H%M%S")

csv_path = os.path.join(OUTPUT_DIR, f"lop_clean_{ts}.csv")
xlsx_path = os.path.join(OUTPUT_DIR, f"lop_clean_{ts}.xlsx")
pq_path  = os.path.join(OUTPUT_DIR, f"lop_clean_{ts}.parquet")

written = []
failed = []

try:
    df.to_csv(csv_path, index=False, encoding="utf-8")
    written.append(csv_path)
except Exception as e:
    failed.append((csv_path, e))

# sebelum to_excel: hilangkan timezone agar Excel tidak error
for col in df.select_dtypes(include=["datetimetz"]).columns:
    try:
        df[col] = df[col].dt.tz_convert(None)
    except AttributeError:
        df[col] = df[col].dt.tz_localize(None)

try:
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="cleaned")
        # ringkasan sederhana (jika kolom tersedia)
        try:
            summary_stage = df.pivot_table(index="funnel_stage", values="project_name", aggfunc="count").rename(columns={"project_name":"rows"})
            summary_src   = df.pivot_table(index="source_division", values="project_name", aggfunc="count").rename(columns={"project_name":"rows"})
            summary_stage.to_excel(writer, sheet_name="summary", startrow=0)
            summary_src.to_excel(writer,   sheet_name="summary", startrow=len(summary_stage)+3)
        except Exception:
            pass
    written.append(xlsx_path)
except Exception as e:
    failed.append((xlsx_path, e))

# Parquet (cepat untuk analitik lanjut)
try:
    df.to_parquet(pq_path, index=False)
    written.append(pq_path)
except Exception as e:
    failed.append((pq_path, e))

print("\nSaved to:")
for path in written:
    print(f"- {path}")
if failed:
    print("\nSkipped/failed:")
    for path, err in failed:
        print(f"- {path}: {err}")
