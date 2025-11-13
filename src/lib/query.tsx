import React, { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let _client: QueryClient | null = null;
export function getQueryClient() {
  if (!_client) _client = new QueryClient();
  return _client;
}

export function ReactQueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
