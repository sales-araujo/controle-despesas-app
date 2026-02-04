import {
  createCategory,
  createExpense,
  deleteExpense,
  getExpenses,
  getExpensesByCategory,
  getExpensesByGroupId,
  updateExpense,
} from "../../../server/db";
import { badRequest, jsonResponse, readJsonBody, serverError } from "../_utils";

const DEFAULT_USER_ID = 1;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const categoryIdParam = url.searchParams.get("categoryId");
    const groupIdParam = url.searchParams.get("groupId");

    if (groupIdParam) {
      const expenses = await getExpensesByGroupId(DEFAULT_USER_ID, groupIdParam);
      return jsonResponse(200, expenses);
    }

    if (!year || !month) {
      const { status, data } = badRequest("Ano e mês são obrigatórios");
      return jsonResponse(status, data);
    }

    if (categoryIdParam) {
      const expenses = await getExpensesByCategory(
        DEFAULT_USER_ID,
        year,
        month,
        Number(categoryIdParam)
      );
      return jsonResponse(200, expenses);
    }

    const expenses = await getExpenses(DEFAULT_USER_ID, year, month);
    return jsonResponse(200, expenses);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body) {
      const { status, data } = badRequest("Payload inválido");
      return jsonResponse(status, data);
    }

    let categoryId = body.categoryId ? Number(body.categoryId) : null;
    if (!categoryId && body.categoryName) {
      const created = await createCategory({
        userId: DEFAULT_USER_ID,
        name: String(body.categoryName).trim(),
        icon: "receipt",
        color: "#6366f1",
      });
      categoryId = created.id;
    }

    if (!categoryId || !body.year || !body.month || !body.type || !body.amount) {
      const { status, data } = badRequest("Dados obrigatórios ausentes");
      return jsonResponse(status, data);
    }

    const created = await createExpense({
      userId: DEFAULT_USER_ID,
      categoryId,
      groupId: body.groupId ?? null,
      paid: body.paid ?? false,
      year: Number(body.year),
      month: Number(body.month),
      type: body.type,
      description: body.description ?? "",
      amount: String(body.amount),
    });
    return jsonResponse(201, created);
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body || !body.id) {
      const { status, data } = badRequest("ID é obrigatório");
      return jsonResponse(status, data);
    }

    const id = Number(body.id);
    const updateData: Record<string, unknown> = {};

    if (body.categoryId !== undefined) updateData.categoryId = Number(body.categoryId);
    if (body.groupId !== undefined) updateData.groupId = body.groupId;
    if (body.paid !== undefined) updateData.paid = Boolean(body.paid);
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = String(body.amount);

    await updateExpense(id, DEFAULT_USER_ID, updateData);
    return jsonResponse(200, { success: true });
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      const { status, data } = badRequest("ID é obrigatório");
      return jsonResponse(status, data);
    }

    await deleteExpense(Number(idParam), DEFAULT_USER_ID);
    return jsonResponse(200, { success: true });
  } catch (error) {
    const { status, data } = serverError(error);
    return jsonResponse(status, data);
  }
}
