import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./trpc-types";

function sanitizeBase(input?: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return null;
  try {
    const u = new URL(raw);
    const cleanedPath = u.pathname.replace(/\/$/, "");
    if (cleanedPath === "/api" || cleanedPath.startsWith("/api/")) {
      u.pathname = "/";
    }
    return `${u.origin}`;
  } catch {
    return raw.replace(/\/$/, "");
  }
}

export const isDemoMode = (): boolean => {
  const raw = (process.env.EXPO_PUBLIC_DEMO_MODE ?? "").toString().trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
};

export const getBaseUrl = (): string => {
  const fromEnv = sanitizeBase(process.env.EXPO_PUBLIC_RORK_API_BASE_URL) || sanitizeBase(process.env.EXPO_PUBLIC_APP_URL);
  if (fromEnv) {
    console.log("[tRPC] Using base URL from env:", fromEnv);
    return fromEnv;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, "");
    console.log("[tRPC] Using base URL from window.location:", origin);
    return origin;
  }
  console.warn("[tRPC] No HTTP base URL configured. Falling back to https://socialpro-fnvo.onrender.com. Set EXPO_PUBLIC_APP_URL for device testing.");
  return "https://socialpro-fnvo.onrender.com";
};

export const trpc = createTRPCReact<AppRouter>();

export const trpcVanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson as any,
      headers() {
        return {
          "Content-Type": "application/json",
        } as Record<string, string>;
      },
      async fetch(url, options) {
        if (isDemoMode()) {
          throw new Error("Demo mode enabled: backend calls are disabled");
        }
        console.log('[tRPC Vanilla Client] Fetching:', url);
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            console.log('[tRPC Vanilla Client] Response not OK (status ' + response.status + ')');
          }
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('[tRPC Vanilla Client] Non-JSON response received');
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
              throw new Error('Cannot connect to server. Please make sure the app is running and EXPO_PUBLIC_APP_URL is configured correctly.');
            }
            throw new Error(`Expected JSON response but got ${contentType}. This usually means the API endpoint is not available.`);
          }
          return response;
        } catch (error: any) {
          console.log('[tRPC Vanilla Client] Backend not available');
          if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check your network connection and make sure EXPO_PUBLIC_APP_URL is set correctly.');
          }
          throw error;
        }
      },
    }),
  ],
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson as any,
      headers() {
        return {
          "Content-Type": "application/json",
        } as Record<string, string>;
      },
      async fetch(url, options) {
        if (isDemoMode()) {
          throw new Error("Demo mode enabled: backend calls are disabled");
        }
        return fetch(url, options);
      },
    }),
  ],
});
