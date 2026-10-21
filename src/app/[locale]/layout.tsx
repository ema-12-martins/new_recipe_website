import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { isLocale, locales } from "@/i18n/config";

import "../globals.css";

export const metadata: Metadata = {
  title: "Family Recipe Cookbook",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
