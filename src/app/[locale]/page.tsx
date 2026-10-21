import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { common } = getDictionary(locale);

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">{common.appName}</h1>
      <p className="text-base opacity-80">{common.tagline}</p>
    </main>
  );
}
