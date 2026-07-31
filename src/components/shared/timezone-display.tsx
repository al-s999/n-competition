"use client";

import { format } from "date-fns";

interface TimezoneDisplayProps {
  date: string;
  compact?: boolean;
  showBadge?: boolean;
  sourceTimezone?: any;
}

export function TimezoneDisplay({ date, compact = false }: TimezoneDisplayProps) {
  try {
    const d = new Date(date);
    if (compact) {
      return <span>{format(d, "dd MMM yyyy")}</span>;
    }
    return <span>{format(d, "dd MMM yyyy, HH:mm")}</span>;
  } catch {
    return <span>{date}</span>;
  }
}
