import { getMonthlySummary, getExpenses, getUserCategories } from "../server/db";
import { badRequest, sendJson, serverError } from "./_utils";

const DEFAULT_USER_ID = 1;

export default async function handler(req: any, res: any) {
  try {
    const method = String(req.method ?? "GET").toUpperCase();
    if (method !== "GET") {
      return sendJson(res, 405, { error: "Método não permitido" });
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    if (!year || !month) {
      const { status, data } = badRequest("Ano e mês são obrigatórios");
      return sendJson(res, status, data);
    }

    const [summary, expenses, categories] = await Promise.all([
      getMonthlySummary(DEFAULT_USER_ID, year, month),
      getExpenses(DEFAULT_USER_ID, year, month),
      getUserCategories(DEFAULT_USER_ID),
    ]);

    return sendJson(res, 200, { summary, expenses, categories });
  } catch (error) {
    const { status, data } = serverError(error);
    return sendJson(res, status, data);
  }
}
