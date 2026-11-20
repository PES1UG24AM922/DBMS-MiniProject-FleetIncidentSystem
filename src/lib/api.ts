import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Wraps a route handler: maps guard responses, validation errors and MySQL errors to clean JSON. */
export function handle(fn: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof Response) return e;
      if (e instanceof ZodError)
        return NextResponse.json({ error: "Validation failed", details: e.flatten().fieldErrors }, { status: 400 });
      if (e?.sqlState) {
        const denied = ["ER_TABLEACCESS_DENIED_ERROR", "ER_PROCACCESS_DENIED_ERROR", "ER_COLUMNACCESS_DENIED_ERROR"];
        const status = e.sqlState === "45000" ? 422 : e.code === "ER_DUP_ENTRY" ? 409 : denied.includes(e.code) ? 403 : 400;
        return NextResponse.json({ error: e.sqlMessage ?? e.message }, { status });
      }
      console.error(e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export const idParam = async (ctx: any) => {
  const n = Number((await ctx.params).id);
  if (!Number.isInteger(n) || n < 1) throw new Response(JSON.stringify({ error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });
  return n;
};
