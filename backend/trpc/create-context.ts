// trpc/create-context.ts
import { initTRPC } from '@trpc/server';

export type Context = {};

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
