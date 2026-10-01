# Codebase map and reading order

[Course index](README.md)

## The problem this project solves

Unknown choices, empty required arrays and invalid ratings could be stored. Opening dates were not checked and the response limit was checked before the transaction. The improvement you will study is: Public reads and submissions enforce opening windows and capacity. Submission locks the survey, validates answers against its questions, writes response/answers and increments the counter in one transaction. Optional blank ratings stay null.

## Data model

A user owns surveys. A survey has questions, each with a question_type and optional choice rows/config. A response belongs to a survey; response_answers reference that response and its questions. response_count is a stored aggregate that must match accepted submissions.

An object is a named collection of fields. An array is an ordered collection of values. An id answers “which record?”; an index answers “where is it in this array right now?” Those questions are different whenever the list can be filtered, reordered or edited. Persisted data is the form that must survive a process/page restart. Derived data can be recomputed from that persisted state.

## Trace one action

1. A React form, button or test sends a concrete operation.
2. The client serializes editable values as an HTTP request.
3. The server validates runtime input and the relevant record relationships.
4. The repository or model reads authoritative state and performs the documented change.
5. The storage boundary commits or rejects the operation.
6. The response or broadcast gives the client its observed result.

```mermaid
flowchart LR
    A[Input or user action] --> B[Validate and normalize]
    B --> C[Compute intended change]
    C --> D[Commit at the state boundary]
    D --> E[Return or render observed state]
    B --> F[Explain invalid input]
    D --> G[Handle a failed write]
```

This diagram names responsibilities, not necessarily separate files. A small browser program can keep them in app.js. A larger API spreads them across controllers, services and models. Follow the actual sequence above rather than assuming every repository has the same architecture.

## Where to read first

1. [server/src/services/surveyService.ts](../server/src/services/surveyService.ts): locate `submitResponse` and read its inputs, branches and return/side effects.
2. [test/responses.test.ts](../test/responses.test.ts): read the scenario names before the helper code.
3. The root [README](../README.md): connect setup and the larger application workflow.

## Source navigation

- [client/src/App.tsx](../client/src/App.tsx)
- [client/src/features/surveys/PublicSurveyPage.tsx](../client/src/features/surveys/PublicSurveyPage.tsx)
- [client/src/features/surveys/SurveyBuilderPage.tsx](../client/src/features/surveys/SurveyBuilderPage.tsx)
- [client/src/features/surveys/SurveyResultsPage.tsx](../client/src/features/surveys/SurveyResultsPage.tsx)
- [client/src/features/surveys/SurveysPage.tsx](../client/src/features/surveys/SurveysPage.tsx)
- [client/src/main.tsx](../client/src/main.tsx)
- [client/src/services/api.ts](../client/src/services/api.ts)
- [client/src/types/survey.ts](../client/src/types/survey.ts)
- [client/src/vite-env.d.ts](../client/src/vite-env.d.ts)
- [client/vite.config.ts](../client/vite.config.ts)
- [server/db/migrations/001_init.ts](../server/db/migrations/001_init.ts)
- [server/db/seeds/001_seed.ts](../server/db/seeds/001_seed.ts)
- [server/knexfile.ts](../server/knexfile.ts)
- [server/scripts/database.ts](../server/scripts/database.ts)
- [server/src/app.ts](../server/src/app.ts)
- [server/src/config/db.ts](../server/src/config/db.ts)
- [server/src/config/env.ts](../server/src/config/env.ts)
- [server/src/controllers/surveyController.ts](../server/src/controllers/surveyController.ts)
- [server/src/index.ts](../server/src/index.ts)
- [server/src/middleware/errors.ts](../server/src/middleware/errors.ts)
- [server/src/middleware/validate.ts](../server/src/middleware/validate.ts)
- [server/src/models/surveyModel.ts](../server/src/models/surveyModel.ts)
- [server/src/routes/surveyRoutes.ts](../server/src/routes/surveyRoutes.ts)
- [server/src/services/surveyService.ts](../server/src/services/surveyService.ts)
- [server/src/utils/http.ts](../server/src/utils/http.ts)
- [server/src/validators/surveyValidators.ts](../server/src/validators/surveyValidators.ts)

## A practical reading technique

At each function boundary, write down the value coming in, the value going out and any side effect. A side effect includes a storage write, SQL query, network request, timer registration or DOM update. If a function calls another function, inspect only that next dependency until you can finish the chosen trace. Return to unrelated files later.

For this lesson, start with: **A required multi-choice question accepts JavaScript once even if it appears twice in the submitted array. Unknown, object and empty answers return 400 and create no response. Two submissions to max_responses=1 produce one 201 and one 400. Future, expired and closed surveys reject submissions.** Mark where the id, time, amount or other important value changes representation. For example, JSON serializes values into text; a date field may be a calendar string; SQL aggregates may return a different type from individual rows. Representation changes are common bug locations.

## Check your understanding

Without reading the solution, answer: Who owns the mutable state? Which input is untrusted? Which function first decides whether the operation is valid? What survives reload or restart? What observation would prove that the operation partially failed? Point to a source file for each answer, rather than describing a generic app from memory.
