import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A cream paper chip with an arrow; shared by the link and the in-page (button) variants. */
export const backButtonClassName = cn(
  buttonVariants({ variant: "outline" }),
  "group h-11 max-w-full rounded-full border-border/50 bg-accent px-4 font-bold text-accent-foreground shadow-xs hover:bg-accent/70",
);

export const backArrowClassName =
  "transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none";

export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(backButtonClassName, className)}>
      <ArrowLeft aria-hidden className={backArrowClassName} />
      <span className="truncate">{children}</span>
    </Link>
  );
}
