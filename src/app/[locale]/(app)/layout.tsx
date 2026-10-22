import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OfflineNotice } from "@/components/offline-notice";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { isLocale } from "@/i18n/config";
import { requireMembership } from "@/lib/auth/require-membership";

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
  await requireMembership(locale);

  return (
    <>
      <ServiceWorkerRegistrar />
      <OfflineNotice locale={locale} />
      <AppHeader locale={locale} />
      <main className="space-y-6">{children}</main>
    </>
  );
}
