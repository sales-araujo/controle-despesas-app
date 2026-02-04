type JsonResponse = {
  status: number;
  data: unknown;
};

export function jsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
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

export async function readJsonBody(request: Request) {
  if (!request.body) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
