"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Process, Tag } from "@/lib/types";
import { contrastText } from "@/lib/contrast";
import { isAudioUnlocked, playBellSequence, unlockAudio } from "@/lib/bell-sound";
import { SessionAlertOverlay } from "./session-alert";

const ROWS_PER_PAGE = 6;
const PAGE_DURATION_MS = 7500;
// Janela após o horário em que ainda dispara alerta (60s).
// Evita alertas "velhos" caso a página recarregue muito depois.
const ALERT_WINDOW_MS = 60_000;

const TRANSITION = { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const };

export function Board({ initial }: { initial: Process[] }) {
  const [processes, setProcesses] = useState<Process[]>(initial);
  const [pageIndex, setPageIndex] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [alertQueue, setAlertQueue] = useState<Process[]>([]);
  const [audioReady, setAudioReady] = useState(false);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  // Hydrate clock client-side only
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Marca todas as sessões já passadas (fora da janela) como "já alertadas"
  // no mount inicial, para não disparar alerta retroativo ao recarregar.
  useEffect(() => {
    const nowMs = Date.now();
    for (const p of initial) {
      if (!p.data_sessao) continue;
      const sessionMs = new Date(p.data_sessao).getTime();
      if (nowMs - sessionMs >= ALERT_WINDOW_MS) {
        alertedIdsRef.current.add(p.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destrava o AudioContext na primeira interação do usuário.
  useEffect(() => {
    async function enable() {
      await unlockAudio();
      if (isAudioUnlocked()) setAudioReady(true);
    }
    function handler() {
      enable();
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    }
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  // Detecção de gatilho — verifica a cada tick do relógio.
  useEffect(() => {
    if (!now) return;
    const nowMs = now.getTime();
    const triggered: Process[] = [];
    for (const p of processes) {
      if (!p.data_sessao || alertedIdsRef.current.has(p.id)) continue;
      const sessionMs = new Date(p.data_sessao).getTime();
      const diff = nowMs - sessionMs;
      if (diff >= 0 && diff < ALERT_WINDOW_MS) {
        triggered.push(p);
        alertedIdsRef.current.add(p.id);
      }
    }
    if (triggered.length > 0) {
      setAlertQueue((q) => [...q, ...triggered]);
      playBellSequence();
    }
  }, [now, processes]);

  // Atalho de teste: pressionar "T" dispara um alerta com uma sessão de amostra.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "t") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      const sample =
        processes.find((p) => p.data_sessao) ?? processes[0];
      if (!sample) return;
      setAlertQueue((q) => [...q, sample]);
      playBellSequence();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [processes]);

  const dismissAlert = useCallback(() => {
    setAlertQueue((q) => q.slice(1));
  }, []);

  const currentAlert = alertQueue[0];

  // Realtime: processes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-processes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "processes" },
        async () => {
          const { data } = await supabase
            .from("processes")
            .select("*")
            .order("updated_at", { ascending: false });
          if (data) setProcesses(data as Process[]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const boardSorted = useMemo(
    () => [...processes].sort((a, b) => a.numero.localeCompare(b.numero)),
    [processes],
  );

  const pages = useMemo(() => {
    const chunks: Process[][] = [];
    for (let i = 0; i < boardSorted.length; i += ROWS_PER_PAGE) {
      chunks.push(boardSorted.slice(i, i + ROWS_PER_PAGE));
    }
    if (chunks.length === 0) chunks.push([]);
    return chunks;
  }, [boardSorted]);

  const totalPages = pages.length;

  useEffect(() => {
    if (pageIndex >= totalPages) setPageIndex(0);
  }, [totalPages, pageIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPageIndex((p) => (p + 1) % totalPages);
    }, PAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [pageIndex, totalPages]);

  const currentPage = pages[pageIndex];

  return (
    <div className="board-paper relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 grain" />

      {/* Top header */}
      <header className="relative z-10 border-b border-[--color-rule] px-12 py-6">
        <div className="flex items-end justify-between gap-8">
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-4xl italic text-[--color-claret]">§</span>
            <div>
              <div className="flex items-center gap-3">
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[--color-claret]">
                  <span className="live-dot absolute inset-0 rounded-full" />
                </span>
                <p className="label-eyebrow text-[--color-claret]">
                  Em transmissão · Atualização contínua
                </p>
              </div>
              <h1 className="headline mt-1.5 text-4xl text-[--color-ink] sm:text-5xl">
                Acompanhamento de <em>processos</em>.
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="label-eyebrow">{now ? formatDate(now) : "—"}</div>
            <div className="font-serif text-5xl tabular text-[--color-ink] sm:text-6xl">
              {now ? formatTime(now) : "—— : ——"}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-hidden px-12 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageIndex}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={TRANSITION}
          >
            <BoardPanel rows={currentPage ?? []} now={now} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[--color-rule] bg-[--color-paper-soft]/80 px-12 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="label-eyebrow">
              Tela{" "}
              <span className="font-mono text-[--color-claret]">
                {String(pageIndex + 1).padStart(2, "0")}
              </span>{" "}
              / {String(totalPages).padStart(2, "0")}
            </span>
            <PageIndicator count={totalPages} active={pageIndex} />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <span className="label-eyebrow">
              Total · <span className="text-[--color-ink] tabular">{processes.length}</span>
            </span>
            <span className="label-eyebrow">Listagem geral</span>
          </div>

          <span className="label-eyebrow">
            <span className="hidden sm:inline">Brasília · </span>BRT
          </span>
        </div>
      </footer>

      {/* Indicador discreto do estado do som */}
      <div className="pointer-events-none absolute right-6 top-6 z-40 flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            audioReady ? "bg-[--color-emerald]" : "bg-[--color-ink-mute]"
          }`}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[--color-ink-dim]">
          {audioReady ? "som ativo" : "toque a tela para ativar som"}
        </span>
      </div>

      {/* Alerta de abertura de sessão — overlay editorial dramático */}
      <AnimatePresence>
        {currentAlert && (
          <SessionAlertOverlay
            key={currentAlert.id + "-" + alertQueue.length}
            process={currentAlert}
            onDismiss={dismissAlert}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BoardPanel({ rows, now }: { rows: Process[]; now: Date | null }) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
        <p className="label-eyebrow text-[--color-claret]">Aguardando registros</p>
        <h2 className="headline text-6xl text-[--color-ink]">
          Nenhum <em>processo</em> em acompanhamento.
        </h2>
        <p className="max-w-xl font-serif text-xl italic text-[--color-ink-dim]">
          Os cadastros aparecem aqui em tempo real assim que forem registrados pelo painel
          administrativo.
        </p>
      </div>
    );
  }

  const padded: (Process | null)[] = Array.from(
    { length: ROWS_PER_PAGE },
    (_, i) => rows[i] ?? null,
  );

  return (
    <div>
      <div className="grid grid-cols-[200px_1fr_360px_180px] items-end gap-8 border-b border-[--color-ink] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[--color-ink-dim]">
        <span>Nº Processo</span>
        <span>Objeto</span>
        <span>Status</span>
        <span className="text-right">Data da Sessão</span>
      </div>

      <ul className="board-rows">
        {padded.map((row, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...TRANSITION, delay: 0.08 + i * 0.06 }}
            className="grid grid-cols-[200px_1fr_360px_180px] items-center gap-8 py-4"
          >
            {row ? (
              <>
                <span className="font-mono text-xl font-medium text-[--color-ink] tabular">
                  {row.numero}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span
                    className="truncate font-serif text-xl leading-snug text-[--color-ink]"
                    title={row.objeto}
                  >
                    {row.objeto}
                  </span>
                  {row.tags && row.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {row.tags.map((t, idx) => (
                        <TagPill key={idx} tag={t} />
                      ))}
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-3">
                  <span className="color-chip" style={{ color: row.cor }} />
                  <span
                    className="truncate font-sans text-xl font-medium uppercase tracking-wide"
                    style={{ color: row.cor }}
                  >
                    {row.status}
                  </span>
                </span>
                <SessionDateCell iso={row.data_sessao} now={now} />
              </>
            ) : (
              <span className="col-span-4 h-8" />
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function TagPill({ tag }: { tag: Tag }) {
  return (
    <span
      style={{ backgroundColor: tag.color, color: contrastText(tag.color) }}
      className="inline-flex items-center rounded px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em]"
    >
      {tag.label}
    </span>
  );
}

function SessionDateCell({
  iso,
  now,
}: {
  iso: string | null;
  now: Date | null;
}) {
  if (!iso) {
    return (
      <span className="text-right font-mono text-sm uppercase tracking-wide text-[--color-ink-mute]">
        —
      </span>
    );
  }

  const date = new Date(iso);
  const reference = now ?? new Date();
  const diffMs = date.getTime() - reference.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const isUpcomingSoon = diffMs > 0 && diffMs < oneDayMs;
  const isPast = diffMs < 0;

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isUpcomingSoon) {
    return (
      <span className="flex justify-end">
        <span className="blink-warning inline-block rounded px-3 py-1 text-right font-mono text-xl font-semibold uppercase tracking-wide tabular text-white">
          {formatted}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`text-right font-mono text-xl font-medium uppercase tracking-wide tabular ${
        isPast ? "text-[--color-ink-mute]" : "text-[--color-ink]"
      }`}
    >
      {formatted}
    </span>
  );
}

function PageIndicator({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-px transition-all ${
            i === active ? "w-8 bg-[--color-claret]" : "w-3 bg-[--color-rule-strong]"
          }`}
        />
      ))}
    </div>
  );
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(":", " : ");
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

