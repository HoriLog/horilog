import { supabase } from '../supabaseClient';
import { parseRows } from '../../utils/csv';
import { parseNumberBR, parseUSDateTime } from '../../utils/format';

/**
 * O export de NFe tem colunas repetidas (várias "Unb") e uma coluna sem nome,
 * então ler por índice de posição é mais confiável do que por nome de cabeçalho.
 * Índices confirmados contra uma amostra real do arquivo:
 */
const COL = {
  MAPA: 3,
  EMISSAO: 8,
  NOTA: 10,
  SERIE: 11,
  STATUS: 12,
  CLIENTE_CODIGO: 16,
  CLIENTE_NOME: 17,
  PRODUTO_CODIGO: 19,
  UNIDADE: 20,
  PRODUTO_DESCRICAO: 21,
  QTDE: 23,
  VALOR: 24,
  ICMS: 25,
  ICMS_ST: 26,
  DESCONTO: 28,
  FRETE: 34,
} as const;

interface ImportResult {
  invoicesImported: number;
  itemsImported: number;
  rejected: Array<{ line: number; reason: string }>;
}

export async function importInvoicesCsv(text: string): Promise<ImportResult> {
  const rows = parseRows(text);
  const dataRows = rows.slice(1); // primeira linha é cabeçalho
  const rejected: ImportResult['rejected'] = [];

  // 1) Mapear Mapa (rota) -> tours.id
  const externalIds = dataRows
    .map((r) => Number(r[COL.MAPA]))
    .filter((n) => !Number.isNaN(n));
  const { data: tourRows, error: tourError } = await supabase
    .from('tours')
    .select('id, external_tour_id')
    .in('external_tour_id', Array.from(new Set(externalIds)));
  if (tourError) throw tourError;
  const tourIdByExternal = new Map<number, string>();
  tourRows.forEach((t) => tourIdByExternal.set(t.external_tour_id, t.id));

  // 2) Agrupar linhas por nota fiscal (Nota + Série)
  interface InvoiceGroup {
    tourId: string;
    invoiceNumber: string;
    series: string;
    status: string | null;
    clientCode: string | null;
    clientName: string | null;
    discount: number | undefined;
    freight: number | undefined;
    issueDate: string | undefined;
    items: Array<{
      productCode: string | null;
      productName: string | null;
      unit: string | null;
      quantity: number | undefined;
      value: number | undefined;
      icms: number | undefined;
      icmsSt: number | undefined;
    }>;
  }

  const groups = new Map<string, InvoiceGroup>();

  dataRows.forEach((r, idx) => {
    const line = idx + 2;
    const externalId = Number(r[COL.MAPA]);
    const tourId = tourIdByExternal.get(externalId);
    if (!tourId) {
      rejected.push({ line, reason: `rota ${externalId || '(vazio)'} não encontrada — importe o arquivo de rotas primeiro` });
      return;
    }
    const invoiceNumber = r[COL.NOTA]?.trim();
    const series = r[COL.SERIE]?.trim();
    if (!invoiceNumber) {
      rejected.push({ line, reason: 'Nota fiscal ausente' });
      return;
    }
    const key = `${invoiceNumber}|${series}`;
    if (!groups.has(key)) {
      groups.set(key, {
        tourId,
        invoiceNumber,
        series,
        status: r[COL.STATUS]?.trim() || null,
        clientCode: r[COL.CLIENTE_CODIGO]?.trim() || null,
        clientName: r[COL.CLIENTE_NOME]?.trim() || null,
        discount: parseNumberBR(r[COL.DESCONTO]),
        freight: parseNumberBR(r[COL.FRETE]),
        issueDate: parseUSDateTime(r[COL.EMISSAO])?.slice(0, 10),
        items: [],
      });
    }
    groups.get(key)!.items.push({
      productCode: r[COL.PRODUTO_CODIGO]?.trim() || null,
      productName: r[COL.PRODUTO_DESCRICAO]?.trim() || null,
      unit: r[COL.UNIDADE]?.trim() || null,
      quantity: parseNumberBR(r[COL.QTDE]),
      value: parseNumberBR(r[COL.VALOR]),
      icms: parseNumberBR(r[COL.ICMS]),
      icmsSt: parseNumberBR(r[COL.ICMS_ST]),
    });
  });

  if (groups.size === 0) return { invoicesImported: 0, itemsImported: 0, rejected };

  // 3) Upsert das notas (cabeçalho), pegando os totais somados dos itens
  const invoiceRows = Array.from(groups.values()).map((g) => ({
    tour_id: g.tourId,
    invoice_number: g.invoiceNumber,
    series: g.series,
    status: g.status,
    client_code: g.clientCode,
    client_name: g.clientName,
    total_value: g.items.reduce((acc, i) => acc + (i.value ?? 0), 0),
    total_icms: g.items.reduce((acc, i) => acc + (i.icms ?? 0), 0),
    total_icms_st: g.items.reduce((acc, i) => acc + (i.icmsSt ?? 0), 0),
    discount: g.discount ?? null,
    freight: g.freight ?? null,
    issue_date: g.issueDate ?? null,
  }));

  const { data: upsertedInvoices, error: invoiceError } = await supabase
    .from('invoices')
    .upsert(invoiceRows, { onConflict: 'invoice_number,series' })
    .select('id, invoice_number, series');
  if (invoiceError) throw invoiceError;

  const invoiceIdByKey = new Map<string, string>();
  upsertedInvoices.forEach((inv) => invoiceIdByKey.set(`${inv.invoice_number}|${inv.series}`, inv.id));

  // 4) Limpar itens antigos da mesma nota (reimportação) e inserir os novos
  const invoiceIds = Array.from(invoiceIdByKey.values());
  await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);

  const itemRows: Record<string, unknown>[] = [];
  groups.forEach((g, key) => {
    const invoiceId = invoiceIdByKey.get(key);
    if (!invoiceId) return;
    g.items.forEach((i) => {
      itemRows.push({
        invoice_id: invoiceId,
        product_code: i.productCode,
        product_name: i.productName,
        unit: i.unit,
        quantity: i.quantity ?? null,
        value: i.value ?? null,
        icms: i.icms ?? null,
        icms_st: i.icmsSt ?? null,
      });
    });
  });

  const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows);
  if (itemsError) throw itemsError;

  return { invoicesImported: invoiceRows.length, itemsImported: itemRows.length, rejected };
}