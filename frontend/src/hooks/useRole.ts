'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { DemoRole } from '@/types/factory';
import { DEMO_ACTORS } from '@/lib/permissions';

export function useRole() {
  const [role, setRoleState] = useState<DemoRole>('QUALITY_INSPECTOR');

  useEffect(() => {
    setRoleState(api.getRole());
  }, []);

  const switchRole = (newRole: DemoRole) => {
    api.setRole(newRole);
    setRoleState(newRole);
  };

  const actor = DEMO_ACTORS[role];

  return {
    role,
    actor,
    switchRole,
    isInspector: role === 'QUALITY_INSPECTOR',
    isOwner: role === 'OWNER',
    isDispatch: role === 'DISPATCH_OFFICER'
  };
}
