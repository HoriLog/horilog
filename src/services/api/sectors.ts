import { supabase } from '../supabaseClient';

export interface Sector {
  code:    string;
  vendedor: string;
  active:  boolean;
}

export async function fetchSectors(): Promise<Sector[]> {
  const { data, error } = await supabase
    .from('sectors')
    .select('code, vendedor, active')
    .eq('active', true)
    .order('code');
  if (error) throw error;
  return (data as Sector[]) ?? [];
}