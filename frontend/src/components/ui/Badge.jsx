import { cn } from '../../utils/cn';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../../utils/constants';

export function SeverityBadge({ severity, className }) {
  const color = SEVERITY_COLORS[severity];
  const label = SEVERITY_LABELS[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function CategoryBadge({ icon, label, color, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}35`,
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

export function LiveBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest',
        'bg-red-500/15 text-red-400 border border-red-500/25',
        className
      )}
    >
      {/* Ping animation instead of simple pulse */}
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
      </span>
      LIVE
    </span>
  );
}

export function MicroLabel({ children, className }) {
  return (
    <span className={cn('micro-label', className)}>
      {children}
    </span>
  );
}
