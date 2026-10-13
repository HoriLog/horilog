import { supabase } from '../supabaseClient';

export interface Devolution {
  id: string;
  delivery_id: string;
  tour_id: string;
  poc_external_id: string;
  poc_name: string;
  reason: string;
  reason_description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisor_id?: string;
  approved_at?: string;
  supervisor_comments?: string;
  created_at: string;
  updated_at: string;
}

export const devolutionsApi = {
  async getAll(): Promise<Devolution[]> {
    const { data, error } = await supabase
      .from('devolutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    supervisorId: string,
    comments?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('devolutions')
      .update({
        status,
        supervisor_id: supervisorId,
        approved_at: new Date().toISOString(),
        supervisor_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }
};