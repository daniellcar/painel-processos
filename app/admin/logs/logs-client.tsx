"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ProcessEvent, ProcessEventType } from "@/lib/types";

const EVENT_LABELS: Record<ProcessEventType, string> = {
  created: "criação",
  status_changed: "mudança de status",
  updated: "atualização",
  deleted: "remoção",
};

export function LogsClient({
  initialEvents,
}: {
  initialEvents: ProcessEvent[];
}) {
  const [events, setEvents] = useState<ProcessEvent[]>(initialEvents);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "process_events" },
        async () => {
          const { data } = await supabase
            .from("process_events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);
          if (data) setEvents(data as ProcessEvent[]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) {
    return (
      <div className="border-y-2 border-double border-[--color-rule] py-20 text-center">
        <p className="font-serif text-2xl italic text-[--color-ink-dim]">
          Nenhuma modificação registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <ol className="border-t border-[--color-ink]">
      {events.map((ev, i) => (
        <motion.li
          key={ev.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
          className="grid grid-cols-[140px_1fr_180px] items-start gap-6 border-b border-[--color-rule-soft] py-4"
        >
          {/* Tempo */}
          <div className="flex flex-col gap-0.5 pt-0.5">
            <span className="font-mono text-xs uppercase tracking-wide text-[--color-ink-dim]">
              {formatFullDate(ev.created_at)}
            </span>
            <span className="label-eyebrow text-[--color-ink-mute]">
              {formatRelative(ev.created_at)}
            </span>
          </div>

          {/* Narrativa */}
          <div className="flex flex-col gap-1">
            <p className="font-serif text-lg leading-snug text-[--color-ink]">
              {buildNarrative(ev)}
            </p>
            {ev.actor_email && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--color-ink-mute]">
                por {actorDisplay(ev.actor_email)}
              </span>
            )}
          </div>

          {/* Badge de tipo */}
          <div className="flex justify-end pt-1">
            <span className="label-eyebrow rounded border border-[--color-rule] px-2 py-0.5 text-[--color-ink-dim]">
              {EVENT_LABELS[ev.event_type]}
            </span>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function StatusPill({ status, cor }: { status: string; cor?: string | null }) {
  if (cor) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-sans text-sm font-medium uppercase tracking-wide"
        style={{
          color: cor,
          backgroundColor: `${cor}18`,
          borderColor: `${cor}40`,
        }}
      >
        <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: cor }} />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-[--color-rule] bg-[--color-paper-warm] px-2 py-0.5 font-sans text-sm font-medium uppercase tracking-wide text-[--color-ink-dim]">
      {status}
    </span>
  );
}

function buildNarrative(event: ProcessEvent) {
  const numEl = (
    <span className="font-mono font-medium text-[--color-ink]">{event.process_numero}</span>
  );
  const obj =
    event.process_objeto.length > 80
      ? event.process_objeto.slice(0, 80) + "…"
      : event.process_objeto;

  switch (event.event_type) {
    case "created":
      return (
        <>
          Processo {numEl} cadastrado. Status inicial:{" "}
          <StatusPill status={event.new_status ?? "—"} cor={event.new_cor} />.
        </>
      );
    case "status_changed":
      return (
        <>
          O processo {numEl} — {obj} — teve seu status alterado de{" "}
          <StatusPill status={event.old_status ?? "—"} /> para{" "}
          <StatusPill status={event.new_status ?? "—"} cor={event.new_cor} />.
        </>
      );
    case "updated":
      return <>Os dados do processo {numEl} foram atualizados.</>;
    case "deleted":
      return (
        <>
          O processo {numEl} — {obj} — foi removido do sistema.
        </>
      );
  }
}

function actorDisplay(email: string): string {
  const [local, domain] = email.split("@");
  const org = domain?.split(".")[0] ?? "";
  return org ? `${local} (${org.toUpperCase()})` : local;
}

function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelative(iso: string) {
  const diff = Date.now() - +new Date(iso);
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
}
