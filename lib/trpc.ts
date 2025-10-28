// lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./trpc-types";

/**
 * Entfernt überflüssige Teile aus einer Base-URL:
 * - trailing Slash
 * - versehentlich angehängtes /api oder /api/...
 */
function sanitizeBase(input?: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return null;

  try {
    const u = new URL(raw);
    u.pathname = u.pathname.replace(/\/+$/, ""); // trailing slash entfernen
    if (u.pathname === "/api" || u.pathname.startsWith("/api/")) {
      u.pathname = "";
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

/**
 * Prüft, ob der Demo-Mode aktiv ist.
 */
export const isDemoMode = (): boolean => {
  const raw = (process.env.EXPO_PUBLIC_DEMO_MODE ?? "")
    .toString()
    .trim()
    .toLowerCase();
  return !(raw === "" || raw === "false" || raw === "0" || raw === "no");
};

/**
 * Liefert die Basis-URL der API (ohne doppelten Slash!)
 */
export const getBaseUrl = (): string => {
  const fromEnv = sanitizeBase(process.env.EXPO_PUBLIC_APP_URL);
  if (fromEnv) {
    console.log("[tRPC] Using base URL from env:", fromEnv);
    return fromEnv;
  }

  // Fallback: window.origin im Web oder feste Render-Domain
  if (typeof window !== "undefined" && (window as any).location?.origin) {
    const origin = (window as any).location.origin.replace(/\/+$/, "");
    console.log("[tRPC] Using base URL from window.location:", origin);
    return origin;
  }

  const fallback = "https://socialpro-fnvo.onrender.com";
  console.warn(
    "[tRPC] No HTTP base URL configured. Falling back to",
    fallback,
    "Set EXPO_PUBLIC_APP_URL for device testing."
  );
  return fallback;
};

/**
 * Basis-URL normalisieren (trailing Slashes entfernen)
 */
const BASE_URL = (() => {
  const base = getBaseUrl().replace(/\/+$/, "");
  console.log("[tRPC] Normalized base URL:", base);
  return base;
})();

const TRPC_URL = `${BASE_URL}/api/trpc`;

export const trpc = createTRPCReact<AppRouter>();

/**
 * Voller Client mit Logging & Checks
 */
export const trpcVanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: TRPC_URL,
      transformer: superjson as any,
      headers() {
        return { "Content-Type": "application/json" } as Record<string, string>;
      },
      async fetch(url, options) {
        if (isDemoMode()) {
          throw new Error("Demo mode enabled: backend calls are disabled");
        }

        console.log("[tRPC Vanilla Client] Fetching:", url);

        try {
          const response = await fetch(url, options);

          if (!response.ok) {
            console.log(
              `[tRPC Vanilla Client] Response not OK (status ${response.status})`
            );
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.log("[tRPC Vanilla Client] Non-JSON response received");

            if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
              throw new Error(
                "Cannot connect to server. Please make sure EXPO_PUBLIC_APP_URL points to your API and that the server is running."
              );
            }

            throw new Error(
              `Expected JSON response but got ${contentType ?? "unknown"}. This usually means the API endpoint is not available.`
            );
          }

          return response;
        } catch (error: any) {
          console.log("[tRPC Vanilla Client] Backend not available");
          const msg = String(error?.message ?? "");
          if (msg.includes("Network request failed") || msg.includes("Failed to fetch")) {
            throw new Error(
              "Cannot connect to server. Please check your network connection and make sure EXPO_PUBLIC_APP_URL is set correctly."
            );
          }
          throw error;
        }
      },
    }),
  ],
});

/**
 * Schlanker Client (ohne Logging)
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: TRPC_URL,
      transformer: superjson as any,
      headers() {
        return { "Content-Type": "application/json" } as Record<string, string>;
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
