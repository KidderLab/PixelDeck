import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, current) => typeof current === "bigint" ? current.toString() : current));
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json();
  return schema.parse(body);
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data: toJsonSafe(data) }, init);
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof z.ZodError ? error.flatten() : error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ ok: false, error: message }, { status });
}
