"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Process } from "@/lib/types";
import { contrastText } from "@/lib/contrast";
import { ProcessesList } from "./processes-list";

type Facets = {
  tags: { label: string; color: string; count: number }[];
  statuses: { status: string; color: string; count: number }[];
};

export function ProcessesExplorer({ processes }: { processes: Process[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const selectedTags = searchParams.getAll("tag");
  const selectedStatuses = searchParams.getAll("status");

  const facets = useMemo<Facets>(() => {
    const tagMap = new Map<string, { color: string; count: number }>();
    const statusMap = new Map<string, { color: string; count: number }>();
    for (const p of processes) {
      const prevS = statusMap.get(p.status);
      statusMap.set(p.status, {
        color: prevS?.color ?? p.cor,
        count: (prevS?.count ?? 0) + 1,
      });
      for (const t of p.tags ?? []) {
        if (!t?.label) continue;
        const prev = tagMap.get(t.label);
        tagMap.set(t.label, {
          color: prev?.color ?? t.color,
          count: (prev?.count ?? 0) + 1,
        });
      }
    }
    return {
      tags: Array.from(tagMap.entries())
        .map(([label, v]) => ({ label, color: v.color, count: v.count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      statuses: Array.from(statusMap.entries())
        .map(([status, v]) => ({ status, color: v.color, count: v.count }))
        .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
    };
  }, [processes]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return processes.filter((p) => {
      if (
        term &&
        !`${p.numero} ${p.objeto}`.toLowerCase().includes(term)
      )
        return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status))
        return false;
      if (selectedTags.length > 0) {
        const labels = new Set((p.tags ?? []).map((t) => t.label));
        if (!selectedTags.every((t) => labels.has(t))) return false;
      }
      return true;
    });
  }, [processes, q, selectedTags, selectedStatuses]);

  function buildHref(updater: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const qs = params.toString();
    return qs ? `/admin?${qs}` : "/admin";
  }

  function toggle(key: "tag" | "status", value: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);

    const groups: Record<"tag" | "status", string[]> = {
      tag: [...selectedTags],
      status: [...selectedStatuses],
    };

    if (groups[key].includes(value)) {
      groups[key] = groups[key].filter((v) => v !== value);
    } else {
      groups[key].push(value);
    }

    for (const k of ["tag", "status"] as const) {
      for (const v of groups[k]) params.append(k, v);
    }

    const qs = params.toString();
    router.replace(qs ? `/admin?${qs}` : "/admin", { scroll: false });
  }

  function clearAll() {
    router.replace("/admin", { scroll: false });
  }

  const hasActiveFilter =
    q.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0;

  // URL de export reusa os filtros visíveis na tela.
  const exportQs = searchParams.toString();
  const exportHref = exportQs
    ? `/api/admin/export?${exportQs}`
    : "/api/admin/export";

  return (
    <div className="space-y-8">
      <FilterBar
        q={q}
        facets={facets}
        selectedTags={selectedTags}
        selectedStatuses={selectedStatuses}
        onToggle={toggle}
        onClear={clearAll}
        hasActiveFilter={hasActiveFilter}
        totalShown={filtered.length}
        totalAll={processes.length}
        exportHref={exportHref}
        canExport={filtered.length > 0}
      />

      {filtered.length === 0 ? (
        <EmptyResult hasActiveFilter={hasActiveFilter} buildHref={buildHref} />
      ) : (
        <ProcessesList processes={filtered} />
      )}
    </div>
  );
}

function FilterBar({
  q,
  facets,
  selectedTags,
  selectedStatuses,
  onToggle,
  onClear,
  hasActiveFilter,
  totalShown,
  totalAll,
  exportHref,
  canExport,
}: {
  q: string;
  facets: Facets;
  selectedTags: string[];
  selectedStatuses: string[];
  onToggle: (key: "tag" | "status", value: string) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
  totalShown: number;
  totalAll: number;
  exportHref: string;
  canExport: boolean;
}) {
  return (
    <section className="border border-[--color-rule] bg-[--color-paper-soft]/40 p-5">
      {/* Busca textual + contagem + limpar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          action="/admin"
          method="get"
          className="flex w-full items-center gap-2 border border-[--color-rule] bg-white px-3 py-1.5 transition focus-within:border-[--color-claret] sm:w-auto"
        >
          <span className="font-serif text-base italic text-[--color-ink-dim]">
            ⌕
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="buscar por número ou objeto..."
            className="w-full bg-transparent py-1 font-sans text-sm text-[--color-ink] placeholder:italic placeholder:text-[--color-ink-mute] focus:outline-none sm:w-72"
          />
          {/* preserva chips ativos ao submeter o form */}
          {selectedTags.map((v) => (
            <input key={`t-${v}`} type="hidden" name="tag" value={v} />
          ))}
          {selectedStatuses.map((v) => (
            <input key={`s-${v}`} type="hidden" name="status" value={v} />
          ))}
        </form>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[--color-ink-dim]">
            Exibindo{" "}
            <span className="text-[--color-ink] tabular">{totalShown}</span> /{" "}
            {totalAll}
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-text text-xs"
            >
              Limpar filtros
            </button>
          )}
          <a
            href={canExport ? exportHref : undefined}
            aria-disabled={!canExport}
            title={
              canExport
                ? hasActiveFilter
                  ? `Exportar ${totalShown} processo(s) filtrado(s) em .xlsx`
                  : `Exportar todos os ${totalAll} processos em .xlsx`
                : "Nada para exportar"
            }
            className={`btn btn-text whitespace-nowrap text-xs ${
              canExport ? "" : "pointer-events-none opacity-40"
            }`}
          >
            ↓ Exportar .xlsx
          </a>
        </div>
      </div>

      {/* Tags */}
      {facets.tags.length > 0 && (
        <FacetGroup label="Tags">
          {facets.tags.map((t) => {
            const active = selectedTags.includes(t.label);
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => onToggle("tag", t.label)}
                aria-pressed={active}
                style={
                  active
                    ? {
                        backgroundColor: t.color,
                        color: contrastText(t.color),
                        borderColor: t.color,
                      }
                    : { borderColor: t.color, color: t.color }
                }
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                  active ? "" : "bg-white hover:bg-[--color-paper-soft]"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className="rounded-sm bg-black/10 px-1 font-mono text-[9px] tabular"
                  style={active ? {} : { color: t.color }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </FacetGroup>
      )}

      {/* Status — chips compactos com bolinha colorida */}
      {facets.statuses.length > 0 && (
        <FacetGroup label="Status">
          {facets.statuses.map((s) => {
            const active = selectedStatuses.includes(s.status);
            return (
              <button
                key={s.status}
                type="button"
                onClick={() => onToggle("status", s.status)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                  active
                    ? "border-[--color-ink] bg-white text-[--color-ink]"
                    : "border-[--color-rule] bg-white text-[--color-ink-dim] hover:border-[--color-ink-dim] hover:text-[--color-ink]"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate max-w-[18rem]">{s.status}</span>
                <span className="font-mono text-[9px] tabular text-[--color-ink-mute]">
                  {s.count}
                </span>
              </button>
            );
          })}
        </FacetGroup>
      )}
    </section>
  );
}

function FacetGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-[--color-rule-soft] pt-4 first-of-type:mt-5">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="label-eyebrow">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function EmptyResult({
  hasActiveFilter,
  buildHref,
}: {
  hasActiveFilter: boolean;
  buildHref: (updater: (p: URLSearchParams) => void) => string;
}) {
  return (
    <div className="border-y-2 border-double border-[--color-rule] py-20 text-center">
      <p className="label-eyebrow text-[--color-claret]">Sem resultados</p>
      <h3 className="headline mt-4 text-4xl text-[--color-ink]">
        Nenhum <em>processo</em> bate com os filtros.
      </h3>
      <p className="mx-auto mt-4 max-w-md font-serif text-base italic text-[--color-ink-dim]">
        {hasActiveFilter
          ? "Tente remover algum filtro ou ajuste o termo de busca."
          : "Cadastre o primeiro processo para começar a popular o painel."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {hasActiveFilter && (
          <Link
            href={buildHref((p) => {
              for (const k of Array.from(p.keys())) p.delete(k);
            })}
            className="btn btn-ghost"
          >
            Limpar filtros
          </Link>
        )}
        <Link href="/admin/new" className="btn btn-claret">
          + Novo processo
        </Link>
      </div>
    </div>
  );
}
