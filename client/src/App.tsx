import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PeriodProvider } from "./contexts/PeriodContext";
import Home from "./pages/Home";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/income" component={Income} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/reports" component={Reports} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <PeriodProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PeriodProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
