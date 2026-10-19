import { supabase } from '../supabaseClient';

export interface Contact {
  id:         string;
  name:       string;
  role:       string;
  department: string | null;
  phone:      string;
  active:     boolean;
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, role, department, phone, active')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data as Contact[]) ?? [];
}