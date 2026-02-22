import Link from 'next/link';
import { Group } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface GroupCardProps {
  group: Group;
  netBalance?: number;
}

export function GroupCard({ group, netBalance = 0 }: GroupCardProps) {
  const isPositive = netBalance > 0.01;
  const isNegative = netBalance < -0.01;
  const isSettled = Math.abs(netBalance) <= 0.01;

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="card p-4 active:opacity-80 transition-opacity">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Group avatar */}
            <div className="w-11 h-11 rounded-xl bg-sage-subtle border border-sage/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sage font-semibold text-base">
                {group.name[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-semibold text-base truncate">
                {group.name}
              </h3>
              <p className="text-text-muted text-xs mt-0.5">
                {group.member_count} member{group.member_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="text-right flex-shrink-0">
            {isSettled ? (
              <span className="text-neutral-muted text-sm font-medium">Settled</span>
            ) : (
              <>
                <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-positive' : 'text-negative'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(netBalance)}
                </p>
                <p className="text-text-muted text-[10px] mt-0.5">
                  {isPositive ? 'you are owed' : 'you owe'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
