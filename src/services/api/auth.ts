import { supabase } from '../supabaseClient';

export type UserRole = 'analista' | 'supervisor' | 'gerencia';

export interface Profile {
  id: string;
  fullName: string;
  role: UserRole;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();
  if (error) return null;
  return { id: data.id, fullName: data.full_name, role: data.role as UserRole };
}