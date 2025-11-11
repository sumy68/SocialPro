import { useEffect, useState } from "react";

type Perf = {
  followers: number;
  growth: number;   // % vs. Vorwoche
  reach: number;
  posts: number;
  comments: number;
  likes: number;
  shares: number;
};
type Payload = Record<"instagram"|"tiktok"|"linkedin"|"youtube", Perf>;

export default function useAnalytics(userId: string) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const base = process.env.EXPO_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${base}/api/analytics/summary?userId=${encodeURIComponent(userId || "demo")}`);
        if (!res.ok) throw new Error("Network error " + res.status);
        const json = await res.json();
        if (active) setData(json as Payload);
      } catch (e:any) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false };
  }, [base, userId]);

  return { data, isLoading: loading, isError: !!error, error };
}
