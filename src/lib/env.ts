import { z } from "zod";

// Each variable is read by name so Next can inline NEXT_PUBLIC_* in the client bundle.
// The schema grows with the slice that starts using a variable (see .env.example).
const schema = z.object({
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
});

export const env = schema.parse({
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
});
