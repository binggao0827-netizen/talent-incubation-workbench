import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import AccountsList from "./pages/AccountsList";
import AccountDetail from "./pages/AccountDetail";
import ScriptsList from "./pages/ScriptsList";
import ScriptDetail from "./pages/ScriptDetail";
import ReviewsList from "./pages/ReviewsList";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path={"/"} component={Home} />

      {/* Dashboard routes - wrapped in DashboardLayout */}
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>

      {/* Accounts routes */}
      <Route path={"/accounts"}>
        {() => (
          <DashboardLayout>
            <AccountsList />
          </DashboardLayout>
        )}
      </Route>

      <Route path={"/accounts/:id"}>
        {({ id }) => (
          <DashboardLayout>
            <AccountDetail accountId={id} />
          </DashboardLayout>
        )}
      </Route>

      {/* Scripts routes */}
      <Route path={"/scripts"}>
        {() => (
          <DashboardLayout>
            <ScriptsList />
          </DashboardLayout>
        )}
      </Route>

      <Route path={"/scripts/:id"}>
        {({ id }) => (
          <DashboardLayout>
            <ScriptDetail scriptId={id} />
          </DashboardLayout>
        )}
      </Route>

      {/* Reviews routes */}
      <Route path={"/reviews"}>
        {() => (
          <DashboardLayout>
            <ReviewsList />
          </DashboardLayout>
        )}
      </Route>

      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
