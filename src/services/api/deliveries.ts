import { supabase } from '../supabaseClient';
import { parseCsv, pick } from '../../utils/csv';
import { parseNumberBR } from '../../utils/format';

// ---------------------------------------------------------
// Tipos
// ---------------------------------------------------------

export interface Tour {
  id: string;
  externalTourId: number;
  tourDate: string;
  distributionCenterId?: string;
  driverName: string;
  vehiclePlate?: string;
  tripStart?: string;
  tripEnd?: string;
  status?: string;
}

export interface Delivery {
  id: string;
  tourId: string;
  pocExternalId?: string;
  pocName: string;
  criticalPoc: boolean;
  visitOrder?: number;
  status: string;
  deliveryWindow?: string;
  arrivedAt?: string;
  finishedAt?: string;
  actualDeliveryTimeSeconds?: number;
  withinRadius?: boolean;
  outOfRadiusReason?: string;
  skipped: boolean;
  rescheduleReason?: string;
  totalDeliveredVolHl?: number;
  totalRefusedVolHl?: number;
  totalDeliveredWeightKg?: number;
  totalRefusedWeightKg?: number;
  // Preenchidos via join com a rota, para exibição
  tourDate?: string;
  driverName?: string;
  vehiclePlate?: string;
}

// ---------------------------------------------------------
// Leitura
// ---------------------------------------------------------

export async function listTours(): Promise<Tour[]> {
  const { data, error } = await supabase.from('tours').select('*').order('tour_date', { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    externalTourId: row.external_tour_id,
    tourDate: row.tour_date,
    distributionCenterId: row.distribution_center_id ?? undefined,
    driverName: row.driver_name,
    vehiclePlate: row.vehicle_plate ?? undefined,
    tripStart: row.trip_start ?? undefined,
    tripEnd: row.trip_end ?? undefined,
    status: row.status ?? undefined,
  }));
}

export async function listDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*, tours(tour_date, driver_name, vehicle_plate)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row: any) => ({
    id: row.id,
    tourId: row.tour_id,
    pocExternalId: row.poc_external_id ?? undefined,
    pocName: row.poc_name,
    criticalPoc: row.critical_poc,
    visitOrder: row.visit_order ?? undefined,
    status: row.status,
    deliveryWindow: row.delivery_window ?? undefined,
    arrivedAt: row.arrived_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    actualDeliveryTimeSeconds: row.actual_delivery_time_seconds ?? undefined,
    withinRadius: row.within_radius ?? undefined,
    outOfRadiusReason: row.out_of_radius_reason ?? undefined,
    skipped: row.skipped,
    rescheduleReason: row.reschedule_reason ?? undefined,
    totalDeliveredVolHl: row.total_delivered_vol_hl ?? undefined,
    totalRefusedVolHl: row.total_refused_vol_hl ?? undefined,
    totalDeliveredWeightKg: row.total_delivered_weight_kg ?? undefined,
    totalRefusedWeightKg: row.total_refused_weight_kg ?? undefined,
    tourDate: row.tours?.tour_date ?? undefined,
    driverName: row.tours?.driver_name ?? undefined,
    vehiclePlate: row.tours?.vehicle_plate ?? undefined,
  }));
}

