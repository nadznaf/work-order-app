'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from '../types/enums';

interface RoleContextType {
  currentRole: UserRole;
  currentUserId: string;
  setRole: (role: UserRole) => void;
  setUserId: (id: string) => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Default User IDs (Simulated for this specific Seed Data)
const DEFAULT_IDS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'uuid-1',
  [UserRole.SPV]: 'uuid-2',
  [UserRole.MECHANIC]: 'uuid-3',
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('workOrderApp_role') as UserRole;
    const storedUserId = localStorage.getItem('workOrderApp_userId');

    if (storedRole && Object.values(UserRole).includes(storedRole)) {
      setCurrentRole(storedRole);
    }
    
    // If stored ID exists, use it. If not, use default for the role.
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else if (storedRole) {
      setCurrentUserId(DEFAULT_IDS[storedRole] || '');
    } else {
       // Default initialization
       setCurrentUserId(DEFAULT_IDS[UserRole.ADMIN]);
    }

    setIsLoading(false);
  }, []);

  // Update localStorage when state changes
  const changeRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('workOrderApp_role', role);
    
    // Auto-switch ID for convenience (optional feature)
    const newId = DEFAULT_IDS[role];
    if (newId) {
        setCurrentUserId(newId);
        localStorage.setItem('workOrderApp_userId', newId);
    }
  };

  const changeUserId = (id: string) => {
    setCurrentUserId(id);
    localStorage.setItem('workOrderApp_userId', id);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUserId,
        setRole: changeRole,
        setUserId: changeUserId,
        isLoading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
