// lib/trpc.ts
import { createTRPCClient, httpBatchLink, httpLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc";

const rawBase = process.env.EXPO_PUBLIC_APP_URL ?? "";
const apiBase = rawBase.replace(/\/+$/, ""); // entfernt überflüssige Slashes
console.log("[tRPC] Normalized base URL:", apiBase);

export const trpcVanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${apiBase}/api/trpc`,
    }),
  ],
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiBase}/api/trpc`,
    }),
  ],
});