export function subscribeToDeliveries(onChange: () => void): () => void {
  const channelName = `deliveries-changes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tours' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------
// Importação — formato exato do export de rotas do BEES/Relay
// (colunas: tour_display_id;tour_date;distribution_center_id;
//  driver_name;truck_license_plate;poc_external_id;poc_name;
//  critical_poc;status;trip_start_timestamp;trip_end_timestamp;
//  visit_order;delivery_window;within_radius;skipped_reason;
//  out_of_radius_reason;actual_delivery_time;arrived_at;
//  finished_at;last_reason_rescheduled;total_delivered_vol;
//  total_refused_vol;total_delivered_weight_kilograms;
//  total_refused_weight_kilograms;tour_status)
// ---------------------------------------------------------

function toBool(v: string | undefined): boolean {
  return (v ?? '').trim().toLowerCase() === 'true';
}

function toIso(v: string | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export interface ImportRoutesResult {
  toursImported: number;
  deliveriesImported: number;
  rejected: Array<{ line: number; reason: string }>;
}

export async function importRoutesCsv(text: string): Promise<ImportRoutesResult> {
  const { records } = parseCsv(text);
  const rejected: ImportRoutesResult['rejected'] = [];

  // 1) Agrupa linhas por tour_display_id e faz upsert das rotas primeiro
  const tourByExternalId = new Map<number, { row: Record<string, string>; line: number }>();
  records.forEach((r, idx) => {
    const line = idx + 2;
    const externalId = Number(pick(r, 'tour_display_id'));
    if (!externalId || Number.isNaN(externalId)) {
      rejected.push({ line, reason: 'tour_display_id ausente ou inválido' });
      return;
    }
    if (!tourByExternalId.has(externalId)) tourByExternalId.set(externalId, { row: r, line });
  });

  const tourRows = Array.from(tourByExternalId.values()).map(({ row: r }) => ({
    external_tour_id: Number(pick(r, 'tour_display_id')),
    tour_date: pick(r, 'tour_date'),
    distribution_center_id: pick(r, 'distribution_center_id') || null,
    driver_name: pick(r, 'driver_name') || 'Não informado',
    vehicle_plate: pick(r, 'truck_license_plate') || null,
    trip_start: toIso(pick(r, 'trip_start_timestamp')),
    trip_end: toIso(pick(r, 'trip_end_timestamp')),
    status: pick(r, 'tour_status') || null,
  }));

  if (tourRows.length === 0) {
    return { toursImported: 0, deliveriesImported: 0, rejected };
  }

  const { data: upsertedTours, error: tourError } = await supabase
    .from('tours')
    .upsert(tourRows, { onConflict: 'external_tour_id' })
    .select('id, external_tour_id');
  if (tourError) throw tourError;

  const tourIdByExternalId = new Map<number, string>();
  upsertedTours.forEach((t) => tourIdByExternalId.set(t.external_tour_id, t.id));

  // 2) Monta as paradas, cada uma referenciando o id real da rota
  const deliveryRows: Record<string, unknown>[] = [];
  records.forEach((r, idx) => {
    const line = idx + 2;
    const externalId = Number(pick(r, 'tour_display_id'));
    const tourId = tourIdByExternalId.get(externalId);
    if (!tourId) return; // já rejeitada acima na etapa da rota

    const pocName = pick(r, 'poc_name');
    if (!pocName) {
      rejected.push({ line, reason: 'poc_name (cliente/PDV) ausente' });
      return;
    }

    deliveryRows.push({
      tour_id: tourId,
      poc_external_id: pick(r, 'poc_external_id') || null,
      poc_name: pocName,
      critical_poc: toBool(pick(r, 'critical_poc')),
      visit_order: pick(r, 'visit_order') ? Number(pick(r, 'visit_order')) : null,
      status: pick(r, 'status') || 'PENDING',
      delivery_window: pick(r, 'delivery_window') || null,
      arrived_at: toIso(pick(r, 'arrived_at')),
      finished_at: toIso(pick(r, 'finished_at')),
      actual_delivery_time_seconds: pick(r, 'actual_delivery_time')
        ? Number(pick(r, 'actual_delivery_time'))
        : null,
      within_radius: pick(r, 'within_radius') ? toBool(pick(r, 'within_radius')) : null,
      out_of_radius_reason: pick(r, 'out_of_radius_reason') || null,
      skipped: toBool(pick(r, 'skipped_reason')),
      reschedule_reason: pick(r, 'last_reason_rescheduled') || null,
      total_delivered_vol_hl: parseNumberBR(pick(r, 'total_delivered_vol')) ?? null,
      total_refused_vol_hl: parseNumberBR(pick(r, 'total_refused_vol')) ?? null,
      total_delivered_weight_kg: parseNumberBR(pick(r, 'total_delivered_weight_kilograms')) ?? null,
      total_refused_weight_kg: parseNumberBR(pick(r, 'total_refused_weight_kilograms')) ?? null,
    });
  });

  if (deliveryRows.length === 0) {
    return { toursImported: tourRows.length, deliveriesImported: 0, rejected };
  }

  const { error: deliveryError } = await supabase
    .from('deliveries')
    .upsert(deliveryRows, { onConflict: 'tour_id,poc_external_id' });
  if (deliveryError) throw deliveryError;

  return { toursImported: tourRows.length, deliveriesImported: deliveryRows.length, rejected };
}
