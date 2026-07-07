import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/lib/types";

export async function fetchKnownTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("processes")
    .select("tags, updated_at")
    .order("updated_at", { ascending: false });

  const seen = new Set<string>();
  const tags: Tag[] = [];
  for (const row of (data as { tags: Tag[] | null }[] | null) ?? []) {
    for (const t of row.tags ?? []) {
      if (!t?.label || !t?.color) continue;
      const key = t.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push({
        label: t.label,
        color: t.color,
        ...(t.tipo ? { tipo: t.tipo } : {}),
      });
    }
  }
  return tags;
}
