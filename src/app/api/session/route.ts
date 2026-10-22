import { getMembershipStatus } from "@/lib/auth/membership";

export const dynamic = "force-dynamic";

function respond(body: { ok: false; reason?: "unavailable" }, status: number): Response;
function respond(body: { ok: true; userId: string }, status: number): Response;
function respond(
  body: { ok: false; reason?: "unavailable" } | { ok: true; userId: string },
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const result = await getMembershipStatus();
  if (result.status === "member") {
    return respond({ ok: true, userId: result.membership.userId }, 200);
  }
  if (result.status === "none") return respond({ ok: false }, 401);
  return respond({ ok: false, reason: "unavailable" }, 503);
}
