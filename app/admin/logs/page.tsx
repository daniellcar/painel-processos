import { createClient } from "@/lib/supabase/server";
import type { ProcessEvent } from "@/lib/types";
import { LogsClient } from "./logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("process_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
      <div className="mb-10">
        <p className="label-eyebrow text-[--color-claret]">Histórico</p>
        <h1 className="headline mt-2 text-5xl text-[--color-ink]">Logs.</h1>
        <p className="mt-3 font-serif text-lg italic text-[--color-ink-dim]">
          Todas as modificações registradas — ordem cronológica decrescente.
        </p>
      </div>

      <LogsClient initialEvents={(data as ProcessEvent[] | null) ?? []} />
    </div>
  );
}
