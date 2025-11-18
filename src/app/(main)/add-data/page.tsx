"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

export default function AddDataPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
  };

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
          accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
        />

        {fileName && (
          <p className="upload-file-name" aria-live="polite">
            Selected file: {fileName}
          </p>
        )}
      </section>
    </div>
  );
}
