import { createContext, useContext, useState, ReactNode } from "react";

interface PeriodContextType {
  year: number;
  month: number;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setPeriod: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  monthName: string;
  periodKey: string;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const setPeriod = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const goToPreviousMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = MONTH_NAMES[month - 1];
  const periodKey = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <PeriodContext.Provider
      value={{
        year,
        month,
        setYear,
        setMonth,
        setPeriod,
        goToPreviousMonth,
        goToNextMonth,
        monthName,
        periodKey,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
