"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Process } from "@/lib/types";
import { contrastText } from "@/lib/contrast";
import { deleteProcess } from "./actions";

export function ProcessesList({ processes }: { processes: Process[] }) {
  return (
    <div>
      {/* Heading row */}
      <div className="grid grid-cols-[160px_72px_1fr_220px_170px_120px] items-center gap-6 border-b border-[--color-ink] pb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[--color-ink-dim]">
        <span>Nº Processo</span>
        <span>Modal.</span>
        <span>Objeto</span>
        <span>Status</span>
        <span>Data da Sessão</span>
        <span className="text-right">Ações</span>
      </div>

      <ul>
        {processes.map((p) => (
          <ProcessRow key={p.id} p={p} />
        ))}
      </ul>
    </div>
  );
}

function ProcessRow({ p }: { p: Process }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    startTransition(async () => {
      await deleteProcess(p.id);
    });
  }

  return (
    <li
      className={`group grid grid-cols-[160px_72px_1fr_220px_170px_120px] items-center gap-6 border-b border-[--color-rule-soft] py-5 transition hover:bg-[--color-paper-soft] ${
        pending ? "opacity-40" : ""
      }`}
    >
      <span className="truncate font-mono text-sm text-[--color-ink]">{p.numero}</span>
      <span className="font-mono text-sm tabular text-[--color-ink-dim]">
        {p.numero_modalidade ?? "—"}
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span
          className="truncate font-serif text-lg leading-snug text-[--color-ink]"
          title={p.objeto}
        >
          {p.objeto}
        </span>
        {(p.numero_convenio || (p.tags && p.tags.length > 0)) && (
          <div className="flex flex-wrap gap-1.5">
            {p.numero_convenio && (
              <span
                style={{ backgroundColor: "#2C6FAC", color: "#FFFFFF" }}
                className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em]"
              >
                {p.numero_convenio}
              </span>
            )}
            {p.tags?.map((t, i) => (
              <span
                key={i}
                style={{ backgroundColor: t.color, color: contrastText(t.color) }}
                className="inline-flex items-center rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="flex items-center gap-2.5">
        <span className="color-chip" style={{ color: p.cor }} />
        <span
          className="truncate font-sans text-sm font-medium uppercase tracking-wide"
          style={{ color: p.cor }}
        >
          {p.status}
        </span>
      </span>
      <span className="font-mono text-xs uppercase tracking-wide text-[--color-ink-dim]">
        {p.data_sessao ? formatDate(p.data_sessao) : "—"}
      </span>
      <span className="flex items-center justify-end gap-4">
        <Link href={`/admin/${p.id}/edit`} className="btn btn-text text-xs">
          Editar
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className={`btn btn-danger text-xs ${
            confirming ? "border-b border-[--color-claret] text-[--color-claret]" : ""
          }`}
        >
          {confirming ? "Confirmar?" : "Excluir"}
        </button>
      </span>
    </li>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date} · ${time}`;
}
