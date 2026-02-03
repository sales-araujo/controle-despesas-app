import { createCategory, getUserCategories } from "../server/db";
import { badRequest, readJsonBody, sendJson, serverError } from "./_utils";

const DEFAULT_USER_ID = 1;

export default async function handler(req: any, res: any) {
  try {
    const method = String(req.method ?? "GET").toUpperCase();

    if (method === "GET") {
      const categories = await getUserCategories(DEFAULT_USER_ID);
      return sendJson(res, 200, categories);
    }

    if (method === "POST") {
      const body = await readJsonBody(req);
      if (!body || typeof body.name !== "string" || !body.name.trim()) {
        const { status, data } = badRequest("Nome da categoria é obrigatório");
        return sendJson(res, status, data);
      }

      const created = await createCategory({
        userId: DEFAULT_USER_ID,
        name: body.name.trim(),
        icon: body.icon ?? "receipt",
        color: body.color ?? "#6366f1",
      });
      return sendJson(res, 201, created);
    }

    return sendJson(res, 405, { error: "Método não permitido" });
  } catch (error) {
    const { status, data } = serverError(error);
    return sendJson(res, status, data);
  }
}
