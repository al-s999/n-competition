import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreTextClass(score: number): string {
  if (score >= 80) return "text-green-500 font-bold";
  if (score >= 60) return "text-yellow-500 font-bold";
  return "text-red-500 font-bold";
}
