import { useEffect, useState } from "react";
import { useSocketStatus } from "../hooks/useSocketStatus";
import {
  getRealtimeDebugHistory,
  subscribeRealtimeDebug,
  type RealtimeDebugEntry,
} from "../utils/realtimeDebug";

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleTimeString();
};

export function RealtimeDebugPanel() {
  const socketConnected = useSocketStatus();
  const [isOpen, setIsOpen] = useState(true);
  const [entries, setEntries] = useState<RealtimeDebugEntry[]>(() => getRealtimeDebugHistory());

  useEffect(() => {
    return subscribeRealtimeDebug(() => {
      setEntries(getRealtimeDebugHistory());
    });
  }, []);

  return (
    <aside className="fixed bottom-4 left-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-300 bg-white/95 shadow-2xl backdrop-blur">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-sm font-semibold text-slate-900">Diagnostico tiempo real</span>
        <span className="text-xs text-slate-500">{isOpen ? "Ocultar" : "Mostrar"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-3 py-3">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                socketConnected ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium text-slate-700">
              Socket: {socketConnected ? "conectado" : "desconectado"}
            </span>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-auto text-xs">
            {entries.length === 0 ? (
              <p className="text-slate-500">Sin eventos todavia.</p>
            ) : (
              entries.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{entry.scope}</span>
                    <span className="text-[11px] text-slate-500">{formatTime(entry.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-slate-700">{entry.message}</p>
                  {entry.detail !== undefined && (
                    <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                      {JSON.stringify(entry.detail, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
