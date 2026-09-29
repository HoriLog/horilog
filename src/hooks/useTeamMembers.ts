import { useCallback, useEffect, useState } from 'react';
import { TeamMemberSchedule } from '../types';
import { listTeamMembers, subscribeToTeamMembers } from '../services/api/teamMembers';

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { teamMembers, loading, error, reload };
}