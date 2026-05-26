import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Process } from "@/lib/types";
import { Logo } from "@/app/components/logo";
import { ProcessesExplorer } from "./processes-explorer";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .order("updated_at", { ascending: false });

  const processes: Process[] = (data as Process[] | null) ?? [];
  const lastUpdate = processes[0];

  const totalStr = String(processes.length).padStart(3, "0");
  const statusStr = String(
    new Set(processes.map((p) => p.status)).size,
  ).padStart(2, "0");
  const lastStr = lastUpdate
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(lastUpdate.updated_at))
    : "—";

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8 sm:px-12">
      {/* Cabeçalho compacto: título + stats inline + ação */}
      <section className="mb-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-[--color-rule] pb-5">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <p className="label-eyebrow text-[--color-claret]">
              Cadastro & gestão
            </p>
            <h1 className="headline mt-0.5 text-3xl text-[--color-ink] sm:text-4xl">
              Lista de <em>processos</em>.
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <InlineStat label="Total" value={totalStr} />
          <InlineStat label="Status" value={statusStr} />
          <InlineStat label="Atualizado" value={lastStr} />
          <Link
            href="/admin/new"
            className="btn btn-claret whitespace-nowrap"
          >
            + Novo processo
          </Link>
        </div>
      </section>

      {/* Explorer (filtros + lista) */}
      {error ? (
        <div className="border-l-2 border-[--color-claret] bg-[--color-claret-soft]/30 px-5 py-4 text-sm text-[--color-claret]">
          {error.message}
        </div>
      ) : (
        <ProcessesExplorer processes={processes} />
      )}
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 border-l border-[--color-rule] pl-6 first:border-l-0 first:pl-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[--color-ink-dim]">
        {label}
      </span>
      <span className="font-serif text-lg text-[--color-ink] tabular">
        {value}
      </span>
    </div>
  );
}
