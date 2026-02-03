import DashboardLayout from "@/components/DashboardLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpensesList } from "@/components/ExpensesList";
import { usePeriod } from "@/contexts/PeriodContext";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { year, month, monthName } = usePeriod();
  
  const { data, isLoading } = trpc.dashboard.get.useQuery({ year, month });
  const summary = data?.summary;
  const expenses = (data?.expenses ?? []) as Array<{ amount: string; paid?: boolean }>;
  const paidExpenses = expenses.filter((e: { paid?: boolean }) => e.paid);
  const pendingExpenses = expenses.filter((e: { paid?: boolean }) => !e.paid);
  const paidTotal = paidExpenses.reduce(
    (sum: number, e: { amount: string }) => sum + parseFloat(e.amount),
    0
  );
  const pendingTotal = pendingExpenses.reduce(
    (sum: number, e: { amount: string }) => sum + parseFloat(e.amount),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral de {monthName} de {year}
            </p>
          </div>
          <PeriodSelector />
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalIncome={summary?.totalIncome ?? 0}
          fixedExpenses={summary?.fixedExpenses ?? 0}
          variableExpenses={summary?.variableExpenses ?? 0}
          balance={summary?.balance ?? 0}
          paidTotal={paidTotal}
          pendingTotal={pendingTotal}
          paidCount={paidExpenses.length}
          pendingCount={pendingExpenses.length}
          isLoading={isLoading}
        />

        {/* Expenses List */}
        <ExpensesList
          expenses={data?.expenses}
          categories={data?.categories}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
