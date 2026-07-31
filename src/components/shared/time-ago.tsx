"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface TimeAgoProps { userTimezone?: any; className?: string;
  date: string;
}

export function TimeAgo({ date }: TimeAgoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <span>...</span>;

  try {
    return <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>;
  } catch (e) {
    return <span>{date}</span>;
  }
}
