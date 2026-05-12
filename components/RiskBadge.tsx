import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  high:   { label: 'High Risk',   className: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  medium: { label: 'Medium Risk', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  low:    { label: 'Safe',        className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const { label, className } = RISK_CONFIG[level];
  return (
    <span
      data-testid="risk-badge"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0',
        className,
      )}
    >
      {label}
    </span>
  );
}
