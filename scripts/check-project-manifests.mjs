import { access, readdir } from "node:fs/promises";
import path from "node:path";

const requiredFiles = [
  "README.md",
  ".env.example",
  "docs/architecture.md",
  "client/package.json",
  "server/package.json",
];

const alternativeFiles = [["server/knexfile.js", "server/knexfile.ts"]];

const entries = await readdir(process.cwd(), { withFileTypes: true });
const projects = entries
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

let hasMissingFiles = false;

for (const project of projects) {
  for (const requiredFile of requiredFiles) {
    const filePath = path.join(process.cwd(), project, requiredFile);

    try {
      await access(filePath);
    } catch {
      hasMissingFiles = true;
      console.error(`${project}: missing ${requiredFile}`);
    }
  }

  for (const choices of alternativeFiles) {
    let found = false;

    for (const choice of choices) {
      try {
        await access(path.join(process.cwd(), project, choice));
        found = true;
        break;
      } catch {
        // Keep looking for another accepted filename.
      }
    }

    if (!found) {
      hasMissingFiles = true;
      console.error(`${project}: missing one of ${choices.join(", ")}`);
    }
  }
}

if (projects.length !== 20) {
  hasMissingFiles = true;
  console.error(`Expected 20 project folders, found ${projects.length}.`);
}

if (hasMissingFiles) {
  process.exitCode = 1;
} else {
  console.log(`All ${projects.length} project manifests are present.`);
}
