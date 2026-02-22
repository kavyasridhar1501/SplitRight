'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groups as groupsApi } from '@/lib/api';

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await groupsApi.create({ name }) as {
        success: boolean;
        data?: { group: { id: string } };
        error?: string;
      };

      if (res.success && res.data) {
        router.push(`/groups/${res.data.group.id}`);
      } else {
        setError(res.error || 'Failed to create group');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
        >
          <BackIcon />
        </button>
        <h1 className="text-text-primary text-xl font-bold">New Group</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-1.5">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apartment 4B"
            className="input-field text-base"
            autoFocus
            maxLength={100}
          />
          <p className="text-text-muted text-xs mt-2">
            An invite code will be generated automatically
          </p>
        </div>

        {error && (
          <p className="text-negative text-sm bg-negative/10 border border-negative/20 rounded-input px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
