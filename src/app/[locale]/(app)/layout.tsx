import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getCurrentMembership } from "@/lib/auth/membership";

/** Member-only area: visitors without a cookbook membership are sent to sign-in. */
export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Server Components cannot clear cookies, so a stale session is left alone;
  // every data path is RLS-gated regardless.
  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);

  return <main className="space-y-6">{children}</main>;
}
