import DashboardLayout from "@/components/DashboardLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { IncomeForm } from "@/components/IncomeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { usePeriod } from "@/contexts/PeriodContext";
import { TrendingUp, Calendar } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function Income() {
  const { year, monthName } = usePeriod();

  // Fetch income for all months of the current year
  const monthQueries = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    month: m,
    query: trpc.income.get.useQuery({ year, month: m }),
  }));

  const yearlyData = monthQueries.map(({ month, query }) => ({
    month,
    monthName: MONTH_NAMES[month - 1],
    income: query.data ? parseFloat(query.data.amount) : 0,
    isLoading: query.isLoading,
  }));

  const totalYearIncome = yearlyData.reduce((sum, m) => sum + m.income, 0);
  const avgMonthlyIncome = totalYearIncome / 12;
  const monthsWithIncome = yearlyData.filter((m) => m.income > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Renda</h1>
            <p className="text-muted-foreground">
              Gerencie sua renda mensal de {monthName} de {year}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income Form */}
          <IncomeForm />

          {/* Year Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumo Anual {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total do Ano</p>
                  <p className="text-xl font-bold">{formatCurrency(totalYearIncome)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Média Mensal</p>
                  <p className="text-xl font-bold">{formatCurrency(avgMonthlyIncome)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Renda por Mês
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {yearlyData.map((m) => (
                    <div
                      key={m.month}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        m.income > 0
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/30"
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {m.monthName}
                      </p>
                      {m.isLoading ? (
                        <Skeleton className="h-4 w-full mt-1" />
                      ) : (
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            m.income > 0 ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {m.income > 0 ? formatCurrency(m.income).replace("R$", "").trim() : "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {monthsWithIncome} de 12 meses com renda registrada
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
