# FABLE Guide — Poll / Survey Builder

**Project 11: schema-driven software.** Until now, your apps knew their data shapes at
compile time — a task has a title, a recipe has steps. A survey builder's core object
is **a form defined by the user at runtime**: questions of different types, options,
ordering, and a public-facing renderer that draws UI from that definition. This
"data that describes structure" pattern is the same one behind form builders, CMS page
builders, and workflow designers — it's a genuinely mid-level modeling problem.

This is also the first project with a dedicated **validators layer**: Zod schemas in
`server/src/validators/` applied by `middleware/validate.ts`, and even the env config
(`config/env.ts`) is Zod-parsed. What you *built* in Project 6's Lab 1, you now get to
*read* as an established pattern.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Nested aggregate modeling | survey → questions → options tables | Editing a tree of rows: create/update/delete/reorder children without orphaning anything. |
| Zod validators as a layer | `validators/surveyValidators.ts` + `middleware/validate.ts` | Validation declared once, applied at the route edge — compare with Project 1's hand-rolled service checks. |
| Public vs. builder API split | public survey rendering + response submission with access codes | Two audiences, one database: the owner edits; anonymous respondents see a *published projection*. |
| Response aggregation | results endpoints: counts per option, rating averages, matrix totals | Counts shaped for charts; here computed in JavaScript over all answer rows, a good candidate for a SQL `GROUP BY` refactor. |
| Deep copy | `POST /api/surveys/:id/duplicate` | Cloning an aggregate: new ids everywhere, relationships preserved. Sneaky-hard. |
| Demo auth header | `x-demo-user-id` (falls back to `DEMO_USER_ID`) | A deliberate stub. Know exactly what it fakes so you know what real auth (Project 5) would restore. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + Zod.
API on **:4111** (see `server/src/config/env.ts`), client on :5173.

## 2. Run it (10 minutes)

```bash
# create the DB named in the project-root .env.example's DATABASE_URL, then:
cd 11-survey-builder/server && cp ../.env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 11-survey-builder/client && npm install && npm run dev
```

```bash
curl "http://localhost:4111/api/surveys" -H "x-demo-user-id: 1"
# duplicate a seeded survey and diff the two JSON payloads — every id must differ:
curl -X POST "http://localhost:4111/api/surveys/1/duplicate" -H "x-demo-user-id: 1"
```

Click through all four client pages before reading code: `SurveysPage` (list),
`SurveyBuilderPage` (edit the tree), `PublicSurveyPage` (respond), `SurveyResultsPage`
(aggregates). Each page maps to one slice of the API.

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/config/env.ts` | `z.coerce.number().default(4111)` — even env vars go through a schema. Startup fails loudly on bad config instead of at first request. |
| 2 | `server/src/validators/surveyValidators.ts` | The runtime shape of a survey definition. Question types, option rules, reorder payloads. This file *is* the product spec. |
| 3 | `server/src/middleware/validate.ts` | The generic bridge: schema in, 400 with the *first* Zod issue's message out (not the full issue list). Compare with what you built in Project 6 Lab 1. |
| 4 | `server/src/services/surveyService.ts` | The tree logic: how question/option edits are applied, how reordering works, what happens to responses when a question is deleted, and how `duplicate` walks the aggregate. The status rules too — what may change once a survey is `active`? |
| 5 | `server/src/models/surveyModel.ts` | How the tree is fetched (count the queries for one survey), and how answers are aggregated for results. |
| 6 | `client/src/features/surveys/SurveyBuilderPage.tsx` | Editing a nested structure in React state before persisting. Where is the draft state — one big object, or per-question? |
| 7 | `client/src/features/surveys/PublicSurveyPage.tsx` | Rendering UI *from data*: a switch over question types. Adding a question type touches validator + builder + renderer + results — trace that seam. |

## 4. The challenge ladder

### Level 1 — Junior
1. **Trace the existing "required question" flag** end-to-end: it already exists
   (`is_required` in the migration, `questionSchema`, and the blank-answer check in
   `buildAnswerRows`). Find each layer, then add the missing piece: client-side
   enforcement on the public page before submit. Classic every-layer exercise on a
   nested model.
2. **Break the validator on purpose:** POST a survey with an unknown question type and
   an option on a text question. Read the 400 bodies — could a frontend dev fix their
   payload from the message alone? If not, improve the error mapping.

### Level 2 — Mid
3. **Add a new question type** (e.g., `email`; note `number` already exists and stores
   `{min, max}` in `config` but the server does not enforce them, so enforcing them is
   a good warm-up). List every file you
   touched, in order. That list is the cost of schema-driven design — compare it
   against the alternative (a hardcoded form per survey) and note what you got in
   exchange.
4. **Reordering integrity:** questions have positions. What happens if the client sends
   a reorder payload with duplicate or missing positions? Make the service normalize
   or reject, and write the test. (You met fractional indexing in Project 8 — decide
   whether it's warranted here; probably not, say why.)
5. **Response-vs-definition drift:** a survey is `active` with 50 responses; the owner
   deletes a question. What should results show? Implement your answer (soft-delete
   the question? snapshot definitions per response?) and document the trade-off — this
   is the survey-builder version of the "cache vs. ledger" question from Project 10.

### Level 3 — Senior
6. **Replace the demo-auth header with real auth** by porting Project 5's JWT stack.
   Write down first: every place `x-demo-user-id` is read, and which routes must stay
   public (respondent-facing) vs. authenticated (builder). The exercise is the
   *inventory*, not the JWT code.
7. **Design memo (1 page): rows vs. JSONB.** Questions/options live in normalized
   tables here. Argue the alternative: the whole definition as a `jsonb` document with
   responses referencing question keys. Cover: validation, migrations when the shape
   evolves, aggregation SQL, partial updates, and which one you'd pick for a startup
   vs. a form platform with plugins.

## 5. Questions you should be able to answer afterward

- What does `validateBody(schema)` centralize that per-service checks scatter — and what *can't* it check (cross-row rules like "position must be unique within this survey")?
- Why does duplication need to remap child foreign keys, and what's the naive bug (children of the copy pointing at the original)?
- `getResults` currently loads every answer row and counts in JavaScript (`surveyModel.listAnswers` + `surveyService.getResults`). When would you move that into SQL `GROUP BY`, and what would the multi-choice count use instead of splitting `answer_text`?
- What exactly does the access code protect, and what doesn't it protect (replay, sharing)?
- Where is the single source of truth for "what question types exist"? Is it truly single?

## 6. Common traps

- **Deleting a parent without children** (survey without questions, question without options/answers) — check the FK `onDelete` behavior in the migration before assuming.
- **Trusting client-sent positions** without normalizing — two questions at position 2 renders differently everywhere.
- **Validating the builder payload but not the response payload** — respondents are the *less* trusted audience.
- **The demo-auth header is not auth:** anyone can send `x-demo-user-id: 2`. Fine for a lab; catastrophic muscle memory if you forget it's a stub.

Next: Project 12 (`12-chat-polling`) — "real-time" chat with nothing but HTTP:
cursors, polling, and presence.
