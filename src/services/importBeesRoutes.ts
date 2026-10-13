// src/services/importBeesRoutes.ts
import { parseCsv } from '../utils/csv';
import { supabase } from './supabaseClient';
import type { TourInsert, DeliveryInsert } from '../types';

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
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

export interface ImportBeesResult {
  toursUpserted: number;
  deliveriesUpserted: number;
  devolutionsCreated: number;
  skipped: number;
  errors: string[];
}

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

  const tourMap = new Map<
    number,
    { tourInsert: TourInsert; rows: typeof records }
  >();

  for (const row of records) {
    const extId = toInt(
      row['tourdisplayid'] ?? row['tour_display_id'] ?? row['tourid'] ?? row['Tour ID']
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
            row['tourdate'] ?? row['tour_date'] ?? row['Tour Date']
          ) ?? new Date().toISOString().split('T')[0],
        distribution_center_id:
          row['distributioncenterid'] ?? row['distribution_center_id'] ?? null,
        driver_name: row['drivername'] ?? row['driver_name'] ?? row['Driver Name'] ?? null,
        vehicle_plate:
          row['trucklicenseplate'] ?? row['truck_license_plate'] ?? row['Truck License Plate'] ?? null,
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

  const tourIdMap = new Map<number, string>(
    (upsertedTours ?? []).map((t) => [t.external_tour_id as number, t.id as string])
  );

  const deliveryInserts: DeliveryInsert[] = [];

  for (const [extId, { rows }] of tourMap.entries()) {
    const tourUuid = tourIdMap.get(extId);
    if (!tourUuid) continue;

    for (const row of rows) {
      const pocId =
        row['pocexternalid'] ?? row['poc_external_id'] ?? row['POC External ID'] ?? '';
      const pocName =
        row['pocname'] ?? row['poc_name'] ?? row['POC Name'] ?? '';

      if (!pocName && !pocId) {
        result.skipped++;
        continue;
      }

      const rowStatus = String(row['status'] ?? row['Status'] ?? 'PENDING').toUpperCase();

      deliveryInserts.push({
        tour_id: tourUuid,
        poc_external_id: pocId || null,
        poc_name: pocName || 'Não informado',
        critical_poc:
          toBool(row['criticalpoc'] ?? row['critical_poc']) ?? false,
        visit_order:
          toInt(row['visitorder'] ?? row['visit_order']) ?? null,
        status: rowStatus as DeliveryInsert['status'],
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

  // ── Inserção direta de ocorrências (sem upsert/onConflict) ──
  const devolutionInserts: any[] = [];

  for (const [extId, { rows }] of tourMap.entries()) {
    const tourUuid = tourIdMap.get(extId);
    if (!tourUuid) continue;

    for (const row of rows) {
      // ← só cria devolução para POCs com status RESCHEDULED
      const rowStatus = String(row['status'] ?? row['Status'] ?? '')
        .toUpperCase()
        .trim();
      if (rowStatus !== 'RESCHEDULED') continue;

      const pocId = String(row['pocexternalid'] ?? '').trim();

      const reasonCode = String(
        row['lastreasonrescheduled'] ??
        row['last_reason_rescheduled'] ??
        row['skippedreason'] ??
        row['skipped_reason'] ??
        row['reason'] ??
        row['Motivo'] ??
        '00'
      ).trim();

      const reasonDesc = String(
        row['reasondescription'] ??
        row['reason_description'] ??
        'Registro de parada importado via BEES'
      );

      if (pocId) {
        const matchingDelivery = allDeliveryIds.find(
          (d) => d.tour_id === tourUuid && d.poc_external_id === pocId
        );

        if (matchingDelivery) {
          devolutionInserts.push({
            delivery_id: matchingDelivery.id,
            tour_id: tourUuid,
            poc_external_id: pocId,
            poc_name: null,
            reason: reasonCode !== '' ? reasonCode : '00',
            reason_description: reasonDesc,
            status: 'PENDING',
          });
        }
      }
    }
  }

  let totalCreated = 0;
  if (devolutionInserts.length > 0) {
    for (let i = 0; i < devolutionInserts.length; i += BATCH) {
      const chunk = devolutionInserts.slice(i, i + BATCH);
      const { data: devData, error: devError } = await supabase
        .from('devolutions')
        .insert(chunk)
        .select('id');

      if (devError) {
        console.error('Erro ao inserir lote de devoluções:', devError);
        result.errors.push(`Erro ao criar ocorrências: ${devError.message}`);
      } else {
        totalCreated += devData?.length ?? 0;
      }
    }
  }

  result.devolutionsCreated = totalCreated;
  return result;
}