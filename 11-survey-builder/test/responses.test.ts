import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  await h
    .db("users")
    .insert({ id: 1, email: "learner@example.com", display_name: "Learner" });
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown) =>
  request(h.origin, "/api" + path, method, body);
async function survey(token: string, extra: object = {}) {
  return (
    await h
      .db("surveys")
      .insert({
        user_id: 1,
        title: token,
        status: "active",
        public_token: token,
        ...extra,
      })
      .returning("*")
  )[0];
}
test("typed choices reject invalid answers without creating a response", async () => {
  const s = await survey("choices");
  const [q] = await h
    .db("questions")
    .insert({
      survey_id: s.id,
      title: "Language",
      question_type: "multi_choice",
      is_required: true,
      sort_order: 1,
    })
    .returning("*");
  await h
    .db("question_options")
    .insert({ question_id: q.id, label: "JavaScript", sort_order: 1 });
  for (const value of [[], ["Unknown"], {}, true])
    assert.equal(
      (
        await api("/public/surveys/choices/responses", "POST", {
          answers: { [q.id]: value },
        })
      ).status,
      400,
    );
  assert.equal(Number((await h.db("responses").count("* as n").first()).n), 0);
  const r = await api("/public/surveys/choices/responses", "POST", {
    answers: { [q.id]: ["JavaScript", "JavaScript"] },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(
    (await h.db("response_answers").first()).selected_option_ids.length,
    1,
  );
});
test("simultaneous respondents cannot exceed the last available slot", async () => {
  const s = await survey("capacity", { max_responses: 1 });
  const results = await Promise.all(
    [1, 2].map(() =>
      api("/public/surveys/capacity/responses", "POST", { answers: {} }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
  assert.equal(
    (await h.db("surveys").where({ id: s.id }).first()).response_count,
    1,
  );
});
test("date windows and closed state reject responses, optional blank rating remains null", async () => {
  await survey("future", { start_date: "2099-01-01" });
  await survey("expired", { end_date: "2000-01-01" });
  await survey("closed", { status: "closed" });
  for (const token of ["future", "expired", "closed"])
    assert.equal(
      (await api(`/public/surveys/${token}/responses`, "POST", { answers: {} }))
        .status,
      400,
    );
  const s = await survey("rating");
  const [q] = await h
    .db("questions")
    .insert({
      survey_id: s.id,
      title: "Score",
      question_type: "rating",
      is_required: false,
      sort_order: 1,
      config: { min: 1, max: 5 },
    })
    .returning("*");
  assert.equal(
    (
      await api("/public/surveys/rating/responses", "POST", {
        answers: { [q.id]: 9 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api("/public/surveys/rating/responses", "POST", {
        answers: { [q.id]: "" },
      })
    ).status,
    201,
  );
  assert.equal(
    (await h.db("response_answers").where({ question_id: q.id }).first())
      .rating_value,
    null,
  );
});

test("an unparseable survey window is rejected at write time", async () => {
  await h.db("users").insert({ id: 2, email: "owner@example.com", display_name: "Owner" }).onConflict("id").ignore();
  const bad = await request(h.origin, "/api/surveys", "POST", {
    title: "Window",
    start_date: "next tuesday",
  }, { "x-user-id": "2" });
  assert.equal(bad.status, 400);
  const good = await request(h.origin, "/api/surveys", "POST", {
    title: "Window",
    start_date: "2099-01-01T00:00:00Z",
  }, { "x-user-id": "2" });
  assert.equal(good.status, 201, JSON.stringify(good.data));
});
