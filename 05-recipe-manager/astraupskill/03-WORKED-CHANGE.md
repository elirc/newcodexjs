# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Ownership checks and transactions already existed, but the update ownership read happened outside the replacement transaction. Input parsing filtered some invalid child records instead of rejecting them and could throw ordinary TypeErrors for malformed values.

**After:** The update locks and checks ownership within the transaction. Nested input is validated without silently dropping invalid children. The model update also scopes by owner. Real HTTP tests deny a signed-in nonowner, and real foreign-key failures prove both create and replacement rollback.

## Predict this example

Alice creates a private Soup recipe with Water and a Boil step. Bob sends a valid token and a body claiming Alice’s user_id: the update must still fail with 403. Alice then attempts a replacement with a nonexistent category id; after failure, the original title, ingredient ids and steps must still exist unchanged.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/services/recipeService.ts](../server/src/services/recipeService.ts) near line 88. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```typescript
export async function updateRecipeForUser(userId: number, recipeId: number, body: Record<string, unknown>) {
  await db.transaction(async (trx) => {
    // Lock and authorize inside the same transaction as the nested replacement.
    const owner = await trx('recipes').where({ id: recipeId }).forUpdate().first();
    if (!owner) throw new NotFoundError('Recipe not found');
    if (owner.user_id !== userId) throw new ForbiddenError('Only the owner can edit this recipe');
    const input = parseRecipeInput(body);
    await saveRecipeGraph(trx, userId, input, recipeId);
  });
  return getRecipe(recipeId, userId);
}

/** Deletes a recipe after confirming ownership. */
```

## Second excerpt: `parseRecipeInput`, three helpers and one worked input each

`parseRecipeInput` (`server/src/services/recipeService.ts:17`) is the densest new code in the project. It is three tiny helpers applied to a nested body:

```typescript
  function text(value: unknown, field: string, limit: number, required = false): string | undefined {
    if (value == null && !required) return undefined;
    if (typeof value !== 'string' || value.trim().length > limit || (required && !value.trim()))
      throw new ValidationError(`${field} must be ${required ? 'non-empty ' : ''}text, at most ${limit} characters`);
    return value.trim();
  }
  function positive(value: unknown, field: string): number | undefined {
    if (value == null || value === '') return undefined;
    if ((typeof value !== 'number' && typeof value !== 'string') || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647)
      throw new ValidationError(`${field} must be a positive integer`);
    return Number(value);
  }
  function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Ingredients and steps must be objects');
```

- `text(value, field, limit, required)`: `undefined`/`null` is allowed unless required; anything else must be a string within `limit` after trimming. Worked input: `text("  Soup ", "Title", 255, true)` -> `"Soup"`; `text("", "Title", 255, true)` -> throws `Title must be non-empty text, at most 255 characters`; `text(undefined, "Description", 100000)` -> `undefined`.
- `positive(value, field)`: blank means absent; otherwise a safe positive integer, also accepted as a numeric string. Worked input: `positive("4", "Servings")` -> `4`; `positive(0, "Servings")` -> throws; `positive(2.5, "Prep time")` -> throws (not an integer).
- `object(value)`: an ingredient or step must be a plain object. Worked input: `object("Water")` -> throws `Ingredients and steps must be objects`; that is the third test's `TypeError`-prevention case.

Then the function applies bounds to the arrays (1-100 ingredients, 1-200 steps), validates `difficulty` and `isPublic`, de-duplicates `categoryIds` through `positive`, and only then builds the typed `RecipeInput`. Nothing has touched the database yet; a rejected body costs zero writes.

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Being logged in is not permission to edit every record. The trusted caller identity comes from the verified token, while the ownership fact comes from the stored recipe; neither should come from a body field supplied by the caller. A row lock keeps the authorization read and replacement coordinated with competing writes. It does not provide an automatic user-facing merge strategy: two authorized sequential updates can still replace one another unless a version policy is added. Runtime validation is required even with TypeScript because an HTTP body is untyped external data. Silently removing blank ingredients can turn an apparently complete request into an empty recipe, so each nested element is rejected with a domain error instead. The rollback test intentionally fails late, after parent/child writes have begun, using a foreign-key constraint. An early validation-only test would not prove transaction atomicity.

## Three variations to work through

**Normal variation — two owner updates at once.** As Alice, send two `PUT /api/recipes/:id` with different titles in a `Promise.all`. Predict: both 200, and the stored title is whichever transaction committed last. The `SELECT ... FOR UPDATE` in `updateRecipeForUser` serializes the two writes (no torn nested replacement) but it does *not* tell the loser that it overwrote a newer edit; that is what the version column in the worked example below adds.

