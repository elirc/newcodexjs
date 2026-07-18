# Upskill Curriculum

Project: **Contact Book / Address Manager** (`02-contact-book`)

This curriculum turns this project into a training lab for full-stack JavaScript roles. It is for juniors who want to become mid-level, mid-level engineers learning ownership, and senior engineers practicing architecture critique.

## Repo Identity

Contact Book / Address Manager is a self-contained React, Express, Knex, PostgreSQL learning app. The main learning surface is contacts, tags, search, pagination, CSV workflows. The browser entry lives at `client/src/App.jsx:125`; the API starts around `server/src/app.js:1`; persistence is introduced in `server/db/migrations/202607030201_create_contacts_tags.js:7`; seed data begins at `server/db/seeds/001_contacts.js:21`. The codebase uses a deliberate layered shape: UI calls API services, API routes call controllers, controllers delegate to services, services call models, and models own Knex queries.

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

- Anchors use `path:line` references, for example `server/src/services/contactService.js:10`.
- Fake code is always labeled as illustrative.
- Drills include self-grading so learners can judge progress without needing another AI prompt.
- Verification notes list commands, inspected files, and uncertainty.

## Senior Mindset

A junior asks, "How do I make it work?" A mid-level engineer asks, "Is this the right pattern for this codebase?" A senior asks, "What does this commit us to, who pays the cost, and how do we reduce risk?" Use this project to practice moving from implementation toward judgment.
