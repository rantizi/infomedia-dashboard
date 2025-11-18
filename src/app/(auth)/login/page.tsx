import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { createServerClient } from "@/lib/supabase";

export default async function LoginPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
