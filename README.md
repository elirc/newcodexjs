# Web Dev Upskilling Projects

This workspace is organized around the Tier 1 web development curriculum: 15 self-contained full-stack apps for building junior-to-mid-level engineering patterns.

All 20 learning projects now live as separate root folders. Each folder is a self-contained full-stack app with a React/Vite client, Express/Knex/PostgreSQL server, `.env.example`, README, and architecture notes.

## Project Layout

```text
01-task-manager/
02-contact-book/
...
20-marketplace-platform/
  client/   # React + Vite frontend
  server/   # Express + Knex + PostgreSQL backend
  docs/     # Architecture walkthroughs and learning notes
docs/
  tier1-execution-plan.md
scripts/
  list-projects.mjs
  check-project-manifests.mjs
  generate-tier1-missing.mjs
```

## Subagent Roles

- Backend worker: owns Project 1 API, database migrations, query/repository layer, and seed data.
- Frontend worker: owns Project 1 React app, task workflows, filters, and styling.
- Learning/docs worker: owns the curriculum execution roadmap plus Project 1 setup and architecture docs.
- Main agent: owns root coordination, integration review, and verification.

## Convenience Commands

After each side has installed dependencies:

```bash
npm --prefix 01-task-manager/server run dev
npm --prefix 01-task-manager/client run dev
```

Use `npm run list:projects` to print the 20 folders and `npm run check:manifests` to verify each project has the expected client/server/docs files.

Each project has its own setup guide in its local `README.md`.
