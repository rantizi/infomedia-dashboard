"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase";

export type AuthFormState = {
  error?: string;
  success?: boolean;
};

export async function signIn(_prevState: AuthFormState | undefined, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[signIn] Starting login for email:", email);

  // Validate inputs
  if (!email || !password) {
    console.log("[signIn] Validation failed: missing email or password");
    return { error: "Mohon isi Email dan Password Anda." };
  }

  // Create server-side Supabase client
  const supabase = await createServerClient();

  // Attempt sign in
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("[signIn] Supabase response:", { data, error: signInError });

  if (signInError) {
    console.log("[signIn] Login failed:", signInError.message);
    return { error: signInError.message };
  }

  console.log("[signIn] Login successful, redirecting to /dashboard");

  // On success, redirect to dashboard
  redirect("/dashboard");
}

export async function signUp(_prevState: AuthFormState | undefined, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[signUp] Starting signup for email:", email);

  // Validate inputs
  if (!email || !password) {
    console.log("[signUp] Validation failed: missing email or password");
    return { error: "Mohon isi Email dan Password Anda." };
  }

  // Create server-side Supabase client
  const supabase = await createServerClient();

  // Attempt sign up
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log("[signUp] Supabase response:", { data, error: signUpError });

  if (signUpError) {
    console.log("[signUp] Signup failed:", signUpError.message);
    return { error: signUpError.message };
  }

  console.log("[signUp] Signup successful, redirecting to /dashboard");

  // On success, redirect to dashboard
  redirect("/dashboard");
}
