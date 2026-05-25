"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Process } from "@/lib/types";
import { contrastText } from "@/lib/contrast";
import { Logo } from "@/app/components/logo";

const TRANSITION = { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const };
const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView({
  processes,
  now,
}: {
  processes: Process[];
  now: Date | null;
}) {
  const reference = now ?? new Date();

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Process[]>();
    for (const p of processes) {
      if (!p.data_sessao) continue;
      const key = dateKey(new Date(p.data_sessao));
      const list = map.get(key);
      if (list) list.push(p);
      else map.set(key, [p]);
    }
    return map;
  }, [processes]);

  const year = reference.getFullYear();
  const month = reference.getMonth();

  const monthGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; currentMonth: boolean }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        currentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), currentMonth: true });
    }
    let trailing = 1;
    while (cells.length < 42) {
      cells.push({ date: new Date(year, month + 1, trailing++), currentMonth: false });
    }
    return cells;
  }, [year, month]);

  const todayKey = dateKey(reference);

  const todaySessions = useMemo(() => {
    const list = sessionsByDate.get(todayKey) ?? [];
    return [...list].sort((a, b) => {
      const ta = a.data_sessao ? new Date(a.data_sessao).getTime() : 0;
      const tb = b.data_sessao ? new Date(b.data_sessao).getTime() : 0;
      return ta - tb;
    });
  }, [sessionsByDate, todayKey]);

  const monthsWithSessions = useMemo(() => {
    let count = 0;
    for (const key of sessionsByDate.keys()) {
      const [y, m] = key.split("-").map(Number);
      if (y === year && m === month + 1) count += sessionsByDate.get(key)?.length ?? 0;
    }
    return count;
  }, [sessionsByDate, year, month]);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(reference);

  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(reference);

  return (
    <div className="grid min-h-[58vh] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12">
      {/* ─── CALENDÁRIO ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION}
        className="flex flex-col"
      >
        <div className="mb-6 flex items-end justify-between border-b border-[--color-ink] pb-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h2 className="headline text-3xl text-[--color-ink] sm:text-4xl">
              <span className="capitalize">{monthLabel.split(" de ")[0]}</span>{" "}
              <em className="text-[--color-ink-dim]">
                {monthLabel.split(" de ")[1]}
              </em>
            </h2>
          </div>
          <span className="label-eyebrow text-[--color-ink-dim]">
            {monthsWithSessions === 0
              ? "Sem sessões no mês"
              : `${monthsWithSessions} ${monthsWithSessions === 1 ? "sessão" : "sessões"} · mês`}
          </span>
        </div>

        {/* Cabeçalho dias da semana */}
        <div className="mb-3 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="label-eyebrow text-center text-[--color-ink-dim]"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {monthGrid.map((cell, i) => {
            const cellKey = dateKey(cell.date);
            const isToday = cellKey === todayKey;
            const sessions = sessionsByDate.get(cellKey) ?? [];
            const hasSessions = sessions.length > 0;
            const dotCount = Math.min(sessions.length, 3);

            return (
              <div
                key={i}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-sm transition-colors ${
                  hasSessions && !isToday && cell.currentMonth
                    ? "bg-[--color-paper-warm]"
                    : ""
                }`}
              >
                {isToday && (
                  <span className="absolute inset-1.5 rounded-full bg-[--color-claret] shadow-[0_6px_18px_-6px_rgba(122,31,18,0.55)]" />
                )}

                <span
                  className={`relative z-10 font-mono text-xl tabular ${
                    isToday
                      ? "font-semibold text-[--color-paper]"
                      : cell.currentMonth
                        ? hasSessions
                          ? "font-medium text-[--color-ink]"
                          : "text-[--color-ink-2]"
                        : "text-[--color-ink-mute]/60"
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                {hasSessions && !isToday && (
                  <span className="relative z-10 mt-0.5 flex gap-1">
                    {Array.from({ length: dotCount }).map((_, idx) => (
                      <span
                        key={idx}
                        className="h-1.5 w-1.5 rounded-full bg-[--color-claret]"
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-5 flex items-center justify-between border-t border-[--color-rule] pt-3">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[--color-claret]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[--color-claret]" />
              </span>
              <span className="label-eyebrow">Sessões marcadas</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[--color-claret]" />
              <span className="label-eyebrow">Hoje</span>
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[--color-ink-mute]">
            Visão mensal
          </span>
        </div>
      </motion.section>

      {/* ─── AGENDA DO DIA ─────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION, delay: 0.08 }}
        className="flex min-h-0 flex-col"
      >
        <div className="mb-6 border-b border-[--color-ink] pb-3">
          <p className="label-eyebrow text-[--color-claret]">Agenda do dia</p>
          <h2 className="headline mt-1 text-3xl text-[--color-ink] sm:text-4xl">
            <span className="capitalize">{todayLabel.split(",")[0]}</span>
            <em className="text-[--color-ink-dim]">,{todayLabel.split(",")[1]}</em>
          </h2>
        </div>

        {todaySessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="label-eyebrow text-[--color-claret]">Sem sessões hoje</p>
            <p className="max-w-md font-serif text-2xl italic leading-snug text-[--color-ink-dim]">
              Nenhum processo tem sessão marcada para esta data.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {todaySessions.map((p, i) => (
              <AgendaItem key={p.id} process={p} index={i} now={now} />
            ))}
          </ul>
        )}

        {todaySessions.length > 0 && (
          <div className="mt-auto flex items-center justify-between border-t border-[--color-rule] pt-3">
            <span className="label-eyebrow">
              Total ·{" "}
              <span className="tabular text-[--color-ink]">
                {todaySessions.length}
              </span>{" "}
              {todaySessions.length === 1 ? "sessão" : "sessões"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[--color-ink-mute]">
              Ordenado por horário
            </span>
          </div>
        )}
      </motion.section>
    </div>
  );
}

function AgendaItem({
  process,
  index,
  now,
}: {
  process: Process;
  index: number;
  now: Date | null;
}) {
  const date = process.data_sessao ? new Date(process.data_sessao) : null;
  const reference = now ?? new Date();
  const isPast = date ? date.getTime() < reference.getTime() : false;
  const isImminent =
    date && !isPast && date.getTime() - reference.getTime() < 60 * 60 * 1000;

  const time = date
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date)
    : "—";

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...TRANSITION, delay: 0.14 + index * 0.06 }}
      className="grid grid-cols-[110px_1fr] items-start gap-6 border-t border-[--color-rule] py-4 first:border-t-0"
    >
      {/* Horário */}
      <div className="flex flex-col items-end pt-1">
        <span
          className={`font-serif text-3xl tabular ${
            isImminent
              ? "blink-warning rounded px-2 py-0.5 text-white"
              : isPast
                ? "text-[--color-ink-mute]"
                : "text-[--color-ink]"
          }`}
        >
          {time}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-claret]">
          {isImminent ? "Em breve" : isPast ? "Encerrada" : "Hoje"}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tabular text-[--color-ink-dim]">
            {process.numero}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="color-chip" style={{ color: process.cor }} />
            <span
              className="font-sans text-xs font-semibold uppercase tracking-wide"
              style={{ color: process.cor }}
            >
              {process.status}
            </span>
          </span>
        </div>
        <p
          className="line-clamp-2 font-serif text-xl leading-snug text-[--color-ink]"
          title={process.objeto}
        >
          {process.objeto}
        </p>
        {process.tags && process.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {process.tags.map((t, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: t.color,
                  color: contrastText(t.color),
                }}
                className="inline-flex items-center rounded px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}
