'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { groups as groupsApi, balances as balancesApi } from '@/lib/api';
import { Group } from '@/lib/types';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/LoadingSkeleton';
import { formatCurrency } from '@/lib/utils';

interface GroupWithBalance extends Group {
  netBalance: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [groupsList, setGroupsList] = useState<GroupWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await groupsApi.list() as { success: boolean; data?: { groups: Group[] } };
        if (!res.success || !res.data) return;

        const gs = res.data.groups;

        // Fetch balances for each group
        const enriched = await Promise.all(
          gs.map(async (group) => {
            try {
              const bRes = await balancesApi.get(group.id) as {
                success: boolean;
                data?: { balances: Array<{ user: { id: string }; netBalance: number }> };
              };
              if (bRes.success && bRes.data && user) {
                const myBalance = bRes.data.balances.find((b) => b.user.id === user.id);
                return { ...group, netBalance: myBalance?.netBalance || 0 };
              }
            } catch { /* ignore */ }
            return { ...group, netBalance: 0 };
          })
        );

        setGroupsList(enriched);
        const total = enriched.reduce((sum, g) => sum + g.netBalance, 0);
        setTotalBalance(total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  const isPositive = totalBalance > 0.01;
  const isNegative = totalBalance < -0.01;

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-text-muted text-sm">Welcome back,</p>
        <h1 className="text-text-primary text-2xl font-bold">{user?.name?.split(' ')[0]}</h1>
      </div>

      {/* Net balance summary card */}
      <div className="card p-5 mb-6 bg-slate-surface" style={{ background: 'linear-gradient(135deg, #161b22 0%, #1a2332 100%)' }}>
        <p className="section-header mb-2">Overall Balance</p>
        <p className={`text-3xl font-bold tabular-nums ${
          isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-neutral-muted'
        }`}>
          {isPositive ? '+' : ''}{formatCurrency(totalBalance)}
        </p>
        <p className="text-text-muted text-sm mt-1">
          {isPositive
            ? 'You are owed across all groups'
            : isNegative
            ? 'You owe across all groups'
            : 'All settled up!'}
        </p>
      </div>

      {/* Groups section */}
      <div className="flex items-center justify-between mb-3">
        <p className="section-header">Your Groups</p>
        <div className="flex gap-2">
          <Link href="/groups/join" className="text-sage text-sm font-medium">
            Join
          </Link>
          <span className="text-slate-border">·</span>
          <Link href="/groups/new" className="text-sage text-sm font-medium">
            New
          </Link>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : groupsList.length === 0 ? (
        <EmptyState
          icon={<GroupsEmptyIcon />}
          title="No groups yet"
          description="Create or join a group to get started splitting expenses"
          action={
            <div className="flex gap-3">
              <Link href="/groups/new" className="btn-primary px-5 py-2.5 text-sm">
                Create Group
              </Link>
              <Link href="/groups/join" className="btn-secondary px-5 py-2.5 text-sm">
                Join Group
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {groupsList.map((group) => (
            <GroupCard key={group.id} group={group} netBalance={group.netBalance} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupsEmptyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
