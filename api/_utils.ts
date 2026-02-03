type JsonResponse = {
  status: number;
  data: unknown;
};

export function sendJson(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function badRequest(message: string): JsonResponse {
  return { status: 400, data: { error: message } };
}

export function serverError(error: unknown): JsonResponse {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : String(error ?? "Erro inesperado");
  return { status: 500, data: { error: message } };
}

export async function readJsonBody(req: any) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return null;
  const text = Buffer.concat(chunks).toString("utf-8");
  return text ? JSON.parse(text) : null;
}
