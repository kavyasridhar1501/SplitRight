'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { groups as groupsApi, balances as balancesApi } from '@/lib/api';
import { Group, Balance, Settlement } from '@/lib/types';
import { BalanceCard } from '@/components/BalanceCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/LoadingSkeleton';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface GroupBalance {
  group: Group;
  balances: Balance[];
  settlements: Settlement[];
  myBalance: number;
}

export default function BalancesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const groupsRes = await groupsApi.list() as { success: boolean; data?: { groups: Group[] } };
        if (!groupsRes.success || !groupsRes.data) return;

        const results = await Promise.all(
          groupsRes.data.groups.map(async (group) => {
            try {
              const bRes = await balancesApi.get(group.id) as {
                success: boolean;
                data?: { balances: Balance[]; settlements: Settlement[] };
              };
              if (bRes.success && bRes.data) {
                const myBalance = bRes.data.balances.find((b) => b.user.id === user.id);
                return {
                  group,
                  balances: bRes.data.balances,
                  settlements: bRes.data.settlements,
                  myBalance: myBalance?.netBalance || 0,
                };
              }
            } catch { /* ignore */ }
            return { group, balances: [], settlements: [], myBalance: 0 };
          })
        );

        // Filter to groups with activity
        const withActivity = results.filter((r) => Math.abs(r.myBalance) > 0.01);
        setGroupBalances(withActivity);

        const owed = results
          .filter((r) => r.myBalance > 0.01)
          .reduce((s, r) => s + r.myBalance, 0);
        const owe = results
          .filter((r) => r.myBalance < -0.01)
          .reduce((s, r) => s + Math.abs(r.myBalance), 0);

        setTotalOwed(owed);
        setTotalOwe(owe);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-text-primary text-2xl font-bold mb-6">Balances</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-text-muted text-xs mb-1">You are owed</p>
          <p className="text-positive text-xl font-bold tabular-nums">
            {formatCurrency(totalOwed)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs mb-1">You owe</p>
          <p className="text-negative text-xl font-bold tabular-nums">
            {formatCurrency(totalOwe)}
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : groupBalances.length === 0 ? (
        <EmptyState
          icon={<CheckIcon />}
          title="All settled up!"
          description="No outstanding balances across any of your groups"
        />
      ) : (
        <div className="space-y-5">
          {groupBalances.map(({ group, settlements }) => (
            <div key={group.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="section-header">{group.name}</p>
                <button
                  onClick={() => router.push(`/groups/${group.id}/balances`)}
                  className="text-sage text-xs"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {settlements
                  .filter(
                    (s) =>
                      s.from.id === user?.id || s.to.id === user?.id
                  )
                  .map((s, i) => (
                    <BalanceCard
                      key={i}
                      settlement={s}
                      currentUserId={user?.id || ''}
                      onSettle={() => router.push(`/groups/${group.id}/balances`)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
