import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  description,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div className={`p-6 bg-card border border-border rounded-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-primary opacity-20" />
      </div>
    </div>
  );
}
