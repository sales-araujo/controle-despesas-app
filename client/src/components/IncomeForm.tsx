import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIncome, upsertIncome } from "@/lib/api";
import { formatCurrencyFromDigits, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { usePeriod } from "@/contexts/PeriodContext";
import { toast } from "sonner";
import { Wallet, Loader2, Check } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function IncomeForm() {
  const { year, month, monthName } = usePeriod();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [startMonth, setStartMonth] = useState(month);
  const [startYear, setStartYear] = useState(year);
  const [endMonth, setEndMonth] = useState(month);
  const [endYear, setEndYear] = useState(year);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const queryClient = useQueryClient();
  const { data: income, isLoading } = useQuery({
    queryKey: ["income", year, month],
    queryFn: () => getIncome({ year, month }),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertIncome,
  });

  useEffect(() => {
    if (income) {
      setAmount(formatCurrencyInput(parseFloat(income.amount)));
      setDescription(income.description ?? "");
    } else {
      setAmount("");
      setDescription("");
    }
    setIsEditing(false);
    setStartMonth(month);
    setStartYear(year);
    setEndMonth(month);
    setEndYear(year);
  }, [income, year, month]);

  const buildMonthRange = (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ) => {
    const result: Array<{ year: number; month: number }> = [];
    let currentYear = fromYear;
    let currentMonth = fromMonth;

    while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMonth)) {
      result.push({ year: currentYear, month: currentMonth });
      currentMonth += 1;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear += 1;
      }
    }

    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseCurrencyInput(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Valor inválido");
      return;
    }

    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
      toast.error("O período 'De' não pode ser depois do 'Até'");
      return;
    }

    setIsBulkUpdating(true);
    const range = buildMonthRange(startYear, startMonth, endYear, endMonth);

    const saveAll = async () => {
      try {
        await Promise.all(
          range.map(({ year: targetYear, month: targetMonth }) =>
            upsertMutation.mutateAsync({
              year: targetYear,
              month: targetMonth,
              amount: parsedAmount.toFixed(2),
              description: description || undefined,
            })
          )
        );
        toast.success("Renda atualizada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["income"] });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        setIsEditing(false);
      } catch (error: any) {
        toast.error("Erro ao atualizar renda: " + error.message);
      } finally {
        setIsBulkUpdating(false);
      }
    };

    saveAll();
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentIncome = income ? parseFloat(income.amount) : 0;

  const isSaving = upsertMutation.isPending || isBulkUpdating;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Renda de {monthName} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing && income ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Renda atual</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(currentIncome)}
              </p>
              {income.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {income.description}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsEditing(true)}
            >
              Editar Renda
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-amount">Valor da Renda (R$)</Label>
              <Input
                id="income-amount"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyFromDigits(e.target.value))}
                placeholder="0,00"
                type="text"
                inputMode="decimal"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Período (De / Até)</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={String(startMonth)}
                    onValueChange={(v) => setStartMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {new Date(2024, m - 1, 1).toLocaleString("pt-BR", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(startYear)}
                    onValueChange={(v) => setStartYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const y = new Date().getFullYear() - 5 + i;
                        return (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(endMonth)}
                    onValueChange={(v) => setEndMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {new Date(2024, m - 1, 1).toLocaleString("pt-BR", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(endYear)}
                    onValueChange={(v) => setEndYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const y = new Date().getFullYear() - 5 + i;
                        return (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="income-description">Descrição (opcional)</Label>
              <Input
                id="income-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Salário, Freelance..."
              />
            </div>

            <div className="flex gap-3">
              {income && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
