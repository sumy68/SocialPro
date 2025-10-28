// trpc/client.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/types';
import { apiBase } from '../utils/apiBase';

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${apiBase}/api/trpc` })],
});
