import { getMonthlyIncome, upsertMonthlyIncome } from "../server/db";
import { badRequest, readJsonBody, sendJson, serverError } from "./_utils";

const DEFAULT_USER_ID = 1;

export default async function handler(req: any, res: any) {
  try {
    const method = String(req.method ?? "GET").toUpperCase();
    const url = new URL(req.url ?? "", "http://localhost");

    if (method === "GET") {
      const year = Number(url.searchParams.get("year"));
      const month = Number(url.searchParams.get("month"));
      if (!year || !month) {
        const { status, data } = badRequest("Ano e mês são obrigatórios");
        return sendJson(res, status, data);
      }
      const income = await getMonthlyIncome(DEFAULT_USER_ID, year, month);
      return sendJson(res, 200, income);
    }

    if (method === "POST" || method === "PUT") {
      const body = await readJsonBody(req);
      if (!body || !body.year || !body.month || body.amount === undefined) {
        const { status, data } = badRequest("Dados obrigatórios ausentes");
        return sendJson(res, status, data);
      }

      const saved = await upsertMonthlyIncome({
        userId: DEFAULT_USER_ID,
        year: Number(body.year),
        month: Number(body.month),
        amount: String(body.amount),
        description: body.description ?? null,
      });
      return sendJson(res, 200, saved);
    }

    return sendJson(res, 405, { error: "Método não permitido" });
  } catch (error) {
    const { status, data } = serverError(error);
    return sendJson(res, status, data);
  }
}
