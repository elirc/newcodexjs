# Web Dev Upskilling Projects

This workspace is organized around the Tier 1 web development curriculum. The original plan (`docs/tier1-execution-plan.md`) called for 15 apps. Projects 16-20 were generated later by `scripts/generate-projects-16-20.mjs`, so there are 20 in total, all for practicing junior-to-mid-level engineering patterns.

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

The root `lint:project1:*` scripts call `lint --if-present`, but no project defines a `lint` script, so they do nothing.

## Learning material in each project (orientation, checked 2026-10-06)

Every project carries up to four layers of AI-generated learning docs. Start with the most specific one:

| Layer | Where | What it is | Projects |
|---|---|---|---|
| Architecture walkthrough | `NN-*/docs/architecture.md` | The request flow, data model and design notes. For 02-20 it was rewritten from each project's code on 2026-10-06, adding verified weak spots and a Goal → **Check** ladder. 01's was already detailed. Read this first. | all 20 |
| Hands-on course | `NN-*/astraupskill/` (9 files) | One worked change, its regression tests, a trace lab and practice with sealed solutions. It is project-specific and uses `ASTRA_TEST_DATABASE_URL` for tests. | all 20 |
| Guide | `NN-*/docs/FABLE.md` | Setup plus a short guided tour. | all 20 |
| Broad curriculum | `NN-*/docs/upskill/` (46 files) | Cartography, patterns, quality, contribution and career chapters. It was generated from **one template** by `scripts/generate-upskill-docs-1-10.mjs`, so the same chapter reads almost identically across projects except for the `path:line` anchors. Its anchors were all in range on 2026-10-06. | 01-10 only |

Tests across the repo are PostgreSQL integration tests. Each project has one or two test files, and the databases they run against must be named `astra_test_*`. Nothing here runs without Postgres.
