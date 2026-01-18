'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/src/context/RoleContext';
import api from '@/src/api/axios';
import { UserRole } from '@/src/types/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const { currentRole, currentUserId } = useRole();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not ADMIN
  useEffect(() => {
    // Small delay to allow role context to settle, or check immediate if available
    // For simpler implementation, we'll just check in render or submit, 
    // but redirect is better UX.
    if (currentRole && currentRole !== UserRole.ADMIN) {
       router.push('/');
    }
  }, [currentRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
        setError("Title is required");
        return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/work-orders', {
        title,
        description
      });
      // Redirect to list on success
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to create work order');
    } finally {
      setLoading(false);
    }
  };

  if (currentRole !== UserRole.ADMIN) {
      return (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Checking permissions...</p>
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:bg-transparent hover:text-cyan-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="border-cyan-100 shadow-md bg-white">
            <CardHeader className="bg-cyan-50/50 border-b border-cyan-100 pb-4">
                <CardTitle className="text-xl font-bold text-cyan-900">Create New Work Order</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {error && (
                    <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Work Order Title / Fleet Number <span className="text-red-500">*</span></label>
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Excavator XB-204 Brake Issue"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue or maintenance required..."
                            rows={5}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-y"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? 'Creating...' : 'Create Order'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
