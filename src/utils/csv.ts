/**
 * Minimal, dependency-free CSV helpers.
 * - Detects the delimiter (`;` is the default of Excel in pt-BR, so it is very common)
 * - Handles quoted fields (with embedded delimiters, quotes and line breaks) and a UTF-8 BOM
 * - Header names are normalised (lowercase, no accents/spaces) so "Localização" === "localizacao"
 */

export function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function detectDelimiter(firstLine: string): string {
  const candidates = [';', ',', '\t'];
  let best = ',';
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

export function parseRows(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ParsedCsv {
  headers: string[];
  records: Array<Record<string, string>>;
}

export function parseCsv(text: string): ParsedCsv {
  const rows = parseRows(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map(normalizeHeader);
  const records = rows.slice(1).map((cols) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) rec[h] = (cols[idx] ?? '').trim();
    });
    return rec;
  });
  return { headers, records };
}

/** First non-empty value among the accepted header aliases. */
export function pick(rec: Record<string, string>, ...aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = rec[normalizeHeader(a)];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

function escapeCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a `;`-separated CSV with BOM so Excel (pt-BR) opens accents correctly. */
export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers, ...rows].map((r) => r.map(escapeCell).join(';'));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
