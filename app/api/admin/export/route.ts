import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import type { Process } from "@/lib/types";

// Garante execução no runtime Node (exceljs depende de APIs do Node) e
// evita cache, já que a planilha precisa refletir o estado atual.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Não autenticado", { status: 401 });
  }

  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .order("numero", { ascending: true });

  if (error) {
    return new Response(`Erro ao carregar processos: ${error.message}`, {
      status: 500,
    });
  }

  const processes = (data as Process[] | null) ?? [];

  // Aplica os mesmos filtros do explorer, lidos da URL.
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const selectedTags = url.searchParams.getAll("tag");
  const selectedStatuses = url.searchParams.getAll("status");

  const filtered = processes.filter((p) => {
    if (q && !`${p.numero} ${p.objeto}`.toLowerCase().includes(q)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status))
      return false;
    if (selectedTags.length > 0) {
      const labels = new Set((p.tags ?? []).map((t) => t.label));
      if (!selectedTags.every((t) => labels.has(t))) return false;
    }
    return true;
  });

  // Monta o workbook.
  const wb = new ExcelJS.Workbook();
  wb.creator = "Painel de Processos";
  wb.created = new Date();
  const ws = wb.addWorksheet("Processos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Número", key: "numero", width: 22 },
    { header: "Objeto", key: "objeto", width: 60 },
    { header: "Status", key: "status", width: 32 },
    { header: "Cor", key: "cor", width: 12 },
    {
      header: "Data da Sessão",
      key: "data_sessao",
      width: 22,
      style: { numFmt: "dd/mm/yyyy hh:mm" },
    },
    { header: "Tags", key: "tags", width: 36 },
    { header: "Tags (cores)", key: "tags_cores", width: 28 },
    {
      header: "Criado em",
      key: "created_at",
      width: 22,
      style: { numFmt: "dd/mm/yyyy hh:mm" },
    },
    {
      header: "Atualizado em",
      key: "updated_at",
      width: 22,
      style: { numFmt: "dd/mm/yyyy hh:mm" },
    },
    { header: "ID", key: "id", width: 38 },
  ];

  // Estiliza o cabeçalho.
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle" };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0E1A2D" }, // marinho do tema
  };
  header.height = 22;

  for (const p of filtered) {
    ws.addRow({
      numero: p.numero,
      objeto: p.objeto,
      status: p.status,
      cor: p.cor,
      data_sessao: p.data_sessao ? new Date(p.data_sessao) : null,
      tags: (p.tags ?? []).map((t) => t.label).join("; "),
      tags_cores: (p.tags ?? []).map((t) => t.color).join("; "),
      created_at: p.created_at ? new Date(p.created_at) : null,
      updated_at: p.updated_at ? new Date(p.updated_at) : null,
      id: p.id,
    });
  }

  // Zebra striping para legibilidade.
  for (let i = 2; i <= ws.rowCount; i++) {
    if (i % 2 === 0) {
      ws.getRow(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF7F2E8" }, // paper-soft do tema
      };
    }
    ws.getRow(i).alignment = { vertical: "middle", wrapText: true };
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columnCount },
  };

  const buffer = await wb.xlsx.writeBuffer();

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `processos-${stamp}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Process-Count": String(filtered.length),
    },
  });
}
