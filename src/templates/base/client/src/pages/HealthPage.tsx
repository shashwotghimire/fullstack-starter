import { useHealthCheck } from "../hooks/useHealthCheck";

export default function HealthPage() {
  const { data, isLoading, isError } = useHealthCheck();
  const connected = data?.status === "ok" && !isLoading && !isError;

  return <p>{connected ? "API connected ✅" : "API unavailable ❌"}</p>;
}
