import { notFound } from "next/navigation";

import { LOCALE_NAMES, isLocale } from "@/i18n/config";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main>
      <h1 className="text-2xl font-semibold">{LOCALE_NAMES[locale]}</h1>
    </main>
  );
}
