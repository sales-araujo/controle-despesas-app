import { updateExpensesPaid } from "../server/db";
import { badRequest, readJsonBody, sendJson, serverError } from "./_utils";

const DEFAULT_USER_ID = 1;

export default async function handler(req: any, res: any) {
  try {
    const method = String(req.method ?? "PUT").toUpperCase();
    if (method !== "PUT") {
      return sendJson(res, 405, { error: "Método não permitido" });
    }

    const body = await readJsonBody(req);
    if (!body || !Array.isArray(body.ids) || typeof body.paid !== "boolean") {
      const { status, data } = badRequest("IDs e status de pagamento são obrigatórios");
      return sendJson(res, status, data);
    }

    const ids = body.ids.map((id: unknown) => Number(id)).filter((id: number) => id > 0);
    if (ids.length === 0) {
      const { status, data } = badRequest("IDs inválidos");
      return sendJson(res, status, data);
    }

    await updateExpensesPaid(DEFAULT_USER_ID, ids, body.paid);
    return sendJson(res, 200, { success: true, updated: ids.length });
  } catch (error) {
    const { status, data } = serverError(error);
    return sendJson(res, status, data);
  }
}
