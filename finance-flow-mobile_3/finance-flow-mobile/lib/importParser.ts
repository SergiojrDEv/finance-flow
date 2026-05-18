import type { Transaction } from "../types";

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function normalizeDate(raw: string): string {
  // Aceita: 2026-05-01, 01/05/2026, 05/01/2026
  raw = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("/");
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/uber|99|taxi|combustivel|gasolina|posto|estacionamento/.test(d)) return "transporte";
  if (/ifood|rappi|restaurante|lanche|pizza|burger|padaria|cafe|mcdonalds|subway/.test(d)) return "alimentacao";
  if (/mercado|supermercado|carrefour|extra|atacadao|hortifruti/.test(d)) return "alimentacao";
  if (/farmacia|drogaria|medico|clinica|hospital|saude|plano/.test(d)) return "saude";
  if (/netflix|spotify|amazon|prime|disney|apple|google play|steam/.test(d)) return "lazer";
  if (/aluguel|condominio|agua|luz|energia|gás|internet|telefone/.test(d)) return "moradia";
  if (/curso|escola|faculdade|livro|udemy|alura/.test(d)) return "educacao";
  if (/salario|salário|pagamento|transferencia recebida/.test(d)) return "salario";
  if (/rendimento|dividendo|juros|cdb|tesouro/.test(d)) return "rendimento";
  return "outros";
}

export function parseCSV(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detecta separador (vírgula ou ponto e vírgula)
  const sep = lines[0].includes(";") ? ";" : ",";

  // Detecta header
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const dateIdx = header.findIndex((h) => /data|date/.test(h));
  const descIdx = header.findIndex((h) => /desc|título|titulo|nome|lancamento|memo/.test(h));
  const valIdx  = header.findIndex((h) => /valor|value|amount|vl/.test(h));

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : cols[0];
    const rawDesc = descIdx >= 0 ? cols[descIdx] : cols[1];
    const rawVal  = valIdx  >= 0 ? cols[valIdx]  : cols[cols.length - 1];

    const amount = parseFloat(rawVal.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""));
    if (isNaN(amount) || amount === 0) continue;

    rows.push({
      date: normalizeDate(rawDate),
      description: rawDesc || "Lançamento",
      amount: Math.abs(amount),
      type: amount < 0 ? "expense" : "income",
      category: guessCategory(rawDesc),
    });
  }

  return rows;
}

// ── OFX ──────────────────────────────────────────────────────────────────────

function ofxTag(content: string, tag: string): string {
  const m = content.match(new RegExp(`<${tag}>([^<\n\r]+)`));
  return m ? m[1].trim() : "";
}

function ofxDate(raw: string): string {
  // YYYYMMDD or YYYYMMDDHHMMSS
  const d = raw.slice(0, 8);
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return new Date().toISOString().slice(0, 10);
}

export function parseOFX(content: string): ParsedRow[] {
  const stmtBlocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  const rows: ParsedRow[] = [];

  for (const block of stmtBlocks) {
    const trntype = ofxTag(block, "TRNTYPE");
    const dtposted = ofxTag(block, "DTPOSTED");
    const trnamt   = ofxTag(block, "TRNAMT");
    const memo     = ofxTag(block, "MEMO") || ofxTag(block, "NAME");
    const fitid    = ofxTag(block, "FITID");

    const amount = parseFloat(trnamt.replace(",", "."));
    if (isNaN(amount) || amount === 0) continue;

    const isCredit = trntype === "CREDIT" || amount > 0;

    rows.push({
      date: ofxDate(dtposted),
      description: memo || "Lançamento",
      amount: Math.abs(amount),
      type: isCredit ? "income" : "expense",
      category: guessCategory(memo),
    });
  }

  return rows;
}

// ── Converte para Transaction ─────────────────────────────────────────────────

export function parsedToTransactions(rows: ParsedRow[], account?: string): Transaction[] {
  return rows.map((r, i) => ({
    id: `import-${Date.now()}-${i}`,
    type: r.type,
    amount: r.amount,
    category: r.category,
    description: r.description,
    date: r.date,
    account: account || "Conta corrente",
    paymentMethod: "pix" as const,
    status: "confirmed" as const,
    createdAt: new Date().toISOString(),
  }));
}
