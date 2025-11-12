import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";

// Minimaler Ping-Endpoint, den dein Frontend schon anfragt
export const appRouter = router({
  "platforms.getToken": publicProcedure
    .input(z.object({}).optional())
    .query(async () => {
      // TODO: später echte Tokens aus DB/Storage zurückgeben
      return { token: null };
    }),
});

export type AppRouter = typeof appRouter;
