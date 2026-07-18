import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("courses").del();
  await knex("schools").del();

  const [org] = await knex("schools").insert({ name: "Demo school" }).returning("*");
  const records = await knex("courses").insert([
  {
    "title": "Full-Stack Foundations",
    "status": "published",
    "priority": "featured",
    "owner": "Instructor Ada",
    "metadata": {
      "lessons": 18,
      "level": "intermediate"
    }
  },
  {
    "title": "SQL For Product Engineers",
    "status": "draft",
    "priority": "high",
    "owner": "Instructor Grace",
    "metadata": {
      "lessons": 12,
      "level": "mid"
    }
  },
  {
    "title": "React State Patterns",
    "status": "published",
    "priority": "medium",
    "owner": "Instructor Linus",
    "metadata": {
      "lessons": 9,
      "level": "junior"
    }
  }
].map((record) => ({
    ...record,
    school_id: org.id
  }))).returning("*");

  await knex("activity_events").insert(records.map((record) => ({
    course_id: record.id,
    event_type: "seeded",
    message: `Created demo record: ${record.title}`,
    payload: { status: record.status, priority: record.priority }
  })));
}
