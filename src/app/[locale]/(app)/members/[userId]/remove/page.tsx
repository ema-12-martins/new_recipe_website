import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberRemovalForm } from "@/components/member-removal-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireMembership } from "@/lib/auth/require-membership";
import { getMember, listMemberRecipesForReview } from "@/lib/members/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RemoveMemberPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await requireMembership(locale);
  // Only the owner removes access (D-09), and never their own.
  if (membership.role !== "owner") notFound();
  if (!UUID.test(userId) || userId === membership.userId) notFound();

  const member = await getMember(userId);
  if (!member || member.role !== "member") notFound();

  const recipes = await listMemberRecipesForReview(userId);
  const { members } = getDictionary(locale);
  const removal = members.removal;

  return (
    <>
      <Link
        href={`/${locale}/members`}
        className="inline-block py-3 text-sm font-bold underline underline-offset-4"
      >
        {members.heading}
      </Link>

      <h1 className="text-3xl font-bold break-all">
        {removal.heading.replace("{email}", member.email)}
      </h1>

      <div className="paper-panel space-y-6">
        <p className="text-base text-muted-foreground">{removal.intro}</p>

        <MemberRemovalForm
          locale={locale}
          memberId={member.user_id}
          recipes={recipes.map(({ id, title }) => ({ id, title }))}
          labels={{
            keep: removal.keep,
            remove: removal.remove,
            noRecipes: removal.noRecipes,
            confirmNote: removal.confirmNote.replace("{email}", member.email),
            confirm: removal.confirm,
            cancel: removal.cancel,
          }}
        />
      </div>
    </>
  );
}
