import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Cargando..." }: LoadingStateProps) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default LoadingState;

