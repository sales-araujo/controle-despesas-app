import DashboardLayout from "@/components/DashboardLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { ExpensesList } from "@/components/ExpensesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { Receipt, TrendingDown, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Expenses() {
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
            <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
            <p className="text-muted-foreground">
              Gerencie suas despesas de {monthName} de {year}
            </p>
          </div>
          <PeriodSelector />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Despesas</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(summary?.totalExpenses ?? 0)}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Parceladas</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(summary?.fixedExpenses ?? 0)}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                  Parceladas
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Rotativas</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(summary?.variableExpenses ?? 0)}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-purple-500">
                  Rotativas
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(paidTotal)}
                    </p>
                  )}
                  {!isLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {paidExpenses.length} item{paidExpenses.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente Pagamento</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(pendingTotal)}
                    </p>
                  )}
                  {!isLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingExpenses.length} item{pendingExpenses.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Breakdown */}
        {summary?.byCategory && summary.byCategory.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.byCategory.map((cat: {
                  categoryId: number;
                  categoryName: string;
                  categoryColor?: string | null;
                  total: number;
                  percentage: number;
                }) => (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.categoryColor ?? "#6366f1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {cat.categoryName}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.categoryColor ?? "#6366f1",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
