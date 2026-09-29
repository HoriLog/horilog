import { supabase } from '../supabaseClient';
import { TeamMemberSchedule } from '../../types';

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  cnh_number: string | null;
  cnh_category: string | null;
  assigned_plate: string | null;
  current_route: string | null;
  shift: string | null;
  driving_hours_today: string | null;
  continuous_driving_hours: string | null;
  daily_overtime_hours: string | null;
  journey_status: string | null;
  paired_with: string | null;
}

function rowToMember(row: TeamMemberRow): TeamMemberSchedule {
  return {
    id: row.id,
    name: row.name,
    role: row.role as TeamMemberSchedule['role'],
    phone: row.phone ?? undefined,
    cnhNumber: row.cnh_number ?? undefined,
    cnhCategory: row.cnh_category ?? undefined,
    assignedPlate: row.assigned_plate ?? undefined,
    currentRoute: row.current_route ?? undefined,
    shift: row.shift as TeamMemberSchedule['shift'],
    drivingHoursToday: row.driving_hours_today ?? undefined,
    continuousDrivingHours: row.continuous_driving_hours ?? undefined,
    dailyOvertimeHours: row.daily_overtime_hours ?? undefined,
    journeyStatus: row.journey_status as TeamMemberSchedule['journeyStatus'],
    pairedWith: row.paired_with ?? undefined,
  };
}

export async function listTeamMembers(): Promise<TeamMemberSchedule[]> {
  const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TeamMemberRow[]).map(rowToMember);
}

export interface NewTeamMemberInput {
  name: string;
  role: TeamMemberSchedule['role'];
  phone?: string;
  cnhNumber?: string;
  assignedPlate?: string;
}

export async function createTeamMember(input: NewTeamMemberInput): Promise<TeamMemberSchedule> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name: input.name,
      role: input.role,
      phone: input.phone || null,
      cnh_number: input.cnhNumber || null,
      assigned_plate: input.assignedPlate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToMember(data as TeamMemberRow);
}

export interface TeamMemberPatch {
  pairedWith?: string | null;
  continuousDrivingHours?: string;
  journeyStatus?: TeamMemberSchedule['journeyStatus'];
}

export async function updateTeamMember(id: string, patch: TeamMemberPatch): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({
      paired_with: patch.pairedWith === undefined ? undefined : patch.pairedWith,
      continuous_driving_hours: patch.continuousDrivingHours,
      journey_status: patch.journeyStatus,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToTeamMembers(onChange: () => void): () => void {
  const channelName = `team-members-changes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}