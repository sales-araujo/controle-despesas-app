import DashboardLayout from "@/components/DashboardLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { usePeriod } from "@/contexts/PeriodContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, PieChartIcon, BarChart3 } from "lucide-react";

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm text-primary font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.percentage && (
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.percentage.toFixed(1)}% do total
          </p>
        )}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analysis() {
  const { year, month, monthName } = usePeriod();
  
  const { data: summary, isLoading } = trpc.summary.get.useQuery({ year, month });

  // Fetch data for all months of the year for comparison
  const monthQueries = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    month: m,
    query: trpc.summary.get.useQuery({ year, month: m }),
  }));

  const yearlyData = monthQueries.map(({ month: m, query }) => ({
    month: MONTH_NAMES[m - 1],
    fixas: query.data?.fixedExpenses ?? 0,
    variaveis: query.data?.variableExpenses ?? 0,
    renda: query.data?.totalIncome ?? 0,
  }));

  // Pie chart data
  const pieData = summary?.byCategory?.map((cat) => ({
    name: cat.categoryName,
    value: cat.total,
    percentage: cat.percentage,
    color: cat.categoryColor ?? "#6366f1",
  })) ?? [];

  // Type distribution data
  const typeData = [
    { name: "Parceladas", value: summary?.fixedExpenses ?? 0, color: "#f97316" },
    { name: "Rotativas", value: summary?.variableExpenses ?? 0, color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  const totalExpenses = (summary?.fixedExpenses ?? 0) + (summary?.variableExpenses ?? 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Análise</h1>
            <p className="text-muted-foreground">
              Visualize seus gastos de {monthName} de {year}
            </p>
          </div>
          <PeriodSelector />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Pie Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
              ) : pieData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhuma despesa registrada
                </div>
              )}
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Parceladas vs Rotativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
              ) : typeData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {typeData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">
                          {item.name}: {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhuma despesa registrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparativo Mensal {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground capitalize">{value}</span>
                    )}
                  />
                  <Bar dataKey="fixas" name="Parceladas" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="variaveis" name="Rotativas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Categorias</p>
              <p className="text-xl font-bold">{pieData.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="text-xl font-bold">{summary?.expensesCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Média/Transação</p>
              <p className="text-xl font-bold">
                {summary?.expensesCount && summary.expensesCount > 0
                  ? formatCurrency(totalExpenses / summary.expensesCount)
                  : "R$ 0"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
