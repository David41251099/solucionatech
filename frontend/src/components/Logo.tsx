import { Box } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
        <Box className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-semibold text-foreground">
        Soluciona<span className="text-secondary">Tech</span>
      </span>
    </div>
  );
}
