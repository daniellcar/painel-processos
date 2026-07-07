"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const COLOR_FALLBACK = "#1F2937";

function sanitizeColor(c: string | null | undefined): string {
  if (!c) return COLOR_FALLBACK;
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : COLOR_FALLBACK;
}

function parseDataSessao(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseTags(
  v: string | null | undefined,
): { label: string; color: string; tipo?: string }[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t): t is { label: string; color: string; tipo?: unknown } =>
          t &&
          typeof t.label === "string" &&
          typeof t.color === "string" &&
          t.label.trim().length > 0,
      )
      .map((t) => {
        const tipo =
          typeof t.tipo === "string" && t.tipo.trim().length > 0
            ? t.tipo.trim().slice(0, 30)
            : undefined;
        return {
          label: t.label.trim().slice(0, 30),
          color: /^#[0-9a-fA-F]{6}$/.test(t.color) ? t.color.toUpperCase() : "#7A1F12",
          ...(tipo ? { tipo } : {}),
        };
      })
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function createProcess(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const numero = String(formData.get("numero") ?? "").trim();
  const numero_modalidade = String(formData.get("numero_modalidade") ?? "").trim() || null;
  const numero_convenio = String(formData.get("numero_convenio") ?? "").trim() || null;
  const objeto = String(formData.get("objeto") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const cor = sanitizeColor(String(formData.get("cor") ?? ""));
  const data_sessao = parseDataSessao(formData.get("data_sessao") as string);
  const tags = parseTags(formData.get("tags") as string);

  if (!numero || !objeto || !status) {
    return { ok: false as const, error: "Preencha número, objeto e status." };
  }

  const { data: inserted, error } = await supabase
    .from("processes")
    .insert({ numero, numero_modalidade, numero_convenio, objeto, status, cor, data_sessao, tags })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "Já existe um processo com esse número." };
    }
    return { ok: false as const, error: error.message };
  }

  await supabase.from("process_events").insert({
    process_id: inserted.id,
    process_numero: numero,
    process_objeto: objeto,
    event_type: "created",
    actor_email: user.email ?? null,
    old_status: null,
    new_status: status,
    old_cor: null,
    new_cor: cor,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin");
}

export async function updateProcess(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const numero = String(formData.get("numero") ?? "").trim();
  const numero_modalidade = String(formData.get("numero_modalidade") ?? "").trim() || null;
  const numero_convenio = String(formData.get("numero_convenio") ?? "").trim() || null;
  const objeto = String(formData.get("objeto") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const cor = sanitizeColor(String(formData.get("cor") ?? ""));
  const data_sessao = parseDataSessao(formData.get("data_sessao") as string);
  const tags = parseTags(formData.get("tags") as string);

  if (!numero || !objeto || !status) {
    return { ok: false as const, error: "Preencha número, objeto e status." };
  }

  const { data: current } = await supabase
    .from("processes")
    .select("status, cor")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("processes")
    .update({ numero, numero_modalidade, numero_convenio, objeto, status, cor, data_sessao, tags })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "Já existe um processo com esse número." };
    }
    return { ok: false as const, error: error.message };
  }

  const eventType = current?.status !== status ? "status_changed" : "updated";
  await supabase.from("process_events").insert({
    process_id: id,
    process_numero: numero,
    process_objeto: objeto,
    event_type: eventType,
    actor_email: user.email ?? null,
    old_status: current?.status ?? null,
    new_status: status,
    old_cor: current?.cor ?? null,
    new_cor: cor,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin");
}

export async function deleteProcess(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: proc } = await supabase
    .from("processes")
    .select("numero, objeto, status, cor")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("processes").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await supabase.from("process_events").insert({
    process_id: null,
    process_numero: proc?.numero ?? "—",
    process_objeto: proc?.objeto ?? "—",
    event_type: "deleted",
    actor_email: user.email ?? null,
    old_status: proc?.status ?? null,
    new_status: null,
    old_cor: proc?.cor ?? null,
    new_cor: null,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
