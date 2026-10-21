import { z } from "zod";

export const ownerSetupSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  // Passwords are used exactly as typed (no trimming).
  password: z.string().min(8).max(128),
  setupCode: z.string().min(1),
  locale: z.enum(["pt", "en"]),
});

export type OwnerSetupInput = z.infer<typeof ownerSetupSchema>;
