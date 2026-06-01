import type { FileEntry, ScaffoldOptions } from "../types";

export function generateDockerFiles(options: ScaffoldOptions): FileEntry[] {
  if (!options.docker) {
    return [];
  }

  return [
    {
      path: "docker-compose.yml",
      contents: `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: {{DB_NAME}}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
`,
    },
  ];
}
