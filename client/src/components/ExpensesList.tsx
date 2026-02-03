import { useMemo, useState, useDeferredValue, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteExpense,
  listExpenses,
  updateExpense,
  bulkUpdateExpensesPaid,
  getCategories,
  type Category,
  type ExpenseItem,
} from "@/lib/api";
import { usePeriod } from "@/contexts/PeriodContext";
import { ExpenseForm } from "./ExpenseForm";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Receipt } from "lucide-react";

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

type ExpensesListProps = {
  expenses?: ExpenseItem[];
  categories?: Category[];
  isLoading?: boolean;
};

export function ExpensesList({
  expenses: expensesProp,
  categories: categoriesProp,
  isLoading: isLoadingProp,
}: ExpensesListProps) {
  const { year, month } = usePeriod();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const queryClient = useQueryClient();
  const shouldFetch = !expensesProp || !categoriesProp;
  const { data: expensesData, isLoading: isExpensesLoading } = useQuery({
    queryKey: ["expenses", year, month],
    queryFn: () => listExpenses({ year, month }),
    enabled: shouldFetch,
  });
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: shouldFetch,
  });

  const expenses = expensesProp ?? expensesData;
  const categories = categoriesProp ?? categoriesData;
  const isLoading = isLoadingProp ?? (isExpensesLoading || isCategoriesLoading);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      toast.success("Despesa excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir despesa: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; paid?: boolean }) => updateExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar despesa: " + error.message);
    },
  });

  const bulkPaidMutation = useMutation({
    mutationFn: (payload: { ids: number[]; paid: boolean }) =>
      bulkUpdateExpensesPaid(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar despesas: " + error.message);
    },
  });

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories?.forEach((cat: Category) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return (categories ?? []).filter((cat: Category) => {
      const key = cat.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    return expenses?.filter((expense: ExpenseItem) => {
      const matchesSearch = expense.description
        .toLowerCase()
        .includes(deferredSearchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || expense.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || expense.categoryId === parseInt(categoryFilter);
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [expenses, deferredSearchTerm, typeFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, typeFilter, categoryFilter]);

  const pageSize = 10;
  const totalItems = filteredExpenses?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedExpenses = filteredExpenses?.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const bulkPaidStats = useMemo(() => {
    const bulkItems =
      categoryFilter === "all" ? paginatedExpenses : filteredExpenses;
    const items = (bulkItems ?? []) as ExpenseItem[];
    const paidCount = items.filter((expense: ExpenseItem) => expense.paid).length;
    const total = items.length;
    return {
      total,
      paidCount,
      allPaid: total > 0 && paidCount === total,
      somePaid: paidCount > 0 && paidCount < total,
    };
  }, [categoryFilter, filteredExpenses, paginatedExpenses]);

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleBulkPaidChange = (checked: boolean) => {
    const bulkItems =
      categoryFilter === "all" ? paginatedExpenses : filteredExpenses;
    const targets = (bulkItems ?? []).filter(
      (expense: ExpenseItem) => Boolean(expense.paid) !== checked
    );

    if (targets.length === 0) return;
    bulkPaidMutation.mutate({
      ids: targets.map((expense: ExpenseItem) => expense.id),
      paid: checked,
    });
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Despesas do Mês
            </CardTitle>
            <Button onClick={() => { setEditingExpense(null); setFormOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar despesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="fixed">Parceladas</SelectItem>
                <SelectItem value="variable">Rotativas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueCategories.map((cat: Category) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedExpenses && paginatedExpenses.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[60px]">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            bulkPaidStats.allPaid
                              ? true
                              : bulkPaidStats.somePaid
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={(checked) =>
                            handleBulkPaidChange(Boolean(checked))
                          }
                          disabled={
                            isLoading ||
                            bulkPaidStats.total === 0 ||
                            bulkPaidMutation.isPending
                          }
                        />
                        <span className="text-xs text-muted-foreground">Pago</span>
                      </div>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense: ExpenseItem) => {
                    const category = categoryMap.get(expense.categoryId);
                    return (
                      <TableRow
                        key={expense.id}
                        className={expense.paid ? "bg-green-50" : undefined}
                      >
                        <TableCell className="w-[60px]">
                          <Checkbox
                            checked={Boolean(expense.paid)}
                            onCheckedChange={(checked) =>
                              updateMutation.mutate({
                                id: expense.id,
                                paid: Boolean(checked),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {category?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: category?.color ? `${category.color}20` : undefined,
                              color: category?.color ?? undefined,
                            }}
                          >
                            {category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={expense.type === "fixed" ? "outline" : "secondary"}>
                            {expense.type === "fixed" ? "Parcelada" : "Rotativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {new Date(expense.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setEditingExpense(null); setFormOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeira despesa
              </Button>
            </div>
          )}

          {totalItems > pageSize && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                Página {safePage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A despesa será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
