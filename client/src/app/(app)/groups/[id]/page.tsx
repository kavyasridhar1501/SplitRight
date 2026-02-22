'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { groups as groupsApi, expenses as expensesApi } from '@/lib/api';
import { Group, GroupMember, Expense } from '@/lib/types';
import { ExpenseCard } from '@/components/ExpenseCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/Toast';

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [groupRes, expensesRes] = await Promise.all([
        groupsApi.get(params.id) as Promise<{
          success: boolean;
          data?: { group: Group; members: GroupMember[] };
        }>,
        expensesApi.list(params.id) as Promise<{
          success: boolean;
          data?: { expenses: Expense[] };
        }>,
      ]);

      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data.group);
        setMembers(groupRes.data.members);
      }
      if (expensesRes.success && expensesRes.data) {
        setExpenseList(expensesRes.data.expenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteExpense(expenseId: string) {
    try {
      const res = await expensesApi.delete(params.id, expenseId) as { success: boolean; error?: string };
      if (res.success) {
        setExpenseList((prev) => prev.filter((e) => e.id !== expenseId));
        showToast('Expense deleted', 'success');
      } else {
        showToast(res.error || 'Failed to delete expense', 'error');
      }
    } catch {
      showToast('Failed to delete expense', 'error');
    }
  }

  async function handleLeaveGroup() {
    setLeaveError('');
    try {
      const res = await groupsApi.leave(params.id) as { success: boolean; error?: string };
      if (res.success) {
        router.push('/groups');
      } else {
        setLeaveError(res.error || 'Failed to leave group');
      }
    } catch {
      setLeaveError('Failed to leave group');
    }
  }

  function copyInviteCode() {
    if (group) {
      navigator.clipboard.writeText(group.invite_code).then(() => {
        showToast('Invite code copied!', 'success');
      });
    }
  }

  const canAddExpense = members.length >= 2;

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4">
        <div className="h-8 bg-slate-elevated rounded animate-pulse mb-6 w-1/2" />
        <SkeletonList count={4} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-text-muted">Group not found</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <ToastContainer />

      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-surface border-b border-slate-border">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-text-primary text-xl font-bold">{group.name}</h1>
              <p className="text-text-muted text-xs">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
              aria-label="Show invite code"
            >
              <ShareIcon />
            </button>
            <Link
              href={`/groups/${params.id}/balances`}
              className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
            >
              <BalancesIcon />
            </Link>
          </div>
        </div>

        {/* Members row */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar name={member.name} color={member.avatar_color} size="sm" />
              <span className="text-text-muted text-[10px] max-w-[48px] truncate text-center">
                {member.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Invite code panel */}
        {showInvite && (
          <div className="mt-4 p-3 bg-slate-elevated rounded-xl border border-slate-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-xs mb-1">Invite Code</p>
                <p className="text-text-primary font-mono font-bold text-xl tracking-widest">
                  {group.invite_code}
                </p>
              </div>
              <button
                onClick={copyInviteCode}
                className="bg-sage-subtle border border-sage/30 text-sage text-sm font-medium px-3 py-2 rounded-btn active:opacity-70"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 flex gap-2 border-b border-slate-border">
        {canAddExpense ? (
          <Link
            href={`/groups/${params.id}/add`}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            + Add Expense
          </Link>
        ) : (
          <div className="flex-1">
            <button
              disabled
              className="btn-primary w-full py-2.5 text-sm opacity-40 cursor-not-allowed"
              title="Need at least 2 members to add expenses"
            >
              + Add Expense
            </button>
            <p className="text-text-muted text-xs text-center mt-1">
              Invite more members first
            </p>
          </div>
        )}
        <Link
          href={`/groups/${params.id}/balances`}
          className="btn-secondary py-2.5 px-4 text-sm"
        >
          Balances
        </Link>
      </div>

      {/* Expenses list */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="section-header">Expenses</p>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="text-text-muted text-xs hover:text-negative transition-colors"
          >
            Leave group
          </button>
        </div>

        {expenseList.length === 0 ? (
          <EmptyState
            icon={<ExpensesIcon />}
            title="No expenses yet"
            description={canAddExpense ? "Add the first expense to get started" : "Invite members then add expenses"}
            action={
              canAddExpense ? (
                <Link href={`/groups/${params.id}/add`} className="btn-primary px-5 py-2.5 text-sm">
                  Add First Expense
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {expenseList.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserId={user?.id || ''}
                onDelete={handleDeleteExpense}
              />
            ))}
          </div>
        )}
      </div>

      {/* Leave group confirm modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60">
          <div className="w-full max-w-mobile bg-slate-elevated rounded-t-2xl border border-slate-border p-5 space-y-4">
            <h3 className="text-text-primary font-semibold text-base">Leave {group.name}?</h3>
            {leaveError ? (
              <p className="text-negative text-sm bg-negative/10 border border-negative/20 rounded-input px-4 py-3">
                {leaveError}
              </p>
            ) : (
              <p className="text-text-secondary text-sm">
                You won&apos;t be able to see group expenses anymore. Make sure all balances are settled first.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowLeaveConfirm(false); setLeaveError(''); }}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 py-3 text-sm font-medium rounded-btn bg-negative/20 border border-negative/30 text-negative active:opacity-70 transition-opacity touch-target flex items-center justify-center"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
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

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function BalancesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
