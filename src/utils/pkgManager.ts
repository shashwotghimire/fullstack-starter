import { spawn } from "node:child_process";

async function runCommand(dir: string, command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: dir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

export async function runInstall(dir: string): Promise<void> {
  await runCommand(dir, "bun", ["install"]);
}

export async function initGit(dir: string): Promise<void> {
  await runCommand(dir, "git", ["init"]);
  await runCommand(dir, "git", ["add", "."]);
  await runCommand(dir, "git", ["commit", "-m", "chore: initial commit from create-pern-app"]);
}

export async function runDbSetup(serverDir: string, scripts: string[]): Promise<void> {
  for (const script of scripts) {
    await runCommand(serverDir, "bun", ["run", script]);
  }
}

export async function startDockerCompose(dir: string): Promise<void> {
  await runCommand(dir, "docker", ["compose", "up", "-d"]);
}
