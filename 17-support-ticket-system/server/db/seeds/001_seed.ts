import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("tickets").del();
  await knex("teams").del();

  const [org] = await knex("teams")
    .insert({ name: "Demo team" })
    .returning("*");
  const records = await knex("tickets")
    .insert(
      [
        {
          title: "Cannot access account",
          status: "open",
          priority: "urgent",
          owner: "Triage",
          metadata: {
            channel: "email",
            slaHours: 4,
          },
        },
        {
          title: "Billing receipt request",
          status: "pending",
          priority: "medium",
          owner: "Maya",
          metadata: {
            channel: "portal",
            slaHours: 24,
          },
        },
        {
          title: "Feature question",
          status: "resolved",
          priority: "low",
          owner: "Noah",
          metadata: {
            channel: "chat",
            slaHours: 48,
          },
        },
      ].map((record) => ({
        ...record,
        team_id: org.id,
      })),
    )
    .returning("*");

  await knex("activity_events").insert(
    records.map((record) => ({
      ticket_id: record.id,
      event_type: "seeded",
      message: `Created demo record: ${record.title}`,
      payload: { status: record.status, priority: record.priority },
    })),
  );
}
