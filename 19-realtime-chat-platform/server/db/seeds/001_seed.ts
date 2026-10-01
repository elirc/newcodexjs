import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("conversations").del();
  await knex("workspaces").del();

  const [org] = await knex("workspaces")
    .insert({ name: "Demo workspace" })
    .returning("*");
  const records = await knex("conversations")
    .insert(
      [
        {
          title: "Launch War Room",
          status: "active",
          priority: "high",
          owner: "Platform Team",
          metadata: {
            unread: 12,
            mode: "group",
          },
        },
        {
          title: "Design Review",
          status: "active",
          priority: "medium",
          owner: "Design",
          metadata: {
            unread: 3,
            mode: "channel",
          },
        },
        {
          title: "Incident Archive",
          status: "archived",
          priority: "low",
          owner: "Ops",
          metadata: {
            unread: 0,
            mode: "group",
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
      conversation_id: record.id,
      event_type: "seeded",
      message: `Created demo record: ${record.title}`,
      payload: { status: record.status, priority: record.priority },
    })),
  );
}
