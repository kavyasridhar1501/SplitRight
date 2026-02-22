'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groups as groupsApi } from '@/lib/api';

export default function JoinGroupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await groupsApi.join({ invite_code: inviteCode.toUpperCase() }) as {
        success: boolean;
        data?: { group: { id: string } };
        error?: string;
      };

      if (res.success && res.data) {
        router.push(`/groups/${res.data.group.id}`);
      } else {
        setError(res.error || 'Failed to join group');
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
        <h1 className="text-text-primary text-xl font-bold">Join Group</h1>
      </div>

      <div className="card p-5 mb-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-sage-subtle border border-sage/20 flex items-center justify-center mx-auto mb-3">
          <LinkIcon />
        </div>
        <p className="text-text-secondary text-sm">
          Ask a group member for their 8-character invite code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-1.5">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB3C7DEF"
            className="input-field text-center text-xl tracking-widest font-mono uppercase"
            maxLength={8}
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-negative text-sm bg-negative/10 border border-negative/20 rounded-input px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || inviteCode.length < 8}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Joining...' : 'Join Group'}
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

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
