import { supabase } from '../supabaseClient';
import { parseCsv, pick } from '../../utils/csv';
import { parseNumberBR, parseDurationToMinutes, parseUSDateTime } from '../../utils/format';

interface ImportResult {
  updated: number;
  inserted: number;
  rejected: Array<{ line: number; reason: string }>;
}

/** Busca o id interno de cada rota a partir do código externo (Mapa/tour_display_id). */
async function mapExternalTourIds(externalIds: number[]): Promise<Map<number, string>> {
  const unique = Array.from(new Set(externalIds));
  const { data, error } = await supabase.from('tours').select('id, external_tour_id').in('external_tour_id', unique);
  if (error) throw error;
  const map = new Map<number, string>();
  data.forEach((row) => map.set(row.external_tour_id, row.id));
  return map;
}

// ---------------------------------------------------------
// Planejamento (arquivo "Mapa" — eficiência/ocupação da rota)
// ---------------------------------------------------------

export async function importRoutePlanningCsv(text: string): Promise<ImportResult> {
  const { records } = parseCsv(text);
  const rejected: ImportResult['rejected'] = [];
  const externalIds = records
    .map((r) => Number(pick(r, 'MAPA')))
    .filter((n) => !Number.isNaN(n));
  const existing = await mapExternalTourIds(externalIds);

  let updated = 0;
  let inserted = 0;

  for (let idx = 0; idx < records.length; idx++) {
    const r = records[idx];
    const line = idx + 2;
    const externalId = Number(pick(r, 'MAPA'));
    if (!externalId || Number.isNaN(externalId)) {
      rejected.push({ line, reason: 'MAPA ausente ou inválido' });
      continue;
    }

    const fields = {
      planned_km: parseNumberBR(pick(r, 'KM Prev.')) ?? null,
      planned_time_minutes: parseDurationToMinutes(pick(r, 'Tempo Prev. (+almoço)')) ?? null,
      classification: pick(r, 'Classificação') || null,
      total_boxes: parseNumberBR(pick(r, 'Total de caixas')) ?? null,
      box_occupancy_pct: parseNumberBR(pick(r, '% Ocupação Caixas')) ?? null,
      weight_occupancy_pct: parseNumberBR(pick(r, '% Ocupação Peso')) ?? null,
      time_occupancy_pct: parseNumberBR(pick(r, '% Tempo')) ?? null,
      efficiency_pct: parseNumberBR(pick(r, '% Eficiência')) ?? null,
      delivery_region: pick(r, 'Região +Entregas') || pick(r, 'Cidades +Entregas') || null,
      substitute_vehicle_plate: pick(r, 'Veiculo Substituto') || null,
      driver_code: pick(r, 'Motorista') || null,
      vehicle_plate: pick(r, 'Placa') || null,
    };

    const tourId = existing.get(externalId);
    if (tourId) {
      const { error } = await supabase.from('tours').update(fields).eq('id', tourId);
      if (error) rejected.push({ line, reason: error.message });
      else updated++;
    } else {
      const { error } = await supabase.from('tours').insert({
        external_tour_id: externalId,
        tour_date: parseUSDateTime(pick(r, 'Data Entrega'))?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        driver_name: 'Não informado',
        ...fields,
      });
      if (error) rejected.push({ line, reason: error.message });
      else inserted++;
    }
  }

  return { updated, inserted, rejected };
}

// ---------------------------------------------------------
// Fases de carregamento (arquivo do WMS)
// ---------------------------------------------------------

export async function importLoadingEventsCsv(text: string): Promise<ImportResult> {
  const { records } = parseCsv(text);
  const rejected: ImportResult['rejected'] = [];
  const externalIds = records.map((r) => Number(pick(r, 'Mapa'))).filter((n) => !Number.isNaN(n));
  const existing = await mapExternalTourIds(externalIds);

  const rows: Record<string, unknown>[] = [];
  records.forEach((r, idx) => {
    const line = idx + 2;
    const externalId = Number(pick(r, 'Mapa'));
    const tourId = existing.get(externalId);
    if (!tourId) {
      rejected.push({ line, reason: `rota ${externalId || '(vazio)'} não encontrada — importe o arquivo de rotas/planejamento primeiro` });
      return;
    }
    const phase = pick(r, 'Fase')?.trim();
    if (!phase) {
      rejected.push({ line, reason: 'Fase ausente' });
      return;
    }
    rows.push({
      tour_id: tourId,
      phase,
      event_at: parseUSDateTime(pick(r, 'DtOper'), pick(r, 'HrOper')) ?? null,
      user_code: pick(r, 'Usuario') || null,
      seal_1: pick(r, 'Lacre-1')?.trim() || null,
      seal_2: pick(r, 'Lacre-2')?.trim() || null,
      seal_3: pick(r, 'Lacre-3')?.trim() || null,
      seal_4: pick(r, 'Lacre-4')?.trim() || null,
      checker_code: pick(r, 'Conferente')?.trim() || null,
      odometer_km: parseNumberBR(pick(r, 'KmAtual')) ?? null,
    });
  });

  if (rows.length === 0) return { updated: 0, inserted: 0, rejected };

  const { error } = await supabase.from('tour_loading_events').upsert(rows, { onConflict: 'tour_id,phase' });
  if (error) throw error;

  return { updated: 0, inserted: rows.length, rejected };
}

// ---------------------------------------------------------
// Escala de equipe (motorista, ajudantes, supervisor por rota)
// ---------------------------------------------------------

export async function importCrewScheduleCsv(text: string): Promise<ImportResult> {
  const { records } = parseCsv(text);
  const rejected: ImportResult['rejected'] = [];
  const externalIds = records.map((r) => Number(pick(r, 'Mapa'))).filter((n) => !Number.isNaN(n));
  const existing = await mapExternalTourIds(externalIds);

  let updated = 0;
  let inserted = 0;

  for (let idx = 0; idx < records.length; idx++) {
    const r = records[idx];
    const line = idx + 2;
    const externalId = Number(pick(r, 'Mapa'));
    if (!externalId || Number.isNaN(externalId)) {
      rejected.push({ line, reason: 'Mapa ausente ou inválido' });
      continue;
    }

    const driverName = pick(r, 'Nome Motorista')?.trim() || undefined;
    const fields = {
      delivery_region: pick(r, 'Regiao Entrega')?.trim() || null,
      supervisor_code: pick(r, 'Superv. Rota') || null,
      supervisor_name: pick(r, 'Nome Superv. Rota')?.trim() || null,
      driver_code: pick(r, 'Motorista') || null,
      driver_name: driverName,
      helper1_code: pick(r, 'Ajudante 1') || null,
      helper1_name: pick(r, 'Nome Ajudante 1')?.trim() || null,
      helper2_code: pick(r, 'Ajudante 2') || null,
      helper2_name: pick(r, 'Nome Ajudante 2')?.trim() || null,
      vehicle_plate: pick(r, 'Placa') || null,
    };

    const tourId = existing.get(externalId);
    if (tourId) {
      const { error } = await supabase.from('tours').update(fields).eq('id', tourId);
      if (error) rejected.push({ line, reason: error.message });
      else updated++;
    } else {
      const { error } = await supabase.from('tours').insert({
        external_tour_id: externalId,
        tour_date: pick(r, 'Data') || new Date().toISOString().slice(0, 10),
        ...fields,
        driver_name: fields.driver_name || 'Não informado',
      });
      if (error) rejected.push({ line, reason: error.message });
      else inserted++;
    }
  }

  return { updated, inserted, rejected };
}
