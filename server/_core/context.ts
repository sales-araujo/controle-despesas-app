export type TrpcContext = {
  req: unknown;
  res: unknown;
  user: {
    id: number;
    name: string;
    role: "user";
  };
};

export async function createContext(
  opts: { req: unknown; res: unknown }
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: {
      id: 1,
      name: "Acesso Livre",
      role: "user",
    },
  };
}
