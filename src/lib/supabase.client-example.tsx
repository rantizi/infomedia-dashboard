"use client";

/**
 * CLIENT COMPONENT EXAMPLE — Supabase Usage
 *
 * This example demonstrates how to use createClient() in a Next.js Client Component
 * (with 'use client' directive at the top).
 *
 * Location: src/lib/supabase.client-example.tsx
 * Status: Reference file, do NOT commit to repo.
 */

import { useEffect, useState } from "react";

import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Database["public"]["Tables"]["companies"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // createClient() is safe here because @/lib/supabase uses only NEXT_PUBLIC_* env vars,
  // which are inlined by Next.js build and available in the browser.
  const supabase = createClient();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error: err } = await supabase.from("companies").select("*").limit(10);

        if (err) {
          setError(err.message);
        } else {
          setCompanies(data || []);
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [supabase]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Companies (Client Component)</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, idx) => (
            <tr key={idx}>
              <td>{idx}</td>
              <td>
                <pre>{JSON.stringify(company, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
