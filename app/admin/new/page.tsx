import Link from "next/link";
import { ProcessForm } from "../process-form";
import { createProcess } from "../actions";
import { fetchKnownTags } from "../tag-helpers";

export const dynamic = "force-dynamic";

export default async function NewProcessPage() {
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
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-serif text-3xl italic text-[--color-claret]">§</span>
          <p className="label-eyebrow text-[--color-claret]">Novo registro</p>
        </div>
        <h1 className="headline mt-3 text-6xl text-[--color-ink] sm:text-7xl">
          Cadastrar <em>processo</em>.
        </h1>
        <p className="mt-3 max-w-xl font-serif text-lg italic text-[--color-ink-dim]">
          O processo aparecerá no painel público imediatamente após salvar.
        </p>
      </header>

      <ProcessForm
        action={createProcess}
        submitLabel="Cadastrar processo"
        knownTags={knownTags}
      />
    </div>
  );
}
