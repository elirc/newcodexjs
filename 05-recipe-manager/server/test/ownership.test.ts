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
