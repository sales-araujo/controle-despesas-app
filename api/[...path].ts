import healthHandler from "./health";
import categoriesHandler from "./categories";
import expensesHandler from "./expenses";
import expensesBulkHandler from "./expenses-bulk";
import incomeHandler from "./income";
import summaryHandler from "./summary";
import dashboardHandler from "./dashboard";

const handlers: Record<string, (req: any, res: any) => unknown> = {
  health: healthHandler,
  categories: categoriesHandler,
  expenses: expensesHandler,
  "expenses-bulk": expensesBulkHandler,
  income: incomeHandler,
  summary: summaryHandler,
  dashboard: dashboardHandler,
};

export default function handler(req: any, res: any) {
  const rawPath = (req?.query?.path ?? []) as string | string[];
  const parts = Array.isArray(rawPath)
    ? rawPath
    : String(rawPath || "").split("/").filter(Boolean);
  const key = parts[0] ?? "";
  const target = handlers[key];

  if (!target) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Rota não encontrada" }));
    return;
  }

  return target(req, res);
}
