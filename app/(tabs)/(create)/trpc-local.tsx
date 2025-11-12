// app/(tabs)/(create)/trpc-local.tsx
import React, { useState } from "react";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@/server/router";
import Constants from "expo-constants";

export const localTrpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  const env =
    (Constants?.expoConfig as any)?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_APP_URL ||
    "https://socialpro-fnvo.onrender.com";
  return env.replace(/\/$/, "");
}

export function LocalTRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() =>
    localTrpc.createClient({
      links: [httpBatchLink({ url: `${getBaseUrl()}/trpc` })],
    })
  );

  return (
    <localTrpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </localTrpc.Provider>
  );
}

// expo-router wants a default export since this file sits under app/
// keep it as a no-op route component
export default function TrpcLocalRoute() {
  return null;
}
