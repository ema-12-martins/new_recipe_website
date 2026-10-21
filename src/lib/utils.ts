import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Local cn (clsx + tailwind-merge). The npm package "cn" was rejected in 01-09; never import from it.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
