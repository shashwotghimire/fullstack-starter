const green = "\x1b[32m";
const cyan = "\x1b[36m";
const yellow = "\x1b[33m";
const reset = "\x1b[0m";

export function info(message: string): string {
  return `${cyan}info${reset} ${message}`;
}

export function success(message: string): string {
  return `${green}success${reset} ${message}`;
}

export function warn(message: string): string {
  return `${yellow}warn${reset} ${message}`;
}

type SuccessBoxOptions = {
  includeDockerStart: boolean;
};

export function successBox(projectName: string, options: SuccessBoxOptions): string {
  const dockerStep = options.includeDockerStart ? "  docker compose up -d\n" : "";

  return [
    "✅ Your PERN app is ready!",
    "",
    "Next steps:",
    `  cd ${projectName}`,
    dockerStep.trimEnd(),
    "  cd server && bun run db:migrate",
    "  cd server && bun run dev",
    "  cd client && bun run dev",
  ]
    .filter(Boolean)
    .join("\n");
}
