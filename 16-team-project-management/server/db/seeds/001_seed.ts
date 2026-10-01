import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("tasks").del();
  await knex("workspaces").del();

  const [org] = await knex("workspaces")
    .insert({ name: "Demo workspace" })
    .returning("*");
  const records = await knex("tasks")
    .insert(
      [
        {
          title: "Draft roadmap",
          status: "todo",
          priority: "high",
          owner: "Ada",
          metadata: {
            milestone: "Planning",
            estimate: 8,
          },
        },
        {
          title: "Implement activity feed",
          status: "in_progress",
          priority: "medium",
          owner: "Grace",
          metadata: {
            milestone: "MVP",
            estimate: 5,
          },
        },
        {
          title: "Review access roles",
          status: "done",
          priority: "high",
          owner: "Linus",
          metadata: {
            milestone: "Security",
            estimate: 3,
          },
        },
      ].map((record) => ({
        ...record,
        workspace_id: org.id,
      })),
    )
    .returning("*");

  await knex("activity_events").insert(
    records.map((record) => ({
      task_id: record.id,
      event_type: "seeded",
      message: `Created demo record: ${record.title}`,
      payload: { status: record.status, priority: record.priority },
    })),
  );
}
