import { Activity, Home } from "lucide-react";
import { Link, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { routes } from "./constants";
import HealthPage from "./pages/HealthPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="text-sm font-semibold text-foreground" to={routes.home}>
            {{PROJECT_NAME}}
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to={routes.home}>
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={routes.health}>
                <Activity className="h-4 w-4" />
                Health
              </Link>
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.health} element={<HealthPage />} />
        </Routes>
      </main>
    </div>
  );
}
