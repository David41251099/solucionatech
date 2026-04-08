import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "orange";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-slate-700 bg-slate-100",
  blue: "text-blue-700 bg-blue-100",
  green: "text-emerald-700 bg-emerald-100",
  amber: "text-amber-700 bg-amber-100",
  orange: "text-orange-700 bg-orange-100",
};

export function StatCard({ label, value, icon, tone = "neutral" }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}

export default StatCard;
