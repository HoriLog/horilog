import { supabase } from '../supabaseClient';

export interface DevolutionRow {
  id: string;
  delivery_id: string | null;
  tour_id: string;
  poc_external_id: string | null;
  poc_name: string | null;
  reason: string | null;
  reason_description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisor_id: string | null;
  supervisor_name: string | null;
  approved_at: string | null;
  supervisor_comments: string | null;
  created_at: string;
  updated_at: string;
  external_tour_id: number | null;
}

export async function listDevolutions(): Promise<DevolutionRow[]> {
  const { data, error } = await supabase
    .from('devolutions')
    .select(`
      *,
      tour:tours(external_tour_id),
      supervisor:profiles(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d: any) => ({
    ...d,
    external_tour_id: d.tour?.external_tour_id ?? null,
    supervisor_name:  d.supervisor?.name ?? null,
    tour:       undefined,
    supervisor: undefined,
  }));
}

export async function createManualDevolution(params: {
  external_tour_id: string;
  poc_external_id: string;
  poc_name: string;
  reason: string;
  reason_description: string;
  supervisor_comments?: string;
}): Promise<void> {
  // Resolve external_tour_id (número da rota) → UUID interno
  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .select('id')
    .eq('external_tour_id', Number(params.external_tour_id))
    .single();

  if (tourError || !tour) {
    throw new Error(
      `Rota ${params.external_tour_id} não encontrada. Importe o CSV desta rota primeiro.`
    );
  }

  const { error } = await supabase.from('devolutions').insert({
    tour_id:             tour.id,
    poc_external_id:     params.poc_external_id,
    poc_name:            params.poc_name,
    reason:              params.reason,
    reason_description:  params.reason_description,
    supervisor_comments: params.supervisor_comments || null,
    status:              'PENDING',
  });

  if (error) throw error;
}

export async function resolveDevolution(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  supervisorId: string,
  comments: string | null
): Promise<void> {
  const { error } = await supabase
    .from('devolutions')
    .update({
      status,
      supervisor_id:       supervisorId,
      supervisor_comments: comments,
      approved_at:         new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}