import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { usePeriod } from "@/contexts/PeriodContext";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { 
  FileText, 
  Loader2, 
  FileDown,
  CheckCircle,
  Share2
} from "lucide-react";

type ReportExpense = {
  id: number;
  categoryId: number;
  description: string;
  amount: string;
  createdAt: string;
  type: "fixed" | "variable";
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeCategoryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function generateMaePDFContent(
  expenses: ReportExpense[],
  year: number,
  month: number
): string {
  const monthName = MONTH_NAMES[month - 1];
  const totalMae = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const html = `
    <style id="report-pdf-style">
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .report-root { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a2e; padding: 40px; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
      .header h1 { font-size: 24px; color: #10b981; margin-bottom: 5px; }
      .header p { color: #666; font-size: 14px; }
      .summary { background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; }
      .summary h2 { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; }
      .summary p { font-size: 32px; font-weight: bold; color: #10b981; }
      .section { margin-bottom: 25px; }
      .section h2 { font-size: 16px; color: #1a1a2e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
      .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
      .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #111; background: transparent; }
      .type-fixed { background: transparent; color: #111; }
      .type-variable { background: transparent; color: #111; }
    </style>
    <div class="report-root">
      <div class="header">
        <h1>Relatório - Pagamentos</h1>
        <p>${monthName} de ${year}</p>
      </div>

      <div class="summary">
        <h2>Total</h2>
        <p>${formatCurrency(totalMae)}</p>
      </div>

      <div class="section">
        <h2>Despesas (${expenses.length} itens)</h2>
        <table>
          <tr>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Data de Criação</th>
            <th>Valor</th>
          </tr>
          ${expenses.map((exp: ReportExpense) => `
          <tr>
            <td>${exp.description || "-"}</td>
            <td><span class="type-badge ${exp.type === 'fixed' ? 'type-fixed' : 'type-variable'}">${exp.type === 'fixed' ? 'Parcelada' : 'Rotativa'}</span></td>
            <td>${new Date(exp.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${formatCurrency(parseFloat(exp.amount))}</td>
          </tr>
          `).join('')}
        </table>
      </div>

      <div class="footer">
        <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <p>Controle de Despesas</p>
      </div>
    </div>
  `;

  return html;
}

async function downloadPdfFromHtml(html: string, filename: string) {
  const container = document.createElement("div");
  container.id = "report-pdf-root";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 1.5,
    backgroundColor: "#ffffff",
    useCORS: true,
    onclone: (doc) => {
      const root = doc.getElementById("report-pdf-root");
      if (!root) return;
      doc.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
        if (!root.contains(el)) {
          el.remove();
        }
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
  document.body.removeChild(container);
}

async function buildPdfBlob(html: string) {
  const container = document.createElement("div");
  container.id = "report-pdf-root";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 1.5,
    backgroundColor: "#ffffff",
    useCORS: true,
    onclone: (doc) => {
      const root = doc.getElementById("report-pdf-root");
      if (!root) return;
      doc.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
        if (!root.contains(el)) {
          el.remove();
        }
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  document.body.removeChild(container);
  const pdfBlob = pdf.output("blob");
  return pdfBlob;
}

export default function Reports() {
  const { year, month, monthName } = usePeriod();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: expenses } = trpc.expenses.list.useQuery({ year, month });
  const { data: categories } = trpc.categories.list.useQuery();

  // Find all "Mãe" categories (handle duplicates/accents)
  const maeCategoryIds = new Set(
    (categories ?? [])
      .filter((cat: { id: number; name: string }) => normalizeCategoryName(cat.name) === "mae")
      .map((cat: { id: number }) => cat.id)
  );

  // Filter expenses for "Mãe" category IDs
  const maeExpenses =
    expenses?.filter((exp: ReportExpense) => maeCategoryIds.has(exp.categoryId)) ?? [];

  const handleGenerateReport = async () => {
    if (!maeExpenses || maeExpenses.length === 0) {
      toast.error("Nenhuma despesa encontrada para a categoria 'Mãe' neste período");
      return;
    }

    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const htmlContent = generateMaePDFContent(maeExpenses, year, month);
      await downloadPdfFromHtml(
        htmlContent,
        `Relatório - Pagamentos ${MONTH_NAMES[month - 1]} ${year}.pdf`
      );
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareReport = async () => {
    if (!maeExpenses || maeExpenses.length === 0) {
      toast.error("Nenhuma despesa encontrada para a categoria 'Mãe' neste período");
      return;
    }

    try {
      setIsGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const htmlContent = generateMaePDFContent(maeExpenses, year, month);
      const filename = `Relatório - Pagamentos ${MONTH_NAMES[month - 1]} ${year}.pdf`;
      const pdfBlob = await buildPdfBlob(htmlContent);
      const file = new File([pdfBlob], filename, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Relatório - Pagamentos ${MONTH_NAMES[month - 1]} ${year}`,
          text: "Relatório de pagamentos",
        });
      } else {
        toast.info("Compartilhamento direto não suportado neste dispositivo. Faça o download e envie pelo WhatsApp.");
        await downloadPdfFromHtml(htmlContent, filename);
      }
    } catch (error: any) {
      console.error("Share failed:", error);
      const message =
        typeof error?.message === "string" && error.message
          ? error.message
          : "Falha ao compartilhar. Verifique se está em HTTPS ou em um celular com suporte.";
      toast.error(`Erro ao compartilhar relatório: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Gere relatórios da categoria "Mãe" para {monthName} de {year}
            </p>
          </div>
          <PeriodSelector />
        </div>

        {/* Generate Report Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório de Mãe - {monthName} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Gere um relatório com todas as despesas da categoria "Mãe" e o valor total.
                </p>
                {maeExpenses.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle className="h-4 w-4" />
                    {maeExpenses.length} despesa{maeExpenses.length !== 1 ? 's' : ''} encontrada{maeExpenses.length !== 1 ? 's' : ''}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma despesa de Mãe neste período
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || maeExpenses.length === 0}
                  className="shrink-0"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Gerar Relatório
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareReport}
                  disabled={isGenerating || maeExpenses.length === 0}
                  className="shrink-0"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mãe Expenses Preview */}
        {maeExpenses.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">
                Despesas de Mãe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {maeExpenses.map((expense: ReportExpense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(parseFloat(expense.amount))}
                      </p>
                      <Badge variant={expense.type === "fixed" ? "outline" : "secondary"} className="text-xs">
                        {expense.type === "fixed" ? "Parcelada" : "Rotativa"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t mt-3 flex justify-between items-center">
                  <p className="font-semibold">Total</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(
                      maeExpenses.reduce(
                        (sum: number, exp: ReportExpense) => sum + parseFloat(exp.amount),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
