import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RISK_CONFIG: Record<RiskLevel, { icon: string; text: string; className: string }> = {
  high:   { icon: '⚠', text: 'High Risk',   className: 'bg-red-600 text-white' },
  medium: { icon: '⚡', text: 'Medium Risk', className: 'bg-amber-400 text-amber-900' },
  low:    { icon: '✓',  text: 'Safe',        className: 'bg-green-600 text-white' },
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const { icon, text, className } = RISK_CONFIG[level];
  return (
    <span
      data-testid="risk-badge"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1',
        className,
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {text}
    </span>
  );
}
