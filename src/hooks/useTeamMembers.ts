import { useCallback, useEffect, useState } from 'react';
import { TeamMemberSchedule } from '../types';
import {
  listTeamMembers,
  subscribeToTeamMembers,
  createTeamMember,
  updateTeamMemberProfile,
  deleteTeamMember,
  NewTeamMemberInput,
  TeamMemberProfilePatch,
} from '../services/api/teamMembers';

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberSchedule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setTeamMembers(await listTeamMembers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    return subscribeToTeamMembers(reload);
  }, [reload]);

  async function addMember(input: NewTeamMemberInput): Promise<void> {
    await createTeamMember(input);
  }

  async function editMember(id: string, patch: TeamMemberProfilePatch): Promise<void> {
    await updateTeamMemberProfile(id, patch);
    await reload();
  }

  async function removeMember(id: string): Promise<void> {
    await deleteTeamMember(id);
  }

  return { teamMembers, loading, error, reload, addMember, editMember, removeMember };
}