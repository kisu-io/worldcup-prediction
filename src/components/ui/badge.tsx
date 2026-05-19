import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-white/10 text-slate-300 border-white/[0.08]",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  rose: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
