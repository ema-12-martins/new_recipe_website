This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### App access and first-owner setup

Owning the GitHub repository or Vercel deployment does not create an app account.
The cookbook uses separate Supabase email/password accounts and cookbook memberships.
There is no public registration: the first owner sets up the cookbook, then invites
family members.

- For a new database, open `/en/setup` (or `/pt/setup`), enter the server's
  `OWNER_SETUP_CODE`, and choose your own email and password (at least 8 characters).
  The setup code is configured in the server environment; never publish it.
- Once a cookbook exists, setup is locked. Use `/en/sign-in` (or `/pt/sign-in`)
  with the existing owner's credentials. For a lost owner password, the operator
  must reset it in the Supabase dashboard; do not delete the cookbook to regain access.
- The current deployment at https://newrecipewebsite.vercel.app uses the DEV
  Supabase database. Automated integration/E2E tests can wipe its accounts and
  recipes and replace the owner with a generated test account. Test credentials
  are temporary, not a permanent owner login. Do not store real family recipes there.
- Before real use, configure a separate production Supabase project, apply the
  migrations, point Vercel Production at it, and complete first-owner setup with
  your own credentials. Keep database-reset tests restricted to DEV.

### Testing invite links

An owner creates a one-time invite on the Members page. Opening the link does not
use it up; it expires after seven days or becomes invalid when revoked or redeemed.
Someone already signed in can create the invited account without signing out.
Their current session stays unchanged in all normal tabs. To use the new account
at the same time, open a private window or a different browser and sign in there.
Signed-out invitees are signed in automatically after creating their account.

If invite validation is unavailable, retry rather than replacing the link. Check
server logs for `Invite availability lookup failed.` and its status/code. Verify
that Vercel's Supabase URL, publishable key, and server-only secret key all belong
to the same project and that its invite migration has been applied. Never paste
keys, passwords, or full invite URLs into logs or support reports.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
