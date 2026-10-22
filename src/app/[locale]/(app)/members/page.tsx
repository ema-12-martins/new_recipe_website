import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CreateInviteForm } from "@/components/create-invite-form";
import { RevokeInviteButton } from "@/components/revoke-invite-button";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

type InviteStatus = "active" | "used" | "expired" | "revoked";

type InviteRow = {
  id: string;
  label: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

type MemberRow = { user_id: string; email: string; role: "owner" | "member"; joined_at: string };

type InviteItem = { id: string; label: string | null; createdAt: string; status: InviteStatus };

function inviteStatus(invite: InviteRow, now: number): InviteStatus {
  if (invite.used_at) return "used";
  if (invite.revoked_at) return "revoked";
  if (new Date(invite.expires_at).getTime() <= now) return "expired";
  return "active";
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

/** Invites (newest first, with their status) and members, read under the owner's RLS. */
async function loadMembersData(): Promise<{ invites: InviteItem[]; people: MemberRow[] }> {
  const supabase = await createClient();
  const [invitesResult, peopleResult] = await Promise.all([
    supabase
      .from("invites")
      .select("id, label, created_at, expires_at, used_at, revoked_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("user_id, email, role, joined_at")
      .order("joined_at", { ascending: true }),
  ]);
  if (invitesResult.error) throw invitesResult.error;
  if (peopleResult.error) throw peopleResult.error;

  const now = Date.now();
  const invites = (invitesResult.data as InviteRow[]).map((invite) => ({
    id: invite.id,
    label: invite.label,
    createdAt: invite.created_at,
    status: inviteStatus(invite, now),
  }));
  return { invites, people: peopleResult.data as MemberRow[] };
}

export default async function MembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const membership = await getCurrentMembership();
  if (!membership) redirect(`/${locale}/sign-in`);
  // Only the owner manages invitations and access (D-09).
  if (membership.role !== "owner") notFound();

  const { invites, people } = await loadMembersData();
  const { members, recipes } = getDictionary(locale);

  return (
    <>
      <Link
        href={`/${locale}/recipes`}
        className="inline-block py-2 text-sm font-medium underline underline-offset-4"
      >
        {recipes.backToCookbook}
      </Link>

      <h1 className="text-2xl font-semibold">{members.heading}</h1>

      <section aria-labelledby="invites-heading" className="space-y-4">
        <h2 id="invites-heading" className="text-lg font-medium">
          {members.invitesHeading}
        </h2>
        <p className="text-base text-muted-foreground">{members.invitesIntro}</p>

        <CreateInviteForm
          locale={locale}
          labels={{
            labelField: members.labelField,
            labelHint: members.labelHint,
            createLink: members.createLink,
            panel: {
              linkReady: members.linkReady,
              linkField: members.linkField,
              linkNote: members.linkNote,
              copy: members.copy,
              copied: members.copied,
              copyFailed: members.copyFailed,
            },
          }}
        />

        {invites.length === 0 ? (
          <p className="text-base text-muted-foreground">{members.noInvites}</p>
        ) : (
          <ul className="divide-y rounded-md border" aria-label={members.invitesHeading}>
            {invites.map((invite) => {
              const name = invite.label ?? members.unlabelled;
              return (
                <li
                  key={invite.id}
                  data-testid="invite-row"
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-base break-words">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {members.createdOn.replace("{date}", formatDate(invite.createdAt, locale))}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{members.status[invite.status]}</span>
                    {invite.status === "active" ? (
                      <RevokeInviteButton
                        inviteId={invite.id}
                        locale={locale}
                        labels={{
                          revoke: members.revoke,
                          revokeLabel: members.revokeLabel.replace("{label}", name),
                          revokeConfirm: members.revokeConfirm,
                        }}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="people-heading" className="space-y-4">
        <h2 id="people-heading" className="text-lg font-medium">
          {members.peopleHeading}
        </h2>
        <ul className="divide-y rounded-md border">
          {people.map((person) => (
            <li key={person.user_id} className="space-y-1 px-4 py-3">
              <p className="text-base break-all">{person.email}</p>
              <p className="text-sm text-muted-foreground">
                {members.roles[person.role]} ·{" "}
                {members.joinedOn.replace("{date}", formatDate(person.joined_at, locale))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