**Invalid variation — a valid token for a deleted account.** Delete Bob's user row directly in the test schema, then call `GET /api/recipes/:id` with Bob's still-valid JWT. Predict which layer notices (the auth middleware's user lookup, or the ownership check) and the status code; then read `authService.ts` to confirm.

**Boundary variation — a duplicated category id.** Create a recipe with `categoryIds: [1, 1]`. Predict that `parseRecipeInput` de-duplicates to `[1]` before the junction insert, so no unique violation occurs; then send `[1, 0]` and predict the message from `positive`.

## Executable examples

These are the actual regression tests in [server/test/ownership.test.ts](../server/test/ownership.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import harness from "./database.cjs";
harness.configure();
const { db } = await import("../src/config/db.js");
const service = await import("../src/services/recipeService.js");
const migration = await import("../db/migrations/001_initial_schema.js");
const appModule = await import("../src/app.js");
let cleanup: () => Promise<void>, api: any, alice: any, bob: any;
const input = {
  title: "Soup",
  ingredients: [{ name: "Water", quantity: "1", unit: "cup" }],
  steps: [{ instruction: "Boil" }],
  isPublic: false,
};
before(async () => {
  cleanup = await harness.prepare(db, migration.up);
  [alice, bob] = await db("users")
    .insert([
      {
        username: "alice",
        email: "alice@example.com",
        password_hash: "test-only",
      },
      { username: "bob", email: "bob@example.com", password_hash: "test-only" },
    ])
    .returning("*");
  api = await harness.listen(appModule.createApp());
});
after(async () => {
  if (api) await api.close();
  if (cleanup) await cleanup();
});
const token = (user: any) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_ACCESS_SECRET!,
  );
test("authenticated nonowner cannot edit/delete or read a private recipe, even with forged ownership in the body", async () => {
  const recipe = await service.createRecipeForUser(alice.id, input);
  const result = await api.request(
    "PUT",
    `/api/recipes/${recipe.id}`,
    { ...input, title: "Stolen", user_id: alice.id },
    token(bob),
  );
  assert.equal(result.status, 403);
  assert.equal(
    (await db("recipes").where({ id: recipe.id }).first()).title,
    "Soup",
  );
  assert.equal(
    (
      await api.request(
        "DELETE",
        `/api/recipes/${recipe.id}`,
        undefined,
        token(bob),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api.request(
        "GET",
        `/api/recipes/${recipe.id}`,
        undefined,
        token(bob),
      )
    ).status,
    403,
  );
  assert.equal(
    (await api.request("PUT", `/api/recipes/${recipe.id}`, input)).status,
    401,
  );
  assert.equal(
    (
      await api.request(
        "PUT",
        `/api/recipes/${recipe.id}`,
        { ...input, title: "My soup" },
        token(alice),
      )
    ).status,
    200,
  );
});
test("failed nested replacement rolls back the parent and all original children", async () => {
  const recipe = await service.createRecipeForUser(alice.id, input);
  const before = await service.getRecipe(recipe.id, alice.id);
  await assert.rejects(() =>
    service.updateRecipeForUser(alice.id, recipe.id, {
      ...input,
      title: "Should roll back",
      ingredients: [{ name: "Salt" }],
      categoryIds: [2147483647],
    }),
  );
  const after = await service.getRecipe(recipe.id, alice.id);
  assert.equal(after.title, before.title);
  assert.deepEqual(after.ingredients, before.ingredients);
  assert.deepEqual(after.steps, before.steps);
  const count = Number((await db("recipes").count("* as n").first())!.n);
  await assert.rejects(() =>
    service.createRecipeForUser(alice.id, {
      ...input,
      categoryIds: [2147483647],
    }),
  );
  assert.equal(Number((await db("recipes").count("* as n").first())!.n), count);
});
test("malformed nested payloads are validation errors, not silent empty recipes or TypeErrors", () => {
  for (const change of [
    { title: " " },
    { difficulty: ["easy"] },
    { ingredients: [null] },
    { ingredients: [{ name: " " }] },
    { steps: [{}] },
    { servings: -1 },
    { isPublic: "false" },
    { categoryIds: [0] },
  ])
    assert.throws(
      () => service.parseRecipeInput({ ...input, ...change }),
      (error: any) => error.code === "VALIDATION_ERROR",
    );
});

test("a recipe created without isPublic is private: a non-owner cannot read it", async () => {
  const { isPublic: _omitted, ...withoutFlag } = input;
  const recipe = await service.createRecipeForUser(alice.id, withoutFlag as any);
  assert.equal((await db("recipes").where({ id: recipe.id }).first()).is_public, false);
  assert.equal(
    (await api.request("GET", `/api/recipes/${recipe.id}`, undefined, token(bob))).status,
    403,
  );
  const shared = await service.createRecipeForUser(alice.id, { ...withoutFlag, isPublic: true } as any);
  assert.equal(
    (await api.request("GET", `/api/recipes/${shared.id}`, undefined, token(bob))).status,
    200,
  );
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
