# Trace lab: authorization and recipe graph replacement

[Course index](README.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

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

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## Separate three identities

The route id identifies a recipe, the verified token identifies its caller, and stored data identifies its owner. A body user_id is caller-supplied data, not proof.

Alice owns recipe 10. Bob signs in and supplies Alice's id in an update body. The server must compare Bob's trusted identity to the stored owner and deny the update. Authentication answers who made the request; authorization answers whether that caller may change this resource.

## Trace the real call path

### Boundary 1 — the recipe form decides what to send

The shipped client has no edit page: `client/src/pages/CreateRecipePage.tsx` builds the same nested body (`ingredients[]`, `steps[]`, `categoryIds[]`, `isPublic`) for create only, and `client/src/services/recipes.ts` has no update function. The `PUT` in this trace is sent directly (curl or the test harness); a forged `user_id` in the body is exactly what the first test sends.

### Boundary 2 — the request leaves the browser

`PUT /api/recipes/:id` with `Authorization: Bearer <access token>` (in the browser, `setAccessToken` in `client/src/services/api.ts` installs that header). The client has no axios interceptor and no `catch` around recipe writes, so a 403 would surface only as a rejected promise; an edit form you build in the exercises must handle it.

### Boundary 3 — authentication, then ownership, then validation

`server/src/middleware/auth.ts` verifies the JWT and attaches the user; the controller calls `recipeService.updateRecipeForUser(userId, id, body)`, which locks the row and checks ownership first, then runs `parseRecipeInput` (line 17) on the raw body (line 94). Anything in the body that is not part of `RecipeInput`, including `user_id`, is dropped here.

### Boundary 4 — ownership is read inside the transaction

`updateRecipeForUser` (`server/src/services/recipeService.ts:88`) opens `db.transaction`, `SELECT ... FOR UPDATE` on the recipe, compares `user_id` with the caller and throws `ForbiddenError` (403) on mismatch, all before any write. Reads of a private recipe go through the same owner check (`is_public` false and not yours -> 403); the new fourth test proves an omitted `isPublic` means private.

### Boundary 5 — the nested replacement commits or rolls back

Still inside the transaction: update the recipe row, delete and re-insert `recipe_ingredients` and `recipe_steps`, replace the category junctions. The second test forces a late failure and shows the parent and all original children survive.

### Boundary 6 — the envelope tells the client what happened

`sendSuccess` returns the recipe with its nested children re-read from the database; `ForbiddenError` -> 403, `ValidationError` -> 400 (`parseRecipeInput` messages), `NotFoundError` -> 404.

## Read ownership inside the transaction

The update locks and checks the stored recipe within the transaction that replaces it. The model write also scopes by owner. A row lock coordinates competing writers during that transaction; it does not merge sequential edits or warn Alice that her browser has stale content. Version checking is a separate extension.

## TypeScript does not validate network JSON

A client can send difficulty as ["easy"], a string instead of an ingredient object, negative duration or blank step text regardless of compile-time interfaces. Runtime parsing checks every nested element. Silently filtering invalid children could store a recipe missing the content the caller thought was accepted.

Find parseRecipeInput through chapter 3 and invent one minimal invalid value per guard. The actual domain errors expose a code; do not assume their JavaScript name was overridden.

## Prove graph consistency

The recipe includes ingredients, steps and category links. A late foreign-key failure after replacing parent/children must restore the entire previous graph. Checking only a failed response would miss partial deletion.

Creation and replacement have different postconditions: failed creation leaves no partial graph; failed replacement preserves the existing graph. Run [ownership.test.ts](../server/test/ownership.test.ts), inspect both fixtures, and explain which assertions detect trusting a spoofed owner and which detect a write outside the transaction.
