import pg from "pg";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
export async function database() {
  const supplied = process.env.ASTRA_TEST_DATABASE_URL;
  if (!supplied)
    throw new Error(
      "Set ASTRA_TEST_DATABASE_URL to a dedicated astra_test_* database.",
    );
  const url = new URL(supplied);
  if (!url.pathname.slice(1).startsWith("astra_test_"))
    throw new Error("Refusing a non-test database.");
  const schema = "astra_" + randomUUID().replaceAll("-", "");
  const admin = new pg.Client({ connectionString: supplied });
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${schema}"`);
  url.searchParams.set("options", "-c search_path=" + schema + ",public");
  process.env.DATABASE_URL = url.href;
  process.env.NODE_ENV = "test";
  let db: any, server: any;
  try {
    db = (await import("../server/src/config/db.js")).db;
    const directory = fileURLToPath(
      new URL("../server/db/migrations/", import.meta.url),
    );
    const migrations = (await readdir(directory))
      .filter((name) => name.endsWith(".ts"))
      .sort();
    await db.migrate.latest({
      schemaName: schema,
      migrationSource: {
        getMigrations: async () => migrations,
        getMigrationName: (name: string) => name,
        getMigration: async (name: string) =>
          import(pathToFileURL(path.join(directory, name)).href),
      },
    });
    const mod = await import("../server/src/app.js");
    const app = mod.createApp ? mod.createApp() : (mod.app ?? mod.default);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    return {
      admin,
      db,
      schema,
      origin: "http://127.0.0.1:" + server.address().port,
      async close() {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
          server.closeAllConnections();
        });
        await db.destroy();
        await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
        await admin.end();
      },
    };
  } catch (error) {
    if (server) server.close();
    if (db) await db.destroy();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
    throw error;
  }
}
export async function request(
  origin: string,
  path: string,
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
  };
}
