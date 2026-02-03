import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyInput(value: string | number): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const raw = String(value);
  const parsed = parseCurrencyInput(raw);
  if (Number.isNaN(parsed)) return "";
  return parsed.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyInput(value: string): number {
  if (!value) return NaN;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(normalized);
}

export function formatCurrencyFromDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const numberValue = Number(digits) / 100;
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
