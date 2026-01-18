'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '../context/RoleContext';
import { UserRole } from '../types/enums';

export default function Navbar() {
  const { currentRole, setRole, currentUserId, setUserId } = useRole();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-500 to-teal-400 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="bg-white text-cyan-600 px-2 rounded-md">WO</span>
              WorkOrder<span className="font-light">App</span>
            </Link>
          </div>

          {/* Role Selector & User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-4 hidden md:flex">
              <span className="text-xs text-cyan-50 uppercase font-semibold tracking-wider opacity-90">Current Role</span>
              <span className={`text-sm font-bold ${
                currentRole === UserRole.ADMIN ? 'text-red-100' :
                currentRole === UserRole.SPV ? 'text-purple-100' :
                'text-green-100'
              }`}>
                {currentRole}
              </span>
            </div>

            {/* Role Dropdown */}
            <select
              value={currentRole}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="block w-32 pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            
             {/* Hidden User ID Input (Functionality Preserved) */}
             <div className="hidden">
                <input 
                    type="text" 
                    value={currentUserId}
                    onChange={(e) => setUserId(e.target.value)}
                />
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
