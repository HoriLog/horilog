// src/services/api/tours.ts
import { supabase } from '../supabaseClient';
import type {
  Tour,
  TourWithTML,
  TourInsert,
  TourTMLUpdate,
  DeliveryInsert,
  DevolutionInsert,
  DevolutionApproval,
  Devolution,
} from '../../types';

// ── TOURS ────────────────────────────────────────────────────

export async function fetchTours(date?: string): Promise<TourWithTML[]> {
  let query = supabase
    .from('tours_with_tml')
    .select('*')
    .order('tour_date', { ascending: false })
    .order('external_tour_id', { ascending: true });

  if (date) query = query.eq('tour_date', date);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchTourById(id: string): Promise<TourWithTML | null> {
  const { data, error } = await supabase
    .from('tours_with_tml')
    .select('*, deliveries(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function upsertToursBatch(tours: TourInsert[]): Promise<number> {
  const { data, error } = await supabase
    .from('tours')
    .upsert(tours, { onConflict: 'external_tour_id' })
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

export async function updateTourTML(
  id: string,
  tml: TourTMLUpdate
): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update(tml)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function closeTour(id: string, comments?: string): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update({
      status: 'CONCLUDED',
      ...(comments ? { comments } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setTourOvernight(id: string): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update({ is_overnight: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToTours(
  date: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`tours-${date}-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tours' }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── DELIVERIES ───────────────────────────────────────────────

export async function fetchDeliveriesByTour(tourId: string) {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('tour_id', tourId)
    .order('visit_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertDeliveriesBatch(
  deliveries: DeliveryInsert[]
): Promise<number> {
  const { data, error } = await supabase
    .from('deliveries')
    .upsert(deliveries, { onConflict: 'tour_id,poc_external_id' })
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

// ── DEVOLUTIONS ──────────────────────────────────────────────

export async function fetchDevolutions(tourId?: string): Promise<Devolution[]> {
  let query = supabase
    .from('devolutions')
    .select('*')
    .order('created_at', { ascending: false });

  if (tourId) query = query.eq('tour_id', tourId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchPendingDevolutions() {
  const { data, error } = await supabase
    .from('devolutions')
    .select('*, deliveries(poc_name), tours(external_tour_id, driver_name, tour_date)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertDevolution(
  devolution: DevolutionInsert
): Promise<Devolution> {
  const { data, error } = await supabase
    .from('devolutions')
    .insert(devolution)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveDevolution(
  id: string,
  approval: DevolutionApproval,
  supervisorId: string
): Promise<Devolution> {
  const { data, error } = await supabase
    .from('devolutions')
    .update({
      status: approval.status,
      supervisor_id: supervisorId,
      approved_at: new Date().toISOString(),
      supervisor_comments: approval.supervisor_comments ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToDevolutions(callback: () => void) {
  const channel = supabase
    .channel(`devolutions-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'devolutions' }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
}