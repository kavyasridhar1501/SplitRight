'use client';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AmountInput({ value, onChange, placeholder = '0.00', className = '' }: AmountInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // Allow only valid decimal input
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl font-semibold pointer-events-none">
        $
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field pl-8 text-xl font-semibold tabular-nums text-text-primary"
        min="0"
        step="0.01"
      />
    </div>
  );
}
