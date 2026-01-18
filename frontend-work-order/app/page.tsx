'use client';

import React, { useEffect, useState } from 'react';
import WorkOrderList from "@/src/components/WorkOrderList";
import { useRole } from "@/src/context/RoleContext";
import { userService } from "@/src/services/userService";

export default function Home() {
  const { currentRole } = useRole();
  const [displayName, setDisplayName] = useState<string>('');
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    const fetchUserIdentity = async () => {
      setLoadingName(true);
      try {
        // Fetch users with the current active role
        // We take the first one found to simulate the "Logged In" user for that role
        const data = await userService.getUsers(currentRole);
        if (data && data.length > 0) {
          setDisplayName(data[0].name);
        } else {
          setDisplayName(currentRole); // Fallback to Role Name if no user found
        }
      } catch (error) {
        console.error("Failed to fetch user identity", error);
        setDisplayName(currentRole);
      } finally {
        setLoadingName(false);
      }
    };

    if (currentRole) {
      fetchUserIdentity();
    }
  }, [currentRole]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-500">
            {loadingName ? 'Welcome back...' : `Hello, ${displayName}`}
          </p>
        </div>
      </div>
      <WorkOrderList />
    </div>
  );
}
