import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type EnvLookupContext = {
  /** Where the lookup is happening, used for helpful error messages. */
  context: string;
  /** Optional override for the missing-variable guidance. */
  guidance?: string;
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

function readEnvVar(name: string): string | undefined {
  if (!hasOwnProperty.call(process.env, name)) {
    return undefined;
  }

  const value = process.env[name as keyof NodeJS.ProcessEnv];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireEnv(keys: string[], { context, guidance }: EnvLookupContext): string {
  for (const key of keys) {
    const value = readEnvVar(key);
    if (value) {
      return value;
    }
  }

  const printableKeys = keys.map((key) => `\`${key}\``).join(" or ");
  const defaultGuidance = `Set ${printableKeys} in your environment (.env.local) before calling ${context}.`;
  throw new Error(guidance ?? defaultGuidance);
}

/**
 * Create a typed Supabase client for use in client components (browser).
 *
 * Use this in React client components (Client Components / useEffect, event
 * handlers) where the runtime is the browser and you must use the
 * NEXT_PUBLIC_* environment variables. Do NOT call this from server-only
 * code (API routes / route handlers / server components) — use
 * `createServerClient()` there.
 *
 * This helper is safe for client code because it reads only NEXT_PUBLIC
 * env vars which are inlined by Next.js and therefore available in the
 * browser bundle. It returns a SupabaseClient strongly typed with your
 * project's Database schema.
 *
 * @throws {Error} if required NEXT_PUBLIC env vars are missing at runtime.
 *
 * @example
 *   const supabase = createClient()
 *   const { data, error } = await supabase.from('companies').select('*')
 */
export function createClient(): SupabaseClient<Database> {
  const url = requireEnv(["NEXT_PUBLIC_SUPABASE_URL"], {
    context: "createClient()",
    guidance:
      "Missing NEXT_PUBLIC_SUPABASE_URL in environment. Set it in .env.local (see .env.example) so browser code can reach Supabase.",
  });
  const anonKey = requireEnv(["NEXT_PUBLIC_SUPABASE_ANON_KEY"], {
    context: "createClient()",
    guidance:
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment. Set it in .env.local (see .env.example) before using createClient().",
  });

  try {
    return createSupabaseClient<Database>(url, anonKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize Supabase client: ${message}. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are valid.`,
    );
  }
}

/**
 * Create a Supabase client for use in server-side code (route handlers,
 * server components, or background workers) using the Service Role key.
 *
 * This must never be called from client code. The helper reads the
 * `SUPABASE_SERVICE_ROLE_KEY` from `process.env` and therefore will not be
 * bundled into the client. Do NOT reference `window` or other browser
 * globals in code that calls this function.
 *
 * Use this inside Next.js route handlers or any server-only module when you
 * need elevated privileges (for example, to bypass RLS for ETL or
 * administrative operations). Keep the service role key secret.
 *
 * @throws {Error} if required env vars are missing.
 *
 * @example
 *   const supabase = createServerClient()
 *   const { data, error } = await supabase.from('companies').select('*')
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = requireEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"], {
    context: "createServerClient()",
    guidance:
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL as a fallback) in environment. Provide it in .env.local for server-side access.",
  });
  const serviceRole = requireEnv(["SUPABASE_SERVICE_ROLE_KEY"], {
    context: "createServerClient()",
    guidance:
      "Missing SUPABASE_SERVICE_ROLE_KEY in environment. Set it in .env.local (server-only, never expose to client).",
  });

  try {
    return createSupabaseClient<Database>(url, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize Supabase server client: ${message}. Ensure SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are valid.`,
    );
  }
}

export type { SupabaseClient };
