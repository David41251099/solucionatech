import type { ReactNode } from "react";

export interface DashboardTab {
  id: string;
  label: string;
  icon: ReactNode;
  ariaLabel?: string;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function DashboardTabs({ tabs, activeTab, onChange }: DashboardTabsProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"
      role="tablist"
      aria-label="Dashboard tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.ariaLabel ?? tab.label}
            onClick={() => onChange(tab.id)}
            className={`flex min-w-[96px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 text-xs transition-all duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[11px] uppercase tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
