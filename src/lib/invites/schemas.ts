import { z } from "zod";

export const joinSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  // Same rule as the owner's password; used exactly as typed (no trimming).
  password: z.string().min(8).max(128),
  locale: z.enum(["pt", "en"]),
});

export type JoinInput = z.infer<typeof joinSchema>;

export const createInviteSchema = z.object({
  label: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value === "" ? null : value)),
});
