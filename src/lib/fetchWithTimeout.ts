// Kleiner fetch-Wrapper mit hartem Timeout.
// React Native fetch hat kein Default-Timeout — ohne das hängt die UI bei
// langsamen/kalten Backends (z. B. Render Free-Tier Cold Start) unendlich.
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err: any) {
    // AbortController-Abbruch in einen klaren Timeout-Fehler übersetzen.
    if (err?.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
