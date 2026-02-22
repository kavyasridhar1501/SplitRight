import { Settlement } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from './Avatar';

interface BalanceCardProps {
  settlement: Settlement;
  currentUserId: string;
  onSettle?: (settlement: Settlement) => void;
}

export function BalanceCard({ settlement, currentUserId, onSettle }: BalanceCardProps) {
  const isYouOwe = settlement.from.id === currentUserId;
  const isOwedToYou = settlement.to.id === currentUserId;

  const otherPerson = isYouOwe ? settlement.to : settlement.from;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={otherPerson.name} color={otherPerson.avatar_color} size="md" />

        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-medium text-sm">
            {isYouOwe ? (
              <>
                You owe <span className="text-text-primary font-semibold">{settlement.to.name}</span>
              </>
            ) : isOwedToYou ? (
              <>
                <span className="text-text-primary font-semibold">{settlement.from.name}</span> owes you
              </>
            ) : (
              <>
                <span className="font-semibold">{settlement.from.name}</span> owes{' '}
                <span className="font-semibold">{settlement.to.name}</span>
              </>
            )}
          </p>
          <p className={`text-lg font-bold tabular-nums mt-0.5 ${
            isOwedToYou ? 'text-positive' : isYouOwe ? 'text-negative' : 'text-text-primary'
          }`}>
            {formatCurrency(settlement.amount)}
          </p>
        </div>

        {onSettle && (isYouOwe || isOwedToYou) && (
          <button
            onClick={() => onSettle(settlement)}
            className="bg-sage-subtle border border-sage/30 text-sage text-sm font-medium px-3 py-2 rounded-btn touch-target active:bg-sage-soft/20 transition-colors"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  );
}
