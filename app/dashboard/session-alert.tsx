"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Process } from "@/lib/types";
import { contrastText } from "@/lib/contrast";

const AUTO_DISMISS_SECONDS = 22;

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function SessionAlertOverlay({
  process,
  onDismiss,
}: {
  process: Process;
  onDismiss: () => void;
}) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          onDismiss();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onDismiss]);

  const sessionTime = process.data_sessao
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(process.data_sessao))
    : "—";

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <motion.div
      key={process.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center"
      style={{
        backgroundColor: "#05070D",
        // Vinheta — sutil halo de tinta no centro, breu pesado nas bordas
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(14,26,45,0.85) 0%, #000 100%)",
      }}
    >
      {/* Textura de papel discreta sobre o fundo escuro */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay grain"
      />

      {/* Banner superior — faixa de claret */}
      <motion.div
        initial={{ y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="absolute top-0 left-0 right-0 z-10 border-b-[3px] border-double border-[--color-paper-warm]/40 bg-[--color-claret-deep]"
      >
        <div className="flex items-center justify-between px-12 py-4">
          <div className="flex items-center gap-4">
            <span className="relative inline-block h-2 w-2 rounded-full bg-[--color-paper-warm]">
              <span
                className="absolute inset-0 rounded-full bg-[--color-paper-warm]"
                style={{ animation: "live-pulse 2.4s ease-out infinite" }}
              />
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-[0.45em] text-[--color-paper-warm]">
              Ao vivo · Pregão em abertura
            </span>
          </div>
          <span className="font-serif text-2xl italic text-[--color-paper-warm]">
            §  edição extra  §
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.35em] text-[--color-paper-warm]/80">
            {dateLabel}
          </span>
        </div>
      </motion.div>

      {/* Conteúdo principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
        className="relative z-0 mx-auto flex w-full max-w-6xl flex-col items-center px-12"
      >
        {/* Hora marcada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.45 }}
          className="flex items-baseline gap-6"
        >
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.5em] text-[--color-paper-warm]/70">
            Hora marcada
          </span>
          <span className="font-serif text-7xl tabular leading-none text-[--color-paper-soft] sm:text-8xl">
            {sessionTime.replace(":", " : ")}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
          className="mt-6 text-center font-serif italic leading-[0.85] text-[--color-paper-soft]"
          style={{ fontSize: "clamp(6rem, 14vw, 11rem)" }}
        >
          Abrir{" "}
          <em
            className="text-[--color-rust]"
            style={{ textShadow: "0 0 28px rgba(179,58,42,0.35)" }}
          >
            sessão.
          </em>
        </motion.h1>

        {/* Card do processo — proclamação em papel sobre o breu */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
          className="relative mt-12 w-full max-w-3xl bg-[--color-paper-soft] px-12 py-9"
          style={{
            border: "1px solid var(--color-rule-strong)",
            boxShadow:
              "0 40px 90px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05), 0 0 120px -30px rgba(179,58,42,0.18)",
          }}
        >
          {/* Bordas duplas internas — proclamação */}
          <div className="pointer-events-none absolute inset-2.5 border border-[--color-rule-strong]" />

          <dl className="relative grid grid-cols-[140px_1fr] gap-x-8 gap-y-4 text-left">
            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[--color-ink-dim]">
              Processo
            </dt>
            <dd className="font-mono text-2xl font-medium tabular text-[--color-ink]">
              {process.numero}
            </dd>

            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[--color-ink-dim]">
              Objeto
            </dt>
            <dd className="font-serif text-2xl leading-snug text-[--color-ink]">
              {process.objeto}
            </dd>

            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[--color-ink-dim]">
              Status
            </dt>
            <dd className="flex items-center gap-3">
              <span
                className="inline-block h-2 w-2 flex-none rounded-full"
                style={{ backgroundColor: process.cor }}
              />
              <span
                className="font-sans text-xl font-semibold uppercase tracking-wide"
                style={{ color: process.cor }}
              >
                {process.status}
              </span>
            </dd>

            {process.tags && process.tags.length > 0 && (
              <>
                <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[--color-ink-dim]">
                  Marcadores
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {process.tags.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: t.color,
                        color: contrastText(t.color),
                      }}
                      className="inline-flex items-center rounded px-3 py-1 font-sans text-xs font-bold uppercase tracking-[0.18em]"
                    >
                      {t.label}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </motion.div>
      </motion.div>

      {/* Banner inferior */}
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
        className="absolute bottom-0 left-0 right-0 border-t-[3px] border-double border-[--color-paper-warm]/40 bg-[--color-claret-deep]"
      >
        <div className="flex items-center justify-between px-12 py-4">
          <span className="font-sans text-xs uppercase tracking-[0.32em] text-[--color-paper-warm]">
            Toque para dispensar
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.32em] text-[--color-paper-warm]/70">
              Auto-fecha em
            </span>
            <span className="font-mono text-2xl font-semibold tabular text-[--color-paper-soft]">
              {String(remaining).padStart(2, "0")}s
            </span>
          </div>
          <span className="font-sans text-xs uppercase tracking-[0.32em] text-[--color-paper-warm]">
            Anote no diário
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
