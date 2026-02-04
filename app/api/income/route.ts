import { getMonthlyIncome, upsertMonthlyIncome } from "../../../server/db";
import { badRequest, jsonResponse, readJsonBody, serverError } from "../_utils";

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

    const income = await getMonthlyIncome(DEFAULT_USER_ID, year, month);
    return jsonResponse(200, income);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

async function saveIncome(request: Request) {
  const body = await readJsonBody(request);
  if (!body || !body.year || !body.month || body.amount === undefined) {
    const { status, data } = badRequest("Dados obrigatórios ausentes");
    return jsonResponse(status, data);
  }

  const saved = await upsertMonthlyIncome({
    userId: DEFAULT_USER_ID,
    year: Number(body.year),
    month: Number(body.month),
    amount: String(body.amount),
    description: body.description ?? null,
  });
  return jsonResponse(200, saved);
}

export async function POST(request: Request) {
  try {
    return await saveIncome(request);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

export async function PUT(request: Request) {
  try {
    return await saveIncome(request);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}
