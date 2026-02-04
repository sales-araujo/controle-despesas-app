import { createCategory, getUserCategories } from "../../../server/db";
import { badRequest, jsonResponse, readJsonBody, serverError } from "../_utils";

const DEFAULT_USER_ID = 1;

export async function GET() {
  try {
    const categories = await getUserCategories(DEFAULT_USER_ID);
    return jsonResponse(200, categories);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      const { status, data } = badRequest("Nome da categoria é obrigatório");
      return jsonResponse(status, data);
    }

    const created = await createCategory({
      userId: DEFAULT_USER_ID,
      name: body.name.trim(),
      icon: body.icon ?? "receipt",
      color: body.color ?? "#6366f1",
    });
    return jsonResponse(201, created);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}
