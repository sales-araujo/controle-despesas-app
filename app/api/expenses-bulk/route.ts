import { updateExpensesPaid } from "../../../server/db";
import { badRequest, jsonResponse, readJsonBody, serverError } from "../_utils";

const DEFAULT_USER_ID = 1;

export async function PUT(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body || !Array.isArray(body.ids) || typeof body.paid !== "boolean") {
      const { status, data } = badRequest("IDs e status de pagamento são obrigatórios");
      return jsonResponse(status, data);
    }

    const ids = body.ids.map((id: unknown) => Number(id)).filter((id: number) => id > 0);
    if (ids.length === 0) {
      const { status, data } = badRequest("IDs inválidos");
      return jsonResponse(status, data);
    }

    await updateExpensesPaid(DEFAULT_USER_ID, ids, body.paid);
    return jsonResponse(200, { success: true, updated: ids.length });
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}
