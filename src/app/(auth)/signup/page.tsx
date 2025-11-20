import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { createServerClient } from "@/lib/supabase";

export default async function SignupPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
