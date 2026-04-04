import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const formatRelativeTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: es,
  });
};
