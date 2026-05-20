import { createClient } from "@/lib/supabase/server";
import type { Process } from "@/lib/types";
import { Board } from "./board";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: processes } = await supabase
    .from("processes")
    .select("*")
    .order("updated_at", { ascending: false });

  return <Board initial={(processes as Process[] | null) ?? []} />;
}
