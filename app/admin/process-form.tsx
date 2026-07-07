"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Process, Tag } from "@/lib/types";
import { contrastText } from "@/lib/contrast";

const PRESET_COLORS = [
  { name: "Marinho", value: "#0E1A2D" },
  { name: "Claret", value: "#7A1F12" },
  { name: "Esmeralda", value: "#1E4D3F" },
  { name: "Bronze", value: "#9C7846" },
  { name: "Tijolo", value: "#B33A2A" },
  { name: "Oliva", value: "#5C672D" },
  { name: "Real", value: "#3D4F8C" },
  { name: "Borgonha", value: "#5C170D" },
  { name: "Carvão", value: "#3A3F4A" },
  { name: "Pergaminho", value: "#8E7B5A" },
];

type Props = {
  initial?: Process;
  action: (formData: FormData) => Promise<{ ok: false; error: string } | undefined>;
  submitLabel: string;
  knownTags?: Tag[];
};

export function ProcessForm({ initial, action, submitLabel, knownTags = [] }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(initial?.cor ?? PRESET_COLORS[0].value);
  const [statusPreview, setStatusPreview] = useState(initial?.status ?? "");
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagTipo, setNewTagTipo] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].value);
  const [tagHint, setTagHint] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const suggestRef = useRef<HTMLDivElement | null>(null);
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  const suggestions = useMemo(() => {
    const term = newTagLabel.trim().toLowerCase();
    if (!term) return [];
    const used = new Set(tags.map((t) => t.label.toLowerCase()));
    return knownTags
      .filter(
        (t) =>
          t.label.toLowerCase().includes(term) &&
          !used.has(t.label.toLowerCase()),
      )
      .slice(0, 8);
  }, [newTagLabel, knownTags, tags]);

  // Tipos já usados em tags anteriores — viram sugestões no datalist,
  // evitando que a mesma coluna do .xlsx se fragmente por variação de grafia.
  const knownTipos = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const t of knownTags) {
      const tipo = t.tipo?.trim();
      if (tipo && !byKey.has(tipo.toLowerCase())) {
        byKey.set(tipo.toLowerCase(), tipo);
      }
    }
    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
  }, [knownTags]);

  // Sempre acessar pelo índice efetivo evita estados intermediários que
  // forçariam um setState dentro de useEffect só para "consertar" o range.
  const activeSuggestIndex =
    suggestions.length === 0
      ? 0
      : Math.min(Math.max(suggestIndex, 0), suggestions.length - 1);

  function handleTagLabelChange(value: string) {
    setNewTagLabel(value);
    setSuggestOpen(true);
    setSuggestIndex(0);
    setTagHint(null);
    // Se a label bate exatamente com uma tag conhecida, alinha cor e tipo
    // automaticamente — Enter já cria a tag como ela era antes.
    const term = value.trim().toLowerCase();
    if (!term) return;
    const exact = knownTags.find((t) => t.label.toLowerCase() === term);
    if (exact) {
      setNewTagColor(exact.color);
      if (exact.tipo) setNewTagTipo(exact.tipo);
    }
  }

  // Fecha dropdown ao clicar fora.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!suggestRef.current) return;
      if (suggestRef.current.contains(e.target as Node)) return;
      if (tagInputRef.current?.contains(e.target as Node)) return;
      setSuggestOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function addTag(override?: Tag) {
    const tipo = newTagTipo.trim();
    // Tag digitada do zero exige tipo — ele nomeia a coluna no .xlsx.
    if (!override && !tipo) {
      if (newTagLabel.trim()) {
        setTagHint("Informe o tipo da tag — ele vira o nome da coluna no .xlsx.");
      }
      return;
    }
    const candidate: Tag = override ?? {
      label: newTagLabel.trim(),
      color: newTagColor,
      tipo,
    };
    if (!candidate.label) return;
    if (
      tags.some(
        (t) => t.label.toLowerCase() === candidate.label.toLowerCase(),
      )
    ) {
      setNewTagLabel("");
      setSuggestOpen(false);
      return;
    }
    setTags([...tags, candidate]);
    setNewTagLabel("");
    setTagHint(null);
    setSuggestOpen(false);
    setSuggestIndex(0);
  }

  function pickSuggestion(t: Tag) {
    // Sugestão antiga sem tipo herda o tipo digitado no campo, se houver.
    const fallbackTipo = newTagTipo.trim();
    addTag({
      ...t,
      ...(t.tipo ? {} : fallbackTipo ? { tipo: fallbackTipo } : {}),
    });
  }

  function removeTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("cor", color);
    fd.set("tags", JSON.stringify(tags));
    // Converte datetime-local (interpretado como horário local do browser)
    // para ISO com timezone — evita o servidor em UTC reinterpretar como UTC.
    const localValue = fd.get("data_sessao");
    if (typeof localValue === "string" && localValue.length > 0) {
      const isoLocal = new Date(localValue).toISOString();
      fd.set("data_sessao", isoLocal);
    }
    startTransition(async () => {
      const res = await action(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
      {/* Form fields */}
      <div className="space-y-9">
        <Field label="Número do processo" hint="único · obrigatório">
          <input
            name="numero"
            required
            defaultValue={initial?.numero}
            placeholder="ex: 2026/0001-A"
            className="field-input field-mono"
          />
        </Field>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Nº da modalidade" hint="opcional · ex: 3, 12, 68">
            <input
              name="numero_modalidade"
              defaultValue={initial?.numero_modalidade ?? ""}
              placeholder="ex: 3"
              className="field-input field-mono"
            />
          </Field>

          <Field label="Nº do convênio" hint="opcional · exibido como etiqueta azul">
            <input
              name="numero_convenio"
              defaultValue={initial?.numero_convenio ?? ""}
              placeholder="ex: 967148"
              className="field-input field-mono"
            />
          </Field>
        </div>

        <Field label="Objeto" hint="descrição resumida · obrigatório">
          <textarea
            name="objeto"
            required
            defaultValue={initial?.objeto}
            rows={3}
            placeholder="Aquisição de equipamentos para o setor administrativo..."
            className="field-textarea"
          />
        </Field>

        <Field label="Status atual" hint="texto livre · será exibido em CAIXA ALTA">
          <input
            name="status"
            required
            defaultValue={initial?.status}
            onChange={(e) => setStatusPreview(e.target.value)}
            placeholder="ex: em análise"
            className="field-input field-mono"
            style={{ textTransform: "uppercase" }}
          />
        </Field>

        <Field label="Data da sessão" hint="opcional · piscará no telão quando faltar < 24h">
          <input
            name="data_sessao"
            type="datetime-local"
            defaultValue={toLocalDateTime(initial?.data_sessao)}
            className="field-input field-mono"
          />
        </Field>

        <Field
          label="Tags"
          hint="opcional · o tipo nomeia a coluna correspondente no .xlsx"
        >
          <div className="space-y-3">
            <div className="flex min-h-[2.25rem] flex-wrap items-center gap-2">
              {tags.length === 0 ? (
                <span className="font-serif text-sm italic text-[--color-ink-mute]">
                  Nenhuma tag adicionada.
                </span>
              ) : (
                tags.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: t.color,
                      color: contrastText(t.color),
                    }}
                    className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-sans text-xs font-medium uppercase tracking-wide"
                  >
                    {t.tipo && (
                      <span className="font-normal opacity-70">{t.tipo} ·</span>
                    )}
                    {t.label}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="text-base leading-none opacity-70 hover:opacity-100"
                      aria-label="Remover tag"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-stretch gap-2">
              <div className="relative min-w-[14rem] flex-1">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={newTagLabel}
                  onChange={(e) => handleTagLabelChange(e.target.value)}
                  onFocus={() => {
                    if (newTagLabel.trim()) setSuggestOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (suggestOpen && suggestions.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSuggestIndex(
                          (activeSuggestIndex + 1) % suggestions.length,
                        );
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSuggestIndex(
                          (activeSuggestIndex - 1 + suggestions.length) %
                            suggestions.length,
                        );
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setSuggestOpen(false);
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        pickSuggestion(suggestions[activeSuggestIndex]);
                        return;
                      }
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Nova tag (Enter para adicionar)"
                  className="field-input field-mono w-full"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestOpen && suggestions.length > 0}
                  aria-controls="tag-suggestions"
                  aria-autocomplete="list"
                />
                {suggestOpen && suggestions.length > 0 && (
                  <div
                    ref={suggestRef}
                    id="tag-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto border border-[--color-rule] bg-white shadow-lg"
                  >
                    {suggestions.map((t, i) => (
                      <button
                        key={t.label}
                        type="button"
                        role="option"
                        aria-selected={i === activeSuggestIndex}
                        onMouseEnter={() => setSuggestIndex(i)}
                        onClick={() => pickSuggestion(t)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
                          i === activeSuggestIndex
                            ? "bg-[--color-paper-soft]"
                            : "bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm border border-black/10"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="font-sans text-sm text-[--color-ink]">
                            {t.label}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-[--color-ink-mute]">
                          {t.tipo ?? "já usada"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                list="tag-tipos"
                value={newTagTipo}
                onChange={(e) => {
                  setNewTagTipo(e.target.value);
                  setTagHint(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Tipo (ex: Município)"
                className="field-input field-mono w-44"
                autoComplete="off"
                title="Tipo da tag — nomeia a coluna no .xlsx"
              />
              <datalist id="tag-tipos">
                {knownTipos.map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value.toUpperCase())}
                className="h-11 w-14 cursor-pointer border border-[--color-rule] bg-white"
                title="Cor da tag"
              />
              <button
                type="button"
                onClick={() => addTag()}
                className="btn btn-text whitespace-nowrap text-xs"
              >
                + Adicionar
              </button>
            </div>
            {tagHint && (
              <p className="font-serif text-xs italic text-[--color-claret]">
                {tagHint}
              </p>
            )}
          </div>
        </Field>

        {error && (
          <div className="border-l-2 border-[--color-claret] bg-[--color-claret-soft]/30 px-4 py-3 text-sm text-[--color-claret]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[--color-rule] pt-6">
          <Link href="/admin" className="btn btn-text">
            ← Cancelar
          </Link>
          <button type="submit" disabled={pending} className="btn btn-claret">
            {pending ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>

      {/* Color picker + preview */}
      <aside className="space-y-8 lg:sticky lg:top-32 lg:self-start">
        <div className="border border-[--color-rule] bg-[--color-paper-soft] p-6">
          <p className="label-eyebrow text-[--color-claret]">Cor associada</p>
          <p className="mt-1 font-serif text-base italic text-[--color-ink-dim]">
            Usada no painel para destacar visualmente o status.
          </p>

          <div className="mt-5 grid grid-cols-5 gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.name}
                aria-label={c.name}
                className={`relative aspect-square rounded-sm transition ${
                  color === c.value
                    ? "ring-2 ring-[--color-ink] ring-offset-2 ring-offset-[--color-paper-soft]"
                    : "hover:scale-105"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>

          <label className="mt-5 block">
            <span className="label-eyebrow">Hex personalizado</span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="h-11 w-14 cursor-pointer border border-[--color-rule] bg-white"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v.toUpperCase());
                }}
                maxLength={7}
                className="field-input field-mono"
              />
            </div>
          </label>
        </div>

        {/* Live preview card */}
        <div className="border border-[--color-rule] p-6">
          <p className="label-eyebrow">Pré-visualização</p>
          <div
            className="mt-4 flex items-center gap-3 border-l-4 bg-[--color-paper-soft] px-5 py-4"
            style={{ borderColor: color }}
          >
            <span className="color-chip" style={{ color }} />
            <span
              className="truncate font-sans text-base font-medium uppercase tracking-wide"
              style={{ color }}
            >
              {statusPreview || "STATUS"}
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}

function toLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="mb-2 flex items-baseline justify-between">
        <span className="field-label !mb-0">{label}</span>
        {hint && (
          <span className="font-serif text-xs italic text-[--color-ink-mute]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
