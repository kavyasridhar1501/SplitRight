'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { groups as groupsApi, expenses as expensesApi } from '@/lib/api';
import { GroupMember } from '@/lib/types';
import { AmountInput } from '@/components/AmountInput';
import { SplitCalculator } from '@/components/SplitCalculator';
import { Avatar } from '@/components/Avatar';

type SplitType = 'equal' | 'custom' | 'percentage';

interface SplitEntry {
  user_id: string;
  value: number;
}

export default function AddExpensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await groupsApi.get(params.id) as {
          success: boolean;
          data?: { members: GroupMember[] };
        };
        if (res.success && res.data) {
          setMembers(res.data.members);
          // Default paid by current user
          if (user) setPaidBy(user.id);
        }
      } finally {
        setLoadingMembers(false);
      }
    }
    if (user) loadMembers();
  }, [params.id, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!paidBy) {
      setError('Please select who paid');
      return;
    }

    // Validate splits for custom/percentage
    if (splitType !== 'equal') {
      const total = splits.reduce((s, sp) => s + sp.value, 0);
      if (splitType === 'custom' && Math.abs(total - parsedAmount) > 0.01) {
        setError(`Split amounts must sum to $${parsedAmount.toFixed(2)}`);
        return;
      }
      if (splitType === 'percentage' && Math.abs(total - 100) > 0.01) {
        setError('Percentages must sum to 100%');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: {
        title: string;
        amount: number;
        paid_by: string;
        split_type: SplitType;
        splits?: SplitEntry[];
      } = {
        title: title.trim(),
        amount: parsedAmount,
        paid_by: paidBy,
        split_type: splitType,
      };

      if (splitType !== 'equal') {
        payload.splits = splits;
      }

      const res = await expensesApi.create(params.id, payload) as {
        success: boolean;
        error?: string;
      };

      if (res.success) {
        router.push(`/groups/${params.id}`);
      } else {
        setError(res.error || 'Failed to add expense');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingMembers) {
    return (
      <div className="px-4 pt-12 space-y-4">
        <div className="h-8 bg-slate-elevated rounded animate-pulse w-1/2" />
        <div className="h-16 bg-slate-elevated rounded-card animate-pulse" />
        <div className="h-16 bg-slate-elevated rounded-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
        >
          <BackIcon />
        </button>
        <h1 className="text-text-primary text-xl font-bold">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-1.5">
            What was it for?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Groceries, Netflix, Rent"
            className="input-field"
            autoFocus
            maxLength={200}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-1.5">
            Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
          />
        </div>

        {/* Paid by */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-2">
            Paid by
          </label>
          <div className="flex gap-2 flex-wrap">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setPaidBy(member.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-btn border transition-all ${
                  paidBy === member.id
                    ? 'bg-sage-subtle border-sage text-sage'
                    : 'bg-slate-elevated border-slate-border text-text-secondary'
                }`}
              >
                <Avatar name={member.name} color={member.avatar_color} size="sm" />
                <span className="text-sm font-medium">{member.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Split calculator */}
        {parseFloat(amount) > 0 && members.length >= 2 && (
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Split
            </label>
            <div className="card p-4">
              <SplitCalculator
                members={members}
                totalAmount={parseFloat(amount) || 0}
                splitType={splitType}
                onSplitTypeChange={setSplitType}
                onSplitsChange={setSplits}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-negative text-sm bg-negative/10 border border-negative/20 rounded-input px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !title.trim() || !amount || !paidBy}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Expense'}
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
