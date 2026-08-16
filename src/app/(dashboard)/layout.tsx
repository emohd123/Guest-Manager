import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?redirectTo=/dashboard");
  if (!(await ensureAppUserForAuthUser(supabase, user))) redirect("/account");
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
