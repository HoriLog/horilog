import { supabase } from './supabaseClient';

interface AuditPayload {
  action:      'INSERT' | 'UPDATE' | 'DELETE';
  resource:    string;
  resource_id: string;
  description?: string;
  payload?:    Record<string, unknown>;
}

export async function logAudit(entry: AuditPayload): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    await supabase.from('audit_log').insert({
      user_id:     user.id,
      user_role:   profile?.role ?? null,
      action:      entry.action,
      resource:    entry.resource,
      resource_id: entry.resource_id,
      description:  entry.description ?? null,
      payload:     entry.payload ?? null,
    });
  } catch {
    // Audit nunca deve quebrar o fluxo principal
  }
}