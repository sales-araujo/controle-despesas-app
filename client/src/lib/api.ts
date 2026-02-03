const API_BASE = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...(init ?? {}),
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export type Category = {
  id: number;
  name: string;
  color: string | null;
};

export type ExpenseItem = {
  id: number;
  categoryId: number;
  type: "fixed" | "variable";
  description: string;
  amount: string;
  createdAt: string;
  paid?: boolean;
  year?: number;
  month?: number;
  groupId?: string | null;
};

export type MonthlyIncome = {
  id: number;
  year: number;
  month: number;
  amount: string;
  description: string | null;
};

export type Summary = {
  year: number;
  month: number;
  totalIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalExpenses: number;
  balance: number;
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string | null;
    categoryColor: string | null;
    total: number;
    count: number;
    percentage: number;
  }>;
  expensesCount: number;
};

export type DashboardPayload = {
  summary: Summary;
  expenses: ExpenseItem[];
  categories: Category[];
};

export function getCategories() {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(payload: { name: string; icon?: string; color?: string }) {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listExpenses(params: {
  year: number;
  month: number;
  categoryId?: number;
}) {
  const search = new URLSearchParams();
  search.set("year", String(params.year));
  search.set("month", String(params.month));
  if (params.categoryId !== undefined) {
    search.set("categoryId", String(params.categoryId));
  }
  return apiFetch<ExpenseItem[]>(`/expenses?${search.toString()}`);
}

export function listExpensesByGroup(groupId: string) {
  const search = new URLSearchParams();
  search.set("groupId", groupId);
  return apiFetch<ExpenseItem[]>(`/expenses?${search.toString()}`);
}

export function createExpense(payload: {
  categoryId?: number;
  categoryName?: string;
  groupId?: string | null;
  paid?: boolean;
  year: number;
  month: number;
  type: "fixed" | "variable";
  description?: string;
  amount: string;
}) {
  return apiFetch<ExpenseItem>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpense(payload: {
  id: number;
  categoryId?: number;
  groupId?: string | null;
  paid?: boolean;
  type?: "fixed" | "variable";
  description?: string;
  amount?: string;
}) {
  return apiFetch<{ success: true }>("/expenses", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: number) {
  const search = new URLSearchParams();
  search.set("id", String(id));
  return apiFetch<{ success: true }>(`/expenses?${search.toString()}`, {
    method: "DELETE",
  });
}

export function bulkUpdateExpensesPaid(payload: { ids: number[]; paid: boolean }) {
  return apiFetch<{ success: true; updated: number }>("/expenses-bulk", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getIncome(params: { year: number; month: number }) {
  const search = new URLSearchParams();
  search.set("year", String(params.year));
  search.set("month", String(params.month));
  return apiFetch<MonthlyIncome | null>(`/income?${search.toString()}`);
}

export function upsertIncome(payload: {
  year: number;
  month: number;
  amount: string;
  description?: string;
}) {
  return apiFetch<MonthlyIncome>("/income", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getSummary(params: { year: number; month: number }) {
  const search = new URLSearchParams();
  search.set("year", String(params.year));
  search.set("month", String(params.month));
  return apiFetch<Summary>(`/summary?${search.toString()}`);
}

export function getDashboard(params: { year: number; month: number }) {
  const search = new URLSearchParams();
  search.set("year", String(params.year));
  search.set("month", String(params.month));
  return apiFetch<DashboardPayload>(`/dashboard?${search.toString()}`);
}
