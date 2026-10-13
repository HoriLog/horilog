// src/services/importBeesRoutes.ts
//
// Importação do CSV exportado do BEES/Relay para o Supabase.
// Um arquivo = um dia de operação (N tours, N*M POCs).
// Fluxo: parse → upsert tours → upsert deliveries → cria devoluções automáticas.

import { parseCsv } from '../utils/csv';
import { supabase } from './supabaseClient';
import type { TourInsert, DeliveryInsert, DevolutionInsert } from '../types';

// ── helpers ──────────────────────────────────────────────────

function toIso(raw: string | undefined): string | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function toFloat(raw: string | undefined): number | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const n = parseFloat(raw.replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function toInt(raw: string | undefined): number | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const n = parseInt(raw, 10);
  return isNaN(n) ? undefined : n;
}

function toBool(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  return raw.trim().toLowerCase() === 'true';
}

function toIsoDate(raw: string | undefined): string | undefined {
  if (!raw || raw.trim() === '') return undefined;
  // Aceita "2026-09-26" ou "9/26/2026" ou ISO completo
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

// ── resultado da importação ───────────────────────────────────

export interface ImportBeesResult {
  toursUpserted: number;
  deliveriesUpserted: number;
  devolutionsCreated: number;
  skipped: number;
  errors: string[];
}

// ── parse do CSV ──────────────────────────────────────────────

interface RawRow {
  tour_display_id: string;
  tour_date: string;
  distribution_center_id: string;
  driver_name: string;
  truck_license_plate: string;
  trip_start_timestamp: string;
  trip_end_timestamp: string;
  tour_status: string;
  bees_tour_id: string;
  bees_trip_id: string;
  bees_created_date: string;
  poc_external_id: string;
  poc_name: string;
  critical_poc: string;
  visit_order: string;
  status: string;          // status POR POC
  arrived_at: string;
  finished_at: string;
  actual_delivery_time: string;
  within_radius: string;
  skipped_reason: string;
  last_reason_rescheduled: string;
  reason_description: string;
  total_delivered_vol: string;
  total_refused_vol: string;
  total_delivered_weight_kilograms: string;
  total_refused_weight_kilograms: string;
}

function parseRows(text: string): RawRow[] {
  const { records } = parseCsv(text);
  // parseCsv normaliza os headers — mapeamos de volta
  return records as unknown as RawRow[];
}

// ── importação principal ──────────────────────────────────────

export async function importBeesRoutes(
  csvText: string
): Promise<ImportBeesResult> {
  const result: ImportBeesResult = {
    toursUpserted: 0,
    deliveriesUpserted: 0,
    devolutionsCreated: 0,
    skipped: 0,
    errors: [],
  };

  const { records } = parseCsv(csvText);
  if (records.length === 0) {
    result.errors.push('Arquivo vazio ou sem linhas válidas.');
    return result;
  }

  // ── 1. Agrupa linhas por tour ────────────────────────────────
  const tourMap = new Map<
    number,
    { tourInsert: TourInsert; rows: typeof records }
  >();

  for (const row of records) {
    const extId = toInt(
      row['tourdisplayid'] ?? row['tour_display_id'] ?? row['tourid']
    );
    if (!extId) {
      result.skipped++;
      continue;
    }

    if (!tourMap.has(extId)) {
      const tourInsert: TourInsert = {
        external_tour_id: extId,
        tour_date:
          toIsoDate(
            row['tourdate'] ?? row['tour_date']
          ) ?? new Date().toISOString().split('T')[0],
        distribution_center_id:
          row['distributioncenterid'] ?? row['distribution_center_id'] ?? null,
        driver_name: row['drivername'] ?? row['driver_name'] ?? null,
        vehicle_plate:
          row['trucklicenseplate'] ?? row['truck_license_plate'] ?? null,
        trip_start:
          toIso(row['tripstarttimestamp'] ?? row['trip_start_timestamp']) ??
          null,
        trip_end:
          toIso(row['tripendtimestamp'] ?? row['trip_end_timestamp']) ?? null,
        status: row['tourstatus'] ?? row['tour_status'] ?? null,
        is_overnight: false,
        comments: null,
        arrived_at_cdd: null,
        tml_exceeded_reason: null,
      };
      tourMap.set(extId, { tourInsert, rows: [] });
    }
    tourMap.get(extId)!.rows.push(row);
  }

  // ── 2. Upsert tours ──────────────────────────────────────────
  const tourInserts = Array.from(tourMap.values()).map((t) => t.tourInsert);

  const { data: upsertedTours, error: tourError } = await supabase
    .from('tours')
    .upsert(tourInserts, { onConflict: 'external_tour_id' })
    .select('id, external_tour_id');

  if (tourError) {
    result.errors.push(`Erro ao importar tours: ${tourError.message}`);
    return result;
  }

  result.toursUpserted = upsertedTours?.length ?? 0;

  // Mapeia external_tour_id → uuid
  const tourIdMap = new Map<number, string>(
    (upsertedTours ?? []).map((t) => [t.external_tour_id as number, t.id as string])
  );

  // ── 3. Monta deliveries ──────────────────────────────────────
  const deliveryInserts: DeliveryInsert[] = [];

  for (const [extId, { rows }] of tourMap.entries()) {
    const tourUuid = tourIdMap.get(extId);
    if (!tourUuid) continue;

    for (const row of rows) {
      const pocId =
        row['pocexternalid'] ?? row['poc_external_id'] ?? '';
      const pocName =
        row['pocname'] ?? row['poc_name'] ?? '';

      if (!pocName && !pocId) {
        result.skipped++;
        continue;
      }

      deliveryInserts.push({
        tour_id: tourUuid,
        poc_external_id: pocId || null,
        poc_name: pocName || 'Não informado',
        critical_poc:
          toBool(row['criticalpoc'] ?? row['critical_poc']) ?? false,
        visit_order:
          toInt(row['visitorder'] ?? row['visit_order']) ?? null,
        status: ((row['status'] as string) || 'PENDING') as DeliveryInsert['status'],
        delivery_window: null,
        arrived_at:
          toIso(row['arrived_at'] ?? row['arrivedat']) ?? null,
        finished_at:
          toIso(row['finished_at'] ?? row['finishedat']) ?? null,
        actual_delivery_time_seconds:
          toInt(
            row['actualdeliverytime'] ?? row['actual_delivery_time']
          ) ?? null,
        within_radius:
          toBool(row['withinradius'] ?? row['within_radius']) ?? null,
        out_of_radius_reason:
          row['skippedreason'] ?? row['skipped_reason'] ?? null,
        skipped: false,
        reschedule_reason:
          row['lastreasonrescheduled'] ??
          row['last_reason_rescheduled'] ??
          null,
        total_delivered_vol_hl:
          toFloat(
            row['totaldeliveredvol'] ?? row['total_delivered_vol']
          ) ?? null,
        total_refused_vol_hl:
          toFloat(
            row['totalrefusedvol'] ?? row['total_refused_vol']
          ) ?? null,
        total_delivered_weight_kg:
          toFloat(
            row['totaldeliveredweightkilograms'] ??
            row['total_delivered_weight_kilograms']
          ) ?? null,
        total_refused_weight_kg:
          toFloat(
            row['totalrefusedweightkilograms'] ??
            row['total_refused_weight_kilograms']
          ) ?? null,
      });
    }
  }

  // ── 4. Upsert deliveries ─────────────────────────────────────
  const BATCH = 200;
  const allDeliveryIds: { id: string; tour_id: string; poc_external_id: string | null; status: string }[] = [];

  for (let i = 0; i < deliveryInserts.length; i += BATCH) {
    const chunk = deliveryInserts.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('deliveries')
      .upsert(chunk, { onConflict: 'tour_id,poc_external_id' })
      .select('id, tour_id, poc_external_id, status');

    if (error) {
      result.errors.push(`Erro ao importar entregas (lote ${i}): ${error.message}`);
      continue;
    }
    allDeliveryIds.push(...(data ?? []));
  }

  result.deliveriesUpserted = allDeliveryIds.length;

  // ── 5. Cria devoluções para POCs RESCHEDULED ─────────────────
  const rescheduled = allDeliveryIds.filter(
    (d) => d.status === 'RESCHEDULED'
  );

  if (rescheduled.length > 0) {
    // Busca motivos do CSV para cada delivery
    const reasonMap = new Map<string, string>();
    for (const [extId, { rows }] of tourMap.entries()) {
      const tourUuid = tourIdMap.get(extId);
      if (!tourUuid) continue;
      for (const row of rows) {
        const pocId = row['pocexternalid'] ?? row['poc_external_id'] ?? '';
        const reason =
          row['lastreasonrescheduled'] ??
          row['last_reason_rescheduled'] ?? '';
        if (pocId && reason) {
          reasonMap.set(`${tourUuid}|${pocId}`, reason);
        }
      }
    }

    const devolutionInserts: DevolutionInsert[] = rescheduled.map((d) => {
      const key = `${d.tour_id}|${d.poc_external_id ?? ''}`;
      return {
        delivery_id: d.id,
        tour_id: d.tour_id,
        poc_external_id: d.poc_external_id,
        poc_name: null,
        reason: reasonMap.get(key) || 'Não informado',
        reason_description: null,
        status: 'PENDING' as const,
      };
    });

    const { data: devData, error: devError } = await supabase
      .from('devolutions')
      .upsert(devolutionInserts, { onConflict: 'delivery_id' })
      .select('id');

    if (devError) {
      result.errors.push(`Erro ao criar devoluções: ${devError.message}`);
    } else {
      result.devolutionsCreated = devData?.length ?? 0;
    }
  }

  return result;
}
