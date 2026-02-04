import { getMonthlySummary } from "../../../server/db";
import { badRequest, jsonResponse, serverError } from "../_utils";

const DEFAULT_USER_ID = 1;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    if (!year || !month) {
      const { status, data } = badRequest("Ano e mês são obrigatórios");
      return jsonResponse(status, data);
    }

    const summary = await getMonthlySummary(DEFAULT_USER_ID, year, month);
    return jsonResponse(200, summary);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}
