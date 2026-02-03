import { getMonthlySummary } from "../server/db";
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

    const summary = await getMonthlySummary(DEFAULT_USER_ID, year, month);
    return sendJson(res, 200, summary);
  } catch (error) {
    const { status, data } = serverError(error);
    return sendJson(res, status, data);
  }
}
