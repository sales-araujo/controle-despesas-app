import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createExpense,
  deleteExpense,
  getCategories,
  listExpensesByGroup,
  updateExpense,
} from "@/lib/api";
import { formatCurrencyFromDigits, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { usePeriod } from "@/contexts/PeriodContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: {
    id: number;
    categoryId: number;
    groupId?: string | null;
    year?: number;
    month?: number;
    type: "fixed" | "variable";
    description: string;
    amount: string;
  } | null;
  onSuccess?: () => void;
}

type CategoryOption = { id: number; name: string };
type GroupedExpense = { id: number; year: number; month: number };

export function ExpenseForm({ open, onOpenChange, expense, onSuccess }: ExpenseFormProps) {
  const { year, month } = usePeriod();
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [type, setType] = useState<"fixed" | "variable">("variable");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [startMonth, setStartMonth] = useState(month);
  const [startYear, setStartYear] = useState(year);
  const [endMonth, setEndMonth] = useState(month);
  const [endYear, setEndYear] = useState(year);
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  const queryClient = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return (categories ?? []).filter((cat: CategoryOption) => {
      const key = cat.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
  });
  const { data: groupedExpenses } = useQuery({
    queryKey: ["expensesByGroup", expense?.groupId],
    queryFn: () => listExpensesByGroup(expense?.groupId ?? ""),
    enabled: Boolean(expense?.groupId),
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
  });
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
  });

  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      toast.success("Despesa atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar despesa: " + error.message);
    },
  });

  useEffect(() => {
    if (expense) {
      setCategoryId(String(expense.categoryId));
      setType(expense.type);
      setDescription(expense.description);
      setAmount(formatCurrencyInput(parseFloat(expense.amount)));
      setUseNewCategory(false);
      setCategoryName("");
      const initialMonth = expense.month ?? month;
      const initialYear = expense.year ?? year;
      setStartMonth(initialMonth);
      setStartYear(initialYear);
      setEndMonth(initialMonth);
      setEndYear(initialYear);
    } else {
      resetForm();
    }
  }, [expense, open]);

  useEffect(() => {
    if (!expense?.groupId || !groupedExpenses || groupedExpenses.length === 0) return;
    const sorted = [...groupedExpenses].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    setStartYear(first.year);
    setStartMonth(first.month);
    setEndYear(last.year);
    setEndMonth(last.month);
  }, [expense?.groupId, groupedExpenses]);

  const resetForm = () => {
    setCategoryId("");
    setCategoryName("");
    setUseNewCategory(false);
    setType("variable");
    setDescription("");
    setAmount("");
    setStartMonth(month);
    setStartYear(year);
    setEndMonth(month);
    setEndYear(year);
  };

  const handleCreateSuccess = () => {
    toast.success("Despesa adicionada com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

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

    if (useNewCategory && !categoryName) {
      toast.error("Digite o nome da categoria");
      return;
    }

    if (!useNewCategory && !categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!amount) {
      toast.error("Preencha o valor");
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Valor inválido");
      return;
    }

    const isFixed = type === "fixed";

    if (expense) {
      if (!isFixed) {
        setIsBulkCreating(true);
        const updateSingle = async () => {
          try {
            if (expense.groupId && groupedExpenses?.length) {
              const others = (groupedExpenses as GroupedExpense[]).filter(
                (e) => e.id !== expense.id
              );
              await Promise.all(
                others.map((e) => deleteMutation.mutateAsync(e.id))
              );
            }

            await updateMutation.mutateAsync({
              id: expense.id,
              categoryId: parseInt(categoryId),
              groupId: undefined,
              type,
              description: description || "",
              amount: parsedAmount.toFixed(2),
            });

            handleCreateSuccess();
          } catch (error: any) {
            toast.error("Erro ao atualizar despesa: " + error.message);
          } finally {
            setIsBulkCreating(false);
          }
        };

        updateSingle();
        return;
      }

      if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
        toast.error("O período 'De' não pode ser depois do 'Até'");
        return;
      }

      const range = buildMonthRange(startYear, startMonth, endYear, endMonth);
      const shouldBulkEdit =
        expense.groupId ||
        range.length > 1 ||
        (expense.year !== undefined &&
          expense.month !== undefined &&
          (expense.year !== startYear || expense.month !== startMonth));

      if (!shouldBulkEdit) {
        updateMutation.mutate({
          id: expense.id,
          categoryId: parseInt(categoryId),
          type,
          description: description || "",
          amount: parsedAmount.toFixed(2),
        });
        return;
      }

      setIsBulkCreating(true);

      const updateSeries = async () => {
        try {
          const finalCategoryId = parseInt(categoryId);
          const finalGroupId = expense.groupId ?? `grp_${crypto.randomUUID()}`;
          const existing = expense.groupId
            ? (groupedExpenses as GroupedExpense[]) ?? []
            : [];
          const existingWithCurrent: GroupedExpense[] = [...existing];
          if (!expense.groupId && expense.year && expense.month) {
            existingWithCurrent.push({
              id: expense.id,
              year: expense.year,
              month: expense.month,
            });
          }
          const existingByKey = new Map(
            existingWithCurrent.map((e) => [`${e.year}-${e.month}`, e])
          );

          const rangeKeys = new Set(range.map((r) => `${r.year}-${r.month}`));
          const tasks: Promise<unknown>[] = [];

          range.forEach(({ year: targetYear, month: targetMonth }) => {
            const key = `${targetYear}-${targetMonth}`;
            const existingExpense = existingByKey.get(key);
            if (existingExpense) {
              tasks.push(
                updateMutation.mutateAsync({
                  id: existingExpense.id,
                  categoryId: finalCategoryId,
                  groupId: finalGroupId,
                  type,
                    description: description || "",
                  amount: parsedAmount.toFixed(2),
                })
              );
            } else {
              tasks.push(
                createMutation.mutateAsync({
                  categoryId: finalCategoryId,
                  groupId: finalGroupId,
                  paid: false,
                  year: targetYear,
                  month: targetMonth,
                  type,
                  description: description || "",
                  amount: parsedAmount.toFixed(2),
                })
              );
            }
          });

          existingWithCurrent.forEach((e) => {
            const key = `${e.year}-${e.month}`;
            if (!rangeKeys.has(key)) {
              tasks.push(deleteMutation.mutateAsync(e.id));
            }
          });

          await Promise.all(tasks);
          handleCreateSuccess();
        } catch (error: any) {
          toast.error("Erro ao atualizar despesa: " + error.message);
        } finally {
          setIsBulkCreating(false);
        }
      };

      updateSeries();
    } else {
      if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
        toast.error("O período 'De' não pode ser depois do 'Até'");
        return;
      }

      const range = buildMonthRange(startYear, startMonth, endYear, endMonth);
      setIsBulkCreating(true);

      const createAll = async () => {
        try {
          let finalCategoryId: number | undefined;
          const finalGroupId = `grp_${crypto.randomUUID()}`;

          if (useNewCategory) {
            const createdCategory = await createCategoryMutation.mutateAsync({
              name: categoryName,
            });
            finalCategoryId = createdCategory.id;
          } else {
            finalCategoryId = parseInt(categoryId);
          }

          const targets = isFixed
            ? range
            : [{ year: startYear, month: startMonth }];

          await Promise.all(
            targets.map(({ year: targetYear, month: targetMonth }) =>
              createMutation.mutateAsync({
                categoryId: finalCategoryId,
                groupId: finalGroupId,
                paid: false,
                year: targetYear,
                month: targetMonth,
                type,
                description: description || "",
                amount: parsedAmount.toFixed(2),
              })
            )
          );

          handleCreateSuccess();
        } catch (error: any) {
          toast.error("Erro ao adicionar despesa: " + error.message);
        } finally {
          setIsBulkCreating(false);
        }
      };

      createAll();
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    isBulkCreating ||
    createCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!expense && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseNewCategory(false)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    !useNewCategory
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setUseNewCategory(true)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    useNewCategory
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Nova
                </button>
              </div>

              {useNewCategory ? (
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Digite o nome da categoria"
                />
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((cat: CategoryOption) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {!expense && type === "fixed" && (
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
          )}

          {!expense && type === "variable" && (
            <div className="space-y-2">
              <Label>Mês/Ano</Label>
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
            </div>
          )}

          {expense && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((cat: CategoryOption) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {expense && type === "fixed" && (
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
          )}

          {expense && type === "variable" && (
            <div className="space-y-2">
              <Label>Mês/Ano</Label>
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
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as "fixed" | "variable")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Parcelada</SelectItem>
                <SelectItem value="variable">Rotativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conta de luz, Almoço..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              value={amount}
                  onChange={(e) => setAmount(formatCurrencyFromDigits(e.target.value))}
              placeholder="0,00"
              type="text"
              inputMode="decimal"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
