import { readdir } from "node:fs/promises";

const entries = await readdir(process.cwd(), { withFileTypes: true });
const projects = entries
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const project of projects) {
  console.log(project);
}
