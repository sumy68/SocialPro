// lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./trpc-types";

/**
 * Normalisiert eine Basis-URL:
 * - Muss mit http/https beginnen
 * - Entfernt trailing Slash
 * - Entfernt versehentlich angehängtes /api oder /api/...
 */
function sanitizeBase(input?: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return null;

  try {
    const u = new URL(raw);
    // trailing slash wegräumen
    u.pathname = u.pathname.replace(/\/+$/, "");

    // Falls jemand fälschlich /api in die ENV eingetragen hat, wieder entfernen
    if (u.pathname === "/api" || u.pathname.startsWith("/api/")) {
      u.pathname = "";
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    // Fallback: nur trailing slash kappen
    return raw.replace(/\/+$/, "");
  }
}

/**
 * DEMO-Mode nur aktivieren, wenn es EXPLIZIT gesetzt wurde.
 * Alles andere (leer/0/false/no) => aus.
 */
export const isDemoMode = (): boolean => {
  const raw = (process.env.EXPO_PUBLIC_DEMO_MODE ?? "")
    .toString()
    .trim()
    .toLowerCase();

  if (raw === "" || raw === "false" || raw === "0" || raw === "no") return false;
  return true;
};

/**
 * Ermittelt die Basis-URL:
 * 1) EXPO_PUBLIC_APP_URL (empfohlen)
 * 2) Fallback: deine Render-Domain
 */
export const getBaseUrl = (): string => {
  const fromEnv =
    sanitizeBase(process.env.EXPO_PUBLIC_RORK_API_BASE_URL) ||
    sanitizeBase(process.env.EXPO_PUBLIC_APP_URL);

  if (fromEnv) {
    console.log("[tRPC] Using base URL from env:", fromEnv);
    return fromEnv;
  }

  // window.origin als Fallback nur im Web-Kontext verwenden – schadet in RN nicht.
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

const BASE_URL = getBaseUrl();
const TRPC_URL = `${BASE_URL}/api/trpc`;

export const trpc = createTRPCReact<AppRouter>();

/**
 * Strenger Client mit zusätzlichen Checks/Logs
 */
export const trpcVanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: TRPC_URL,
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
 * Schlanker Client (ohne extra Checks)
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: TRPC_URL,
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
