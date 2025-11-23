"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";

type ParsedData = {
  columns: string[];
  rows: Record<string, unknown>[];
};

type SourceDivision = "BIDDING" | "MSDC" | "SALES" | "MARKETING" | "OTHER";

const PREVIEW_LIMIT = 50;
const ACCEPTED_EXTENSIONS = new Set(["csv", "xls", "xlsx"]);
const DIVISION_OPTIONS: SourceDivision[] = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"];

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  return parts[parts.length - 1]?.toLowerCase() ?? "";
};

const parseCsvFile = (file: File): Promise<ParsedData> =>
  new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields?.filter(Boolean) ?? Object.keys(results.data[0] ?? {});
        resolve({ columns, rows: results.data.slice(0, PREVIEW_LIMIT) });
      },
      error: (error) => reject(error),
    });
  });

const parseExcelFile = async (file: File): Promise<ParsedData> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("No sheets found in this Excel file.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
  const columns = Object.keys(data[0] ?? {});

  return { columns, rows: data.slice(0, PREVIEW_LIMIT) };
};

// Lint: keep UI flow intact; complexity comes from validation and async branches.
// eslint-disable-next-line complexity
export default function AddDataPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [division, setDivision] = useState<SourceDivision>("SALES");
  const [fileName, setFileName] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const resetPreviewState = () => {
    setColumns([]);
    setRows([]);
    setParseError(null);
    setError(null);
    setSuccess(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  };

  // eslint-disable-next-line complexity
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    resetPreviewState();
    setFile(null);
    setFileName(file?.name ?? "");

    if (!file) {
      return;
    }

    const extension = getFileExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      setParseError("Unsupported file type. Please upload a .csv, .xls, or .xlsx file.");
      return;
    }

    setFile(file);
    setIsParsing(true);

    try {
      const parsed = extension === "csv" ? await parseCsvFile(file) : await parseExcelFile(file);
      const derivedColumns = parsed.columns.length > 0 ? parsed.columns : Object.keys(parsed.rows[0] ?? {});

      setColumns(derivedColumns);
      setRows(parsed.rows);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse file. Please try again.");
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  // eslint-disable-next-line complexity
  const handleProcess = async () => {
    if (!file) {
      setError("Please upload a file before processing.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("division", division);

      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as {
        importId?: string;
        status?: string;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        const errorMessage =
          payload?.error ?? payload?.message ?? "Failed to process file. Please try again or contact admin.";
        setError(errorMessage);
        return;
      }

      const successMessage =
        payload?.message ??
        "File successfully sent for processing. You can continue working while we clean and sync the data.";

      setSuccess(payload?.importId ? `${successMessage} (Import ID: ${payload.importId})` : successMessage);
    } catch {
      setError("Failed to process file. Please try again or contact admin.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPreview = () => {
    if (isParsing) {
      return <p className="text-muted-foreground text-sm">Parsing file, please wait...</p>;
    }

    if (rows.length === 0) {
      return <p className="text-muted-foreground text-sm">No rows found in this file.</p>;
    }

    return (
      <div className="border-border bg-card overflow-x-auto rounded-lg border shadow-sm">
        <table className="divide-border min-w-full divide-y text-sm" aria-label="Parsed file preview">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="text-foreground px-4 py-2 text-left font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="text-foreground px-4 py-2 whitespace-pre-wrap">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const isProcessButtonDisabled = !file || isParsing || rows.length === 0 || isProcessing;
  const hasStatusMessage = [fileName, parseError, success, error].some(Boolean);
  const hasPreviewContent = [isParsing, file, rows.length > 0, columns.length > 0].some(Boolean);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="page-title">Add data file</h1>
        <p className="page-subtitle">
          Upload CSV or Excel files to prepare them for cleaning and syncing into the Infomedia Sales Funnel dashboard.
        </p>
      </header>

      <section className="space-y-4">
        <div role="button" tabIndex={0} className="upload-card" onClick={openFilePicker} onKeyDown={handleKeyDown}>
          <span className="upload-plus">+</span>
          <p className="text-base font-medium text-black">Click to add a CSV/Excel file</p>
          <p className="upload-note">We support .csv and .xlsx</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          aria-label="Upload CSV or Excel file"
        />

        {hasStatusMessage && (
          <div className="space-y-1">
            {fileName && (
              <p className="upload-file-name" aria-live="polite">
                Selected file: {fileName}
              </p>
            )}
            {parseError && (
              <p className="text-sm text-red-600 dark:text-red-400" aria-live="assertive">
                {parseError}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-500" aria-live="polite">
                {success}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" aria-live="assertive">
                {error}
              </p>
            )}
          </div>
        )}

        {hasPreviewContent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">Preview (first 50 rows)</h2>
              {isParsing && <span className="text-muted-foreground text-sm">Parsing file, please wait...</span>}
            </div>
            {renderPreview()}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-foreground block text-sm font-medium" htmlFor="division-select">
            Source division
          </label>
          <select
            id="division-select"
            className="border-border bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
            value={division}
            onChange={(event) => setDivision(event.target.value as SourceDivision)}
          >
            {DIVISION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            Choose the division that provided this file. This tags the import and drives downstream cleaning rules.
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={handleProcess} disabled={isProcessButtonDisabled} aria-label="Process and sync file">
            {isProcessing ? "Processing..." : "Process & Sync to Database"}
          </Button>
        </div>
      </section>
    </div>
  );
}
