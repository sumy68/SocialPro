import { useCallback, useRef } from "react";
import type { Platform } from "@/constants/types";

type PublishArgs = {
  caption: string;
  mediaUrls?: string[];
  mediaType?: "image" | "video";
  contentType: "post" | "reel";
};

export function usePublishPost() {
  const publishing = useRef(false);
  const isPublishing = () => publishing.current;

  const publishToMultiplePlatforms = useCallback(
    async (platforms: Platform[], _input: PublishArgs) => {
      // TODO: später via tRPC anbinden. Jetzt: sofort "erfolgreich" simulieren.
      return {
        successfulPlatforms: platforms,
        failedPlatforms: [] as Platform[],
        errors: {} as Record<string, string>,
      };
    },
    []
  );

  return { publishToMultiplePlatforms, isPublishing };
}
