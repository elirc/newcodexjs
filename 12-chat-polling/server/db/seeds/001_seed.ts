import type { Knex } from "knex";

/** Seeds users, direct messages, group chats, messages, and reactions. */
export async function seed(knex: Knex): Promise<void> {
  await knex("typing_indicators").del();
  await knex("reactions").del();
  await knex("conversation_members").del();
  await knex("messages").del();
  await knex("conversations").del();
  await knex("users").del();

  const users = await knex("users")
    .insert([
      { username: "ava", email: "ava@example.com", password_hash: "demo", display_name: "Ava Stone", status: "online", last_seen_at: knex.fn.now() },
      { username: "ben", email: "ben@example.com", password_hash: "demo", display_name: "Ben Park", status: "away", last_seen_at: knex.fn.now() },
      { username: "cora", email: "cora@example.com", password_hash: "demo", display_name: "Cora Lee", status: "offline" },
      { username: "diego", email: "diego@example.com", password_hash: "demo", display_name: "Diego Cruz", status: "online", last_seen_at: knex.fn.now() },
      { username: "em", email: "em@example.com", password_hash: "demo", display_name: "Em Rivera", status: "offline" }
    ])
    .returning("*");

  const conversations = await knex("conversations")
    .insert([
      { type: "direct", created_by: users[0].id, last_message_at: knex.fn.now() },
      { type: "direct", created_by: users[0].id, last_message_at: knex.fn.now() },
      { type: "direct", created_by: users[1].id, last_message_at: knex.fn.now() },
      { type: "group", name: "Launch team", created_by: users[0].id, last_message_at: knex.fn.now() },
      { type: "group", name: "Support desk", created_by: users[2].id, last_message_at: knex.fn.now() }
    ])
    .returning("*");

  const memberSets = [
    [users[0], users[1]],
    [users[0], users[2]],
    [users[1], users[3]],
    [users[0], users[1], users[2], users[3]],
    [users[2], users[3], users[4]]
  ];
  for (const [index, members] of memberSets.entries()) {
    await knex("conversation_members").insert(
      members.map((member, memberIndex) => ({
        conversation_id: conversations[index].id,
        user_id: member.id,
        role: memberIndex === 0 ? "admin" : "member"
      }))
    );
  }

  const messageRows: any[] = [];
  for (const [index, conversation] of conversations.entries()) {
    const members = memberSets[index];
    const count = conversation.type === "group" ? 42 : 24;
    for (let messageIndex = 0; messageIndex < count; messageIndex += 1) {
      messageRows.push({
        conversation_id: conversation.id,
        user_id: members[messageIndex % members.length].id,
        content: `Message ${messageIndex + 1} in ${conversation.name ?? `direct chat ${index + 1}`}`,
        created_at: new Date(Date.now() - (count - messageIndex) * 60000),
        updated_at: new Date(Date.now() - (count - messageIndex) * 60000)
      });
    }
  }
  const messages = await knex("messages").insert(messageRows).returning("*");

  await knex("reactions").insert(
    messages.slice(0, 30).map((message, index) => ({
      message_id: message.id,
      user_id: users[index % users.length].id,
      emoji: ["👍", "❤️", "😂"][index % 3]
    }))
  );

  for (const conversation of conversations) {
    const lastMessage = messages.filter((message) => message.conversation_id === conversation.id).at(-1);
    await knex("conversation_members").where({ conversation_id: conversation.id }).update({ last_read_message_id: lastMessage?.id - 3 });
  }
}

