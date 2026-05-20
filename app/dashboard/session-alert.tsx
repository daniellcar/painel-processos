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

  return (
    <motion.div
      key={process.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center px-8"
      style={{
        backgroundColor: "#F5D6CC",
        backgroundImage:
          "radial-gradient(ellipse at center, #F8DFD6 0%, #EDC4B6 100%)",
      }}
    >
      {/* Card — branco arredondado flutuando */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-[2.25rem] bg-white px-12 pb-12 pt-24 text-center"
        style={{
          boxShadow:
            "0 30px 60px -20px rgba(110,40,30,0.35), 0 10px 30px -10px rgba(110,40,30,0.18)",
        }}
      >
        {/* Sino flutuante — círculo branco com sombra, badge vermelho com contador */}
        <motion.div
          initial={{ y: -8, scale: 0.7, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            animate={{ rotate: [0, -14, 12, -8, 6, 0] }}
            transition={{
              duration: 1.1,
              ease: "easeInOut",
              delay: 0.6,
              repeat: 1,
              repeatDelay: 3,
            }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white"
            style={{
              boxShadow:
                "0 12px 30px -6px rgba(110,40,30,0.32), 0 4px 8px -2px rgba(110,40,30,0.18)",
            }}
          >
            <BellIcon className="h-16 w-16" />
            {/* Badge contador */}
            <span
              className="absolute right-1 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold leading-none text-white"
              style={{
                backgroundColor: "#E63946",
                boxShadow:
                  "0 0 0 3px #FFFFFF, 0 2px 6px rgba(230,57,70,0.45)",
                fontFamily: "var(--font-sans)",
              }}
            >
              1
            </span>
          </motion.div>
        </motion.div>

        {/* Hora marcada — sutil acima do título */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex items-center justify-center gap-2"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "#E63946" }}
          />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.32em] text-[--color-ink-dim]">
            Hora marcada · {sessionTime}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.45 }}
          className="mt-3 font-sans text-5xl font-bold tracking-tight text-[--color-ink] sm:text-6xl"
        >
          Abrir sessão
        </motion.h1>

        {/* Subtítulo — número + objeto */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.55 }}
          className="mt-4 space-y-1"
        >
          <p className="font-mono text-sm tabular text-[--color-ink-dim]">
            Pregão {process.numero}
          </p>
          <p className="mx-auto max-w-lg font-serif text-lg italic leading-snug text-[--color-ink-2]">
            {process.objeto}
          </p>
        </motion.div>

        {/* Status + Tags */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.65 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider"
            style={{
              color: process.cor,
              borderColor: `${process.cor}40`,
              backgroundColor: `${process.cor}12`,
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: process.cor }}
            />
            {process.status}
          </span>
          {process.tags?.map((t, i) => (
            <span
              key={i}
              style={{
                backgroundColor: t.color,
                color: contrastText(t.color),
              }}
              className="inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider"
            >
              {t.label}
            </span>
          ))}
        </motion.div>

        {/* Botão pill — ação primária */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.75 }}
          className="mt-9 flex flex-col items-center gap-3"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="group inline-flex items-center gap-3 rounded-full px-10 py-3.5 font-sans text-base font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundColor: "#E63946",
              boxShadow:
                "0 10px 24px -8px rgba(230,57,70,0.55), 0 4px 10px -2px rgba(230,57,70,0.35)",
            }}
          >
            Visualizar
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M3 8 h10 M9 4 l4 4 -4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[--color-ink-mute]">
            Fecha automaticamente em {String(remaining).padStart(2, "0")}s
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      {/* Sombra inferior */}
      <ellipse cx="50" cy="92" rx="22" ry="3" fill="#000" opacity="0.06" />
      {/* Alça */}
      <rect
        x="45.5"
        y="9"
        width="9"
        height="7"
        rx="2.5"
        fill="#D99826"
      />
      {/* Corpo do sino */}
      <path
        d="M50 16 C34 16 26 30 26 46 L26 62 Q26 70 20 76 L80 76 Q74 70 74 62 L74 46 C74 30 66 16 50 16 Z"
        fill="#F5BC2C"
        stroke="#D99826"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Brilho no corpo */}
      <path
        d="M34 32 Q34 22 42 20"
        stroke="#FFE08C"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Faixa inferior */}
      <path
        d="M22 72 Q26 70 28 66 L72 66 Q74 70 78 72 Z"
        fill="#E5A920"
      />
      {/* Badalo */}
      <circle cx="50" cy="86" r="6" fill="#E5A920" />
      <circle cx="48" cy="84" r="1.8" fill="#FFD96A" />
    </svg>
  );
}
