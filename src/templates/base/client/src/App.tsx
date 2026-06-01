import { Link, Route, Routes } from "react-router-dom";
import { routes } from "./constants";
import HealthPage from "./pages/HealthPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <>
      <nav>
        <Link to={routes.home}>Home</Link>
        <Link to={routes.health}>Health</Link>
      </nav>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.health} element={<HealthPage />} />
      </Routes>
    </>
  );
}
