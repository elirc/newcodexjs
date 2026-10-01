import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("cards").del();
  await knex("cards").insert(
    [
      {
        title: "Map board schema",
        body: "Boards own lists, lists own cards.",
        lane: "todo",
        status: "todo",
        tags: ["schema"],
      },
      {
        title: "Fractional ordering",
        body: "Store position values between neighbors.",
        lane: "doing",
        status: "in_progress",
        tags: ["ordering"],
      },
      {
        title: "Share board link",
        body: "Generate read-only sharing tokens.",
        lane: "done",
        status: "done",
        tags: ["sharing"],
      },
    ].map((record) => ({ ...record, tags: JSON.stringify(record.tags) })),
  );
}
