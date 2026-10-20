import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  authMethod?: string;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const session = await authenticateRequest(opts.req.headers);
    ctx.user = session.user;
    ctx.authMethod = session.authMethod;
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
