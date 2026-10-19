import { useMemo } from 'react';
import { useAuth } from './useAuth';

type Resource = 'buffer' | 'devolutions' | 'tours' | 'contacts';
type Action   = 'read' | 'create' | 'update' | 'delete' | 'approve';

const PERMISSIONS: Record<string, Record<Resource, Action[]>> = {
  analista: {
    buffer:      ['read', 'create', 'update'],
    devolutions: ['read', 'create'],
    tours:       ['read', 'create', 'update'],
    contacts:    ['read'],
  },
  supervisor: {
    buffer:      ['read', 'create', 'update', 'delete', 'approve'],
    devolutions: ['read', 'create', 'update', 'approve'],
    tours:       ['read', 'create', 'update'],
    contacts:    ['read', 'create', 'update'],
  },
  gerencia: {
    buffer:      ['read', 'create', 'update', 'delete', 'approve'],
    devolutions: ['read', 'create', 'update', 'approve'],
    tours:       ['read', 'create', 'update'],
    contacts:    ['read', 'create', 'update', 'delete'],
  },
};

export function usePermissions() {
  const { profile } = useAuth();

  const can = useMemo(() => {
    return (resource: Resource, action: Action): boolean => {
      const role = profile?.role as string | undefined;
      if (!role) return false;
      return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
    };
  }, [profile?.role]);

  return { can };
}