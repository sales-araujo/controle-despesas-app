import { getSupabaseClient } from "./_core/supabase";

type CategoryRow = {
  id: number;
  userId: number;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt?: string;
};

type MonthlyIncomeRow = {
  id: number;
  userId: number;
  year: number;
  month: number;
  amount: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ExpenseRow = {
  id: number;
  userId: number;
  categoryId: number;
  year: number;
  month: number;
  groupId?: string | null;
  paid?: boolean;
  type: "fixed" | "variable";
  description: string;
  amount: string;
  createdAt?: string;
  updatedAt?: string;
};

type ReportRow = {
  id: number;
  userId: number;
  year: number;
  month: number;
  fileUrl: string;
  fileKey: string;
  createdAt?: string;
};

type InsertCategory = Omit<CategoryRow, "id" | "createdAt">;
type InsertMonthlyIncome = Omit<MonthlyIncomeRow, "id" | "createdAt" | "updatedAt">;
type InsertExpense = Omit<ExpenseRow, "id" | "createdAt" | "updatedAt">;
type InsertReport = Omit<ReportRow, "id" | "createdAt">;

function toErrorMessage(message: string, error: unknown) {
  const details = error && typeof error === "object" && "message" in error
    ? String((error as { message: string }).message)
    : String(error ?? "");
  return `${message}${details ? `: ${details}` : ""}`;
}

// ============ CATEGORIES ============

export async function getUserCategories(userId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(toErrorMessage("Failed to list categories", error));
  }

  return (data ?? []) as CategoryRow[];
}

export async function createCategory(data: InsertCategory) {
  const supabase = getSupabaseClient();
  const { data: created, error } = await supabase
    .from("categories")
    .insert(data)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(toErrorMessage("Failed to create category", error));
  }

  return created as CategoryRow;
}

export async function deleteCategory(id: number, userId: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    throw new Error(toErrorMessage("Failed to delete category", error));
  }
}

// ============ MONTHLY INCOME ============

export async function getMonthlyIncome(userId: number, year: number, month: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_income")
    .select("*")
    .eq("userId", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new Error(toErrorMessage("Failed to get monthly income", error));
  }

  return (data ?? null) as MonthlyIncomeRow | null;
}

export async function upsertMonthlyIncome(data: InsertMonthlyIncome) {
  const supabase = getSupabaseClient();
  const existing = await getMonthlyIncome(data.userId, data.year, data.month);

  if (existing) {
    const { data: updated, error } = await supabase
      .from("monthly_income")
      .update({ amount: data.amount, description: data.description })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new Error(toErrorMessage("Failed to update monthly income", error));
    }

    return updated as MonthlyIncomeRow;
  }

  const { data: created, error } = await supabase
    .from("monthly_income")
    .insert(data)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(toErrorMessage("Failed to create monthly income", error));
  }

  return created as MonthlyIncomeRow;
}

// ============ EXPENSES ============

export async function getExpenses(userId: number, year: number, month: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("userId", userId)
    .eq("year", year)
    .eq("month", month)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(toErrorMessage("Failed to list expenses", error));
  }

  return (data ?? []) as ExpenseRow[];
}

export async function getExpensesByGroupId(userId: number, groupId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("userId", userId)
    .eq("groupId", groupId)
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (error) {
    throw new Error(toErrorMessage("Failed to list expenses by group", error));
  }

  return (data ?? []) as ExpenseRow[];
}

export async function getExpensesByCategory(
  userId: number,
  year: number,
  month: number,
  categoryId: number
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("userId", userId)
    .eq("year", year)
    .eq("month", month)
    .eq("categoryId", categoryId)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(toErrorMessage("Failed to list expenses by category", error));
  }

  return (data ?? []) as ExpenseRow[];
}

export async function createExpense(data: InsertExpense) {
  const supabase = getSupabaseClient();
  const { data: created, error } = await supabase
    .from("expenses")
    .insert(data)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(toErrorMessage("Failed to create expense", error));
  }

  return created as ExpenseRow;
}

export async function updateExpense(
  id: number,
  userId: number,
  data: Partial<InsertExpense>
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("expenses")
    .update(data)
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    throw new Error(toErrorMessage("Failed to update expense", error));
  }
}

export async function deleteExpense(id: number, userId: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    throw new Error(toErrorMessage("Failed to delete expense", error));
  }
}

// ============ REPORTS ============

export async function getUserReports(userId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("userId", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    throw new Error(toErrorMessage("Failed to list reports", error));
  }

  return (data ?? []) as ReportRow[];
}

export async function getReport(userId: number, year: number, month: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("userId", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new Error(toErrorMessage("Failed to get report", error));
  }

  return (data ?? null) as ReportRow | null;
}

export async function createReport(data: InsertReport) {
  const supabase = getSupabaseClient();
  const { data: created, error } = await supabase
    .from("reports")
    .insert(data)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(toErrorMessage("Failed to create report", error));
  }

  return created as ReportRow;
}

export async function deleteReport(id: number, userId: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    throw new Error(toErrorMessage("Failed to delete report", error));
  }
}

// ============ SUMMARY ============

export async function getMonthlySummary(userId: number, year: number, month: number) {
  const income = await getMonthlyIncome(userId, year, month);
  const expensesList = await getExpenses(userId, year, month);
  const categoriesList = await getUserCategories(userId);

  const totalIncome = income ? parseFloat(income.amount) : 0;

  const fixedExpenses = expensesList
    .filter((e) => e.type === "fixed")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const variableExpenses = expensesList
    .filter((e) => e.type === "variable")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalExpenses = fixedExpenses + variableExpenses;
  const balance = totalIncome - totalExpenses;

  // Agrupar por categoria
  const byCategory = categoriesList
    .map((cat) => {
      const catExpenses = expensesList.filter((e) => e.categoryId === cat.id);
      const total = catExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        total,
        count: catExpenses.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      };
    })
    .filter((c) => c.total > 0);

  return {
    year,
    month,
    totalIncome,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    balance,
    byCategory,
    expensesCount: expensesList.length,
  };
}
