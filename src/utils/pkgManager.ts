export async function runInstall(dir: string): Promise<void> {
  await Bun.$`bun install`.cwd(dir);
}

export async function initGit(dir: string): Promise<void> {
  await Bun.$`git init`.cwd(dir);
  await Bun.$`git add .`.cwd(dir);
  await Bun.$`git commit -m "chore: initial commit from create-pern-app"`.cwd(dir);
}

export async function runDbSetup(serverDir: string, scripts: string[]): Promise<void> {
  for (const script of scripts) {
    await Bun.$`bun run ${script}`.cwd(serverDir);
  }
}

export async function startDockerCompose(dir: string): Promise<void> {
  await Bun.$`docker compose up -d`.cwd(dir);
}
