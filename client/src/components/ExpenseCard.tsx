import { Expense } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from './Avatar';

interface ExpenseCardProps {
  expense: Expense;
  currentUserId: string;
  onDelete?: (id: string) => void;
}

export function ExpenseCard({ expense, currentUserId, onDelete }: ExpenseCardProps) {
  const yourShare = parseFloat(expense.your_share || '0');
  const isYourExpense = expense.paid_by === currentUserId;
  const isSettled = expense.your_share_settled;

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        {/* Payer avatar */}
        <Avatar
          name={expense.paid_by_name}
          color={expense.paid_by_avatar_color}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-text-primary font-semibold text-sm truncate">
                {expense.title}
              </h4>
              <p className="text-text-muted text-xs mt-0.5">
                {isYourExpense ? 'You paid' : `${expense.paid_by_name} paid`}
                {' · '}{formatDate(expense.created_at)}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-text-primary font-semibold tabular-nums text-sm">
                {formatCurrency(expense.amount)}
              </p>
              {yourShare > 0 && (
                <p className={`text-xs tabular-nums mt-0.5 ${
                  isSettled
                    ? 'text-neutral-muted'
                    : isYourExpense
                    ? 'text-positive'
                    : 'text-negative'
                }`}>
                  {isSettled
                    ? 'settled'
                    : isYourExpense
                    ? `+${formatCurrency(parseFloat(expense.amount) - yourShare)}`
                    : `-${formatCurrency(yourShare)}`}
                </p>
              )}
            </div>
          </div>

          {/* Split type badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-text-muted bg-slate-elevated px-2 py-0.5 rounded-full capitalize">
              {expense.split_type} split
            </span>
            {isSettled && (
              <span className="text-[10px] text-neutral-muted bg-slate-elevated px-2 py-0.5 rounded-full">
                ✓ settled
              </span>
            )}
          </div>
        </div>

        {/* Delete button - only for payer */}
        {isYourExpense && onDelete && (
          <button
            onClick={() => onDelete(expense.id)}
            className="touch-target flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-negative transition-colors"
            aria-label="Delete expense"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
