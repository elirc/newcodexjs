# Upskill Curriculum

Project: **Blog Platform** (`07-blog-platform`)

This curriculum turns this project into a training lab for full-stack JavaScript roles. It is for juniors who want to become mid-level, mid-level engineers learning ownership, and senior engineers practicing architecture critique.

## Repo Identity

Blog Platform is a self-contained React, Express, Knex, PostgreSQL learning app. The main learning surface is posts, nested comments, rich text, RSS, sanitization. The browser entry lives at `client/src/App.tsx:17`; the API starts around `server/src/app.ts:2`; persistence is introduced in `server/db/migrations/001_init.ts:4`; seed data begins at `server/db/seeds/001_seed.ts:5`. The codebase uses a deliberate layered shape: UI calls API services, API routes call controllers, controllers delegate to services, services call models, and models own Knex queries.

## How To Use This

| Timeline | Path |
| --- | --- |
| One weekend | Read `00-fast-track.md`, trace one flow, make one tiny UI or validation change. |
| Two weeks | Work through cartography, stack mastery, and two code-reading drills. |
| Eight weeks | Add tests, complete good-first tickets, and write one mid-level design note. |
| Ongoing | Use contribution and career docs for PR practice, review practice, and interview prep. |

## Recommended Path

- Brand-new junior: start with `00-fast-track.md`, then `01-codebase-cartography/02-file-reading-order.md`.
- Junior with stack familiarity: trace `01-codebase-cartography/05-key-flows.md`, then do annotation drills.
- Mid-level engineer: focus on `03-architecture-and-patterns`, `05-quality-engineering`, and mid-level tickets.
- Senior reviewer: start with `03-architecture-and-patterns/06-architecture-critique.md` and `08-reference/risk-register.md`.

## Conventions

- Anchors use `path:line` references, for example `server/src/services/service.ts:5`.
- Fake code is always labeled as illustrative.
- Drills include self-grading so learners can judge progress without needing another AI prompt.
- Verification notes list commands, inspected files, and uncertainty.

## Senior Mindset

A junior asks, "How do I make it work?" A mid-level engineer asks, "Is this the right pattern for this codebase?" A senior asks, "What does this commit us to, who pays the cost, and how do we reduce risk?" Use this project to practice moving from implementation toward judgment.
