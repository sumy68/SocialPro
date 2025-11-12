import { useCallback, useState } from "react";
import type { Platform } from "@/constants/types";

type PublishArgs = {
  text?: string;
  caption?: string;
  imageUri?: string | null;
  scheduledAt?: Date | null;
  platform?: Platform;      // single
  platforms?: Platform[];   // multi
  contentType?: "image"|"video"|"text";
};

async function mockPost(p: Platform, args: PublishArgs) {
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true, platform: p, id: `mock_${p}_${Date.now()}`, args };
}

export function usePublishPost() {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(async (args: PublishArgs) => {
    setPublishing(true); setError(null);
    try {
      const p = args.platform ?? "instagram";
      return await mockPost(p, args);
    } catch (e:any) {
      setError(e?.message ?? "Unknown error");
      return { ok:false };
    } finally { setPublishing(false); }
  }, []);

  const publishToMultiplePlatforms = useCallback(async (args: PublishArgs) => {
    setPublishing(true); setError(null);
    try {
      const list = (args.platforms && args.platforms.length) ? args.platforms
                  : (args.platform ? [args.platform] : ["instagram"]);
      const results = [];
      const successfulPlatforms: Platform[] = [];
      const failedPlatforms: Platform[] = [];
      const errors: Record<string,string> = {};
      for (const p of list) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const res:any = await mockPost(p, args);
          results.push(res);
          if (res?.ok) successfulPlatforms.push(p);
          else { failedPlatforms.push(p); errors[p] = "Unknown failure"; }
        } catch (e:any) { failedPlatforms.push(p); errors[p] = e?.message ?? "Error"; }
      }
      return { ok: failedPlatforms.length === 0, results, successfulPlatforms, failedPlatforms, errors };
    } catch (e:any) {
      setError(e?.message ?? "Unknown error");
      return { ok:false, results:[], successfulPlatforms:[], failedPlatforms:[], errors:{} as Record<string,string> };
    } finally { setPublishing(false); }
  }, []);

  // create/index.tsx ruft isPublishing() auf → wir liefern callable
  const isPublishing = () => publishing;

  return { publish, publishToMultiplePlatforms, isPublishing, error };
}
