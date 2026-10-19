export interface BufferReportRow {
  pocExternalId: string;
  pocName:       string;
  volumeHl:      number | null;
  reason:        string | null;
}

export interface BufferReportResult {
  rows:   BufferReportRow[];
  errors: string[];
}

/** Remove o prefixo 598 que o BEES adiciona ao código do PDV */
function normalizePocId(raw: string): string {
  const s = raw.trim();
  return s.startsWith('598') && s.length > 3 ? s.slice(3) : s;
}

export function parseBufferReport(csvText: string): BufferReportResult {
  const errors: string[] = [];
  const rows:   BufferReportRow[] = [];

  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows, errors: ['Arquivo vazio ou sem linhas de dados.'] };
  }

  // Detecta separador
  const sep = lines[0].includes(';') ? ';' : ',';

  // Lê cabeçalho por nome — case-insensitive, sem aspas
  const headers = lines[0]
    .split(sep)
    .map(h => h.replace(/"/g, '').trim().toLowerCase());

  function col(row: string[], names: string[]): string {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return (row[idx] ?? '').replace(/"/g, '').trim();
    }
    return '';
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep);

    const rawId   = col(parts, ['poc_external_id', 'pocexternalid', 'cod_pdv', 'codigo_pdv', 'codigo do pdv']);
    const rawName = col(parts, ['poc_name', 'pocname', 'nome_pdv', 'nome do pdv', 'cliente']);
    const rawVol  = col(parts, ['volume_hl', 'volume', 'vol_hl', 'hl']);
    const rawReason = col(parts, ['reason', 'motivo', 'skippedreason', 'lastreasonrescheduled']);

    if (!rawId && !rawName) {
      errors.push(`Linha ${i + 1}: sem ID nem nome — ignorada.`);
      continue;
    }

    const vol = parseFloat(rawVol.replace(',', '.'));

    rows.push({
      pocExternalId: normalizePocId(rawId),
      pocName:       rawName || 'Cliente sem nome',
      volumeHl:      isNaN(vol) ? null : vol,
      reason:        rawReason || null,
    });
  }

  return { rows, errors };
}