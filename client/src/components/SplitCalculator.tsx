'use client';

import { useState, useEffect } from 'react';
import { GroupMember } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from './Avatar';

type SplitType = 'equal' | 'custom' | 'percentage';

interface SplitEntry {
  user_id: string;
  value: number;
}

interface SplitCalculatorProps {
  members: GroupMember[];
  totalAmount: number;
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  onSplitsChange: (splits: SplitEntry[]) => void;
}

export function SplitCalculator({
  members,
  totalAmount,
  splitType,
  onSplitTypeChange,
  onSplitsChange,
}: SplitCalculatorProps) {
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  // Initialize equal splits
  useEffect(() => {
    if (splitType === 'equal') {
      const equalShare = members.length > 0 ? totalAmount / members.length : 0;
      const splits = members.map((m) => ({ user_id: m.id, value: equalShare }));
      onSplitsChange(splits);
    }
  }, [splitType, members, totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCustomChange(userId: string, value: string) {
    const newValues = { ...customValues, [userId]: value };
    setCustomValues(newValues);

    const splits = members.map((m) => ({
      user_id: m.id,
      value: parseFloat(newValues[m.id] || '0') || 0,
    }));
    onSplitsChange(splits);
  }

  const equalShare = members.length > 0 ? totalAmount / members.length : 0;

  const customTotal = Object.values(customValues).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const customDiff = Math.abs(customTotal - totalAmount);
  const customValid = customDiff < 0.01;

  const pctTotal = Object.values(customValues).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const pctValid = Math.abs(pctTotal - 100) < 0.01;

  return (
    <div className="space-y-4">
      {/* Split type selector */}
      <div className="flex gap-2">
        {(['equal', 'custom', 'percentage'] as SplitType[]).map((type) => (
          <button
            key={type}
            onClick={() => {
              setCustomValues({});
              onSplitTypeChange(type);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-btn capitalize transition-all ${
              splitType === type
                ? 'bg-sage text-white'
                : 'bg-slate-elevated border border-slate-border text-text-secondary'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Members list */}
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar name={member.name} color={member.avatar_color} size="sm" />
            <span className="text-text-primary text-sm flex-1 truncate">{member.name}</span>

            {splitType === 'equal' && (
              <span className="text-text-secondary text-sm tabular-nums font-medium">
                {formatCurrency(equalShare)}
              </span>
            )}

            {splitType === 'custom' && (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={customValues[member.id] || ''}
                  onChange={(e) => handleCustomChange(member.id, e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-elevated border border-slate-border rounded-input text-text-primary text-sm tabular-nums pl-6 pr-2 py-2 w-24 text-right focus:outline-none focus:border-sage"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {splitType === 'percentage' && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={customValues[member.id] || ''}
                  onChange={(e) => handleCustomChange(member.id, e.target.value)}
                  placeholder="0"
                  className="bg-slate-elevated border border-slate-border rounded-input text-text-primary text-sm tabular-nums pr-6 pl-2 py-2 w-20 text-right focus:outline-none focus:border-sage"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validation */}
      {splitType === 'custom' && (
        <div className={`text-sm px-3 py-2 rounded-input ${
          customValid
            ? 'text-positive bg-positive/10 border border-positive/20'
            : 'text-negative bg-negative/10 border border-negative/20'
        }`}>
          Total: {formatCurrency(customTotal)}{' '}
          {!customValid && `(${customDiff > 0 ? '-' : '+'}${formatCurrency(Math.abs(totalAmount - customTotal))} remaining)`}
          {customValid && '✓'}
        </div>
      )}

      {splitType === 'percentage' && (
        <div className={`text-sm px-3 py-2 rounded-input ${
          pctValid
            ? 'text-positive bg-positive/10 border border-positive/20'
            : 'text-negative bg-negative/10 border border-negative/20'
        }`}>
          Total: {pctTotal.toFixed(1)}%{' '}
          {!pctValid && `(${Math.abs(100 - pctTotal).toFixed(1)}% remaining)`}
          {pctValid && '✓'}
        </div>
      )}
    </div>
  );
}
