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

  // Validate inputs
  if (!email || !password) {
    return { error: "Mohon isi Email dan Password Anda." };
  }

  // Create server-side Supabase client
  const supabase = await createServerClient();

  // Attempt sign in
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  // On success, redirect to dashboard
  redirect("/dashboard");
}

export async function signUp(_prevState: AuthFormState | undefined, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate inputs
  if (!email || !password) {
    return { error: "Mohon isi Email dan Password Anda." };
  }

  // Create server-side Supabase client
  const supabase = await createServerClient();

  // Attempt sign up
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // On success, redirect to dashboard
  redirect("/dashboard");
}
