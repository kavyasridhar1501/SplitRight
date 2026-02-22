'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { balances as balancesApi, settlements as settlementsApi, groups as groupsApi } from '@/lib/api';
import { Balance, Settlement, Group, SettlementRecord } from '@/lib/types';
import { BalanceCard } from '@/components/BalanceCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function BalancesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [balancesList, setBalancesList] = useState<Balance[]>([]);
  const [settlementsList, setSettlementsList] = useState<Settlement[]>([]);
  const [history, setHistory] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingSettlement, setSettlingSettlement] = useState<Settlement | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'debts' | 'history'>('debts');

  const loadData = useCallback(async () => {
    try {
      const [groupRes, balancesRes, historyRes] = await Promise.all([
        groupsApi.get(params.id) as Promise<{ success: boolean; data?: { group: Group } }>,
        balancesApi.get(params.id) as Promise<{
          success: boolean;
          data?: { balances: Balance[]; settlements: Settlement[] };
        }>,
        settlementsApi.list(params.id) as Promise<{
          success: boolean;
          data?: { settlements: SettlementRecord[] };
        }>,
      ]);

      if (groupRes.success && groupRes.data) setGroup(groupRes.data.group);
      if (balancesRes.success && balancesRes.data) {
        setBalancesList(balancesRes.data.balances);
        setSettlementsList(balancesRes.data.settlements);
      }
      if (historyRes.success && historyRes.data) setHistory(historyRes.data.settlements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSettle(settlement: Settlement) {
    setSettleLoading(true);
    try {
      const res = await settlementsApi.create(params.id, {
        from_user_id: settlement.from.id,
        to_user_id: settlement.to.id,
        amount: settlement.amount,
      }) as { success: boolean; error?: string };

      if (res.success) {
        showToast('Payment recorded!', 'success');
        setSettlingSettlement(null);
        await loadData();
      } else {
        showToast(res.error || 'Failed to record payment', 'error');
      }
    } catch {
      showToast('Failed to record payment', 'error');
    } finally {
      setSettleLoading(false);
    }
  }

  const myBalance = balancesList.find((b) => b.user.id === user?.id);

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4">
        <div className="h-8 bg-slate-elevated rounded animate-pulse mb-6 w-1/2" />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <ToastContainer />

      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-surface border-b border-slate-border">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="touch-target flex items-center justify-center w-9 h-9 rounded-xl bg-slate-elevated border border-slate-border"
          >
            <BackIcon />
          </button>
          <div>
            <h1 className="text-text-primary text-xl font-bold">Balances</h1>
            {group && <p className="text-text-muted text-xs">{group.name}</p>}
          </div>
        </div>

        {/* My balance summary */}
        {myBalance && (
          <div className="bg-slate-elevated rounded-xl p-4 border border-slate-border">
            <p className="text-text-muted text-xs mb-1">Your balance</p>
            <p className={`text-2xl font-bold tabular-nums ${
              myBalance.netBalance > 0.01
                ? 'text-positive'
                : myBalance.netBalance < -0.01
                ? 'text-negative'
                : 'text-neutral-muted'
            }`}>
              {myBalance.netBalance > 0.01 ? '+' : ''}
              {formatCurrency(myBalance.netBalance)}
            </p>
            <p className="text-text-muted text-xs mt-1">
              {myBalance.netBalance > 0.01
                ? 'You are owed'
                : myBalance.netBalance < -0.01
                ? 'You owe'
                : 'All settled up!'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-border px-4">
        {(['debts', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-sage border-b-2 border-sage'
                : 'text-text-muted'
            }`}
          >
            {tab === 'debts' ? 'Who Owes What' : 'History'}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {activeTab === 'debts' ? (
          <>
            {/* All balances */}
            {balancesList.length > 0 && (
              <div className="mb-4">
                <p className="section-header mb-3">All Balances</p>
                <div className="space-y-2">
                  {balancesList.map((balance) => (
                    <div key={balance.user.id} className="card px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={balance.user.name} color={balance.user.avatar_color} size="sm" />
                        <span className="text-text-primary text-sm font-medium">{balance.user.name}</span>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${
                        balance.netBalance > 0.01
                          ? 'text-positive'
                          : balance.netBalance < -0.01
                          ? 'text-negative'
                          : 'text-neutral-muted'
                      }`}>
                        {balance.netBalance > 0.01 ? '+' : ''}
                        {formatCurrency(balance.netBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested settlements */}
            <p className="section-header mb-3">Suggested Payments</p>
            {settlementsList.length === 0 ? (
              <EmptyState
                icon={<CheckIcon />}
                title="All settled up!"
                description="No outstanding payments in this group"
              />
            ) : (
              <div className="space-y-3">
                {settlementsList.map((s, i) => (
                  <BalanceCard
                    key={i}
                    settlement={s}
                    currentUserId={user?.id || ''}
                    onSettle={setSettlingSettlement}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="section-header mb-3">Payment History</p>
            {history.length === 0 ? (
              <EmptyState
                icon={<HistoryIcon />}
                title="No payments yet"
                description="Payment history will appear here"
              />
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="card px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={record.from_name} color={record.from_avatar_color} size="sm" />
                        <div>
                          <p className="text-text-primary text-sm">
                            <span className="font-medium">{record.from_name}</span>
                            {' → '}
                            <span className="font-medium">{record.to_name}</span>
                          </p>
                          {record.note && (
                            <p className="text-text-muted text-xs">{record.note}</p>
                          )}
                          <p className="text-text-muted text-xs">{formatDate(record.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-positive text-sm font-semibold tabular-nums">
                        {formatCurrency(record.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Settle confirmation modal */}
      {settlingSettlement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60">
          <div className="w-full max-w-mobile bg-slate-elevated rounded-t-2xl border border-slate-border p-5 space-y-4">
            <h3 className="text-text-primary font-semibold text-base">Confirm Payment</h3>
            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={settlingSettlement.from.name} color={settlingSettlement.from.avatar_color} size="md" />
                <div>
                  <p className="text-text-secondary text-xs">From</p>
                  <p className="text-text-primary font-medium text-sm">{settlingSettlement.from.name}</p>
                </div>
              </div>
              <ArrowIcon />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-text-secondary text-xs">To</p>
                  <p className="text-text-primary font-medium text-sm">{settlingSettlement.to.name}</p>
                </div>
                <Avatar name={settlingSettlement.to.name} color={settlingSettlement.to.avatar_color} size="md" />
              </div>
            </div>
            <p className="text-center text-2xl font-bold text-positive tabular-nums">
              {formatCurrency(settlingSettlement.amount)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSettlingSettlement(null)}
                className="btn-secondary flex-1 py-3 text-sm"
                disabled={settleLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettle(settlingSettlement)}
                disabled={settleLoading}
                className="btn-primary flex-1 py-3 text-sm disabled:opacity-50"
              >
                {settleLoading ? 'Recording...' : 'Mark as Paid'}
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

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
