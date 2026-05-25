import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Process } from "@/lib/types";
import { ProcessForm } from "../../process-form";
import { updateProcess } from "../../actions";
import { fetchKnownTags } from "../../tag-helpers";

export default async function EditProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const process = data as Process;
  const action = updateProcess.bind(null, id);
  const knownTags = await fetchKnownTags();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-12">
      <header className="mb-12 border-b border-[--color-rule] pb-6">
        <Link
          href="/admin"
          className="label-eyebrow hover:text-[--color-claret]"
        >
          ← Voltar à lista
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label-eyebrow text-[--color-claret]">Edição de registro</p>
            <h1 className="headline mt-3 text-5xl text-[--color-ink] sm:text-6xl">
              <em>Processo</em>{" "}
              <span className="font-mono text-4xl text-[--color-ink-2] sm:text-5xl">
                {process.numero}
              </span>
            </h1>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[--color-ink-dim]">
            <dt>Cadastrado</dt>
            <dd className="text-right text-[--color-ink-2]">{fmt(process.created_at)}</dd>
            <dt>Atualizado</dt>
            <dd className="text-right text-[--color-ink-2]">{fmt(process.updated_at)}</dd>
          </dl>
        </div>
      </header>

      <ProcessForm
        initial={process}
        action={action}
        submitLabel="Salvar alterações"
        knownTags={knownTags}
      />
    </div>
  );
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
