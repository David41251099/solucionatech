import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import type { TicketStatus } from "../types";
import {
  getStatusBadgeClass,
  getStatusLabel,
  type TicketViewerRole,
} from "../utils/ticketStatus";

interface StatusBadgeProps {
  status: TicketStatus;
  role?: TicketViewerRole;
}

export const StatusBadge = ({ status, role }: StatusBadgeProps) => {
  const label = getStatusLabel(status, role);
  if (!label) {
    return null;
  }

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Badge className={getStatusBadgeClass(status, role)} variant="outline">
        {label}
      </Badge>
    </motion.div>
  );
};
