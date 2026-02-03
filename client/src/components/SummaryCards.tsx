import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingDown, 
  PiggyBank, 
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock
} from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  balance: number;
  paidTotal: number;
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function SummaryCards({
  totalIncome,
  fixedExpenses,
  variableExpenses,
  balance,
  paidTotal,
  pendingTotal,
  paidCount,
  pendingCount,
  isLoading,
}: SummaryCardsProps) {
  const totalExpenses = fixedExpenses + variableExpenses;
  const balancePercentage = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const isPositive = balance >= 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Renda Total */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Renda Total</span>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">Receita do mês</p>
        </CardContent>
      </Card>

      {/* Despesas Parceladas */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Despesas Parceladas</span>
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(fixedExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalExpenses > 0 ? `${((fixedExpenses / totalExpenses) * 100).toFixed(0)}% do total` : "Sem despesas"}
          </p>
        </CardContent>
      </Card>

      {/* Despesas Rotativas */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Despesas Rotativas</span>
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(variableExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalExpenses > 0 ? `${((variableExpenses / totalExpenses) * 100).toFixed(0)}% do total` : "Sem despesas"}
          </p>
        </CardContent>
      </Card>

      {/* Saldo Livre */}
      <Card className={`border-0 shadow-sm ${isPositive ? 'bg-gradient-to-br from-card to-green-500/5' : 'bg-gradient-to-br from-card to-destructive/5'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Saldo Livre</span>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
              {isPositive ? (
                <PiggyBank className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalIncome > 0 ? `${balancePercentage.toFixed(0)}% da renda` : "Defina sua renda"}
          </p>
        </CardContent>
      </Card>

      {/* Pago */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Pago</span>
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(paidTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {paidCount} item{paidCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Pendente */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Pendente Pagamento</span>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(pendingTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} item{pendingCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
