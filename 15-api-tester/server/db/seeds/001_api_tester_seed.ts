import type { Knex } from "knex";

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** Seeds users, collections, folders, requests, environments, variables, and history. */
export async function seed(knex: Knex): Promise<void> {
  await knex("request_history").del();
  await knex("saved_requests").del();
  await knex("folders").del();
  await knex("collections").del();
  await knex("env_variables").del();
  await knex("environments").del();
  await knex("users").del();

  const users = await knex("users")
    .insert([
      { name: "Nia Tester", email: "nia@example.com" },
      { name: "Eli Engineer", email: "eli@example.com" },
    ])
    .returning("*");

  const environments = await knex("environments")
    .insert([
      { user_id: users[0].id, name: "Development", is_active: true },
      { user_id: users[0].id, name: "Staging", is_active: false },
      { user_id: users[0].id, name: "Production", is_active: false },
    ])
    .returning("*");

  await knex("env_variables").insert(
    environments.flatMap((environment, environmentIndex) => [
      {
        environment_id: environment.id,
        key: "baseUrl",
        value:
          environmentIndex === 0
            ? "https://jsonplaceholder.typicode.com"
            : `https://api-${environment.name.toLowerCase()}.example.com`,
        sort_order: 0,
      },
      {
        environment_id: environment.id,
        key: "apiKey",
        value: `key-${environment.name.toLowerCase()}-123`,
        is_secret: true,
        sort_order: 1,
      },
      {
        environment_id: environment.id,
        key: "userId",
        value: "1",
        sort_order: 2,
      },
    ]),
  );

  const collections = await knex("collections")
    .insert([
      {
        user_id: users[0].id,
        name: "JSONPlaceholder API",
        description: "Public example API for safe experimentation.",
        sort_order: 1,
      },
      {
        user_id: users[0].id,
        name: "Auth Endpoints",
        description: "Login and token examples.",
        sort_order: 2,
      },
      {
        user_id: users[0].id,
        name: "E-Commerce API",
        description: "Catalog, cart, and orders.",
        sort_order: 3,
      },
    ])
    .returning("*");

  const folders = await knex("folders")
    .insert([
      { collection_id: collections[0].id, name: "Posts", sort_order: 1 },
      { collection_id: collections[0].id, name: "Users", sort_order: 2 },
      { collection_id: collections[1].id, name: "Sessions", sort_order: 1 },
      { collection_id: collections[2].id, name: "Catalog", sort_order: 1 },
      { collection_id: collections[2].id, name: "Orders", sort_order: 2 },
    ])
    .returning("*");

  const savedRequests = Array.from({ length: 20 }, (_, index) => {
    const collection = collections[index % collections.length];
    const folder = folders.find((item) => item.collection_id === collection.id);
    const method = methods[index % methods.length];
    return {
      user_id: users[0].id,
      collection_id: collection.id,
      folder_id: folder?.id ?? null,
      name: `${method} example ${index + 1}`,
      method,
      url:
        index % 2 === 0 ? "{{baseUrl}}/posts/{{userId}}" : "{{baseUrl}}/users",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
        { key: "X-API-Key", value: "{{apiKey}}", enabled: index % 3 === 0 },
      ],
      params: [{ key: "_limit", value: "10", enabled: method === "GET" }],
      body_type: method === "GET" || method === "DELETE" ? "none" : "json",
      body_content:
        method === "GET" || method === "DELETE"
          ? null
          : JSON.stringify(
              { title: "Learning request", body: "Saved from seed data" },
              null,
              2,
            ),
      auth_type: index % 4 === 0 ? "bearer" : "none",
      auth_config: index % 4 === 0 ? { token: "{{apiKey}}" } : null,
      sort_order: index,
    };
  });
  await knex("saved_requests").insert(
    savedRequests.map((request) => ({
      ...request,
      headers: JSON.stringify(request.headers),
      params: JSON.stringify(request.params),
    })),
  );

  await knex("request_history").insert(
    Array.from({ length: 30 }, (_, index) => ({
      user_id: users[0].id,
      method: methods[index % methods.length],
      url: `https://jsonplaceholder.typicode.com/${index % 2 === 0 ? "posts" : "users"}`,
      request_headers: { Accept: "application/json" },
      request_body: index % 3 === 0 ? '{"sample":true}' : null,
      response_status: index % 7 === 0 ? 404 : 200,
      response_headers: { "content-type": "application/json" },
      response_body: JSON.stringify({ ok: index % 7 !== 0, index }),
      response_size_bytes: 32 + index,
      response_time_ms: 80 + index * 9,
      error_message: null,
      created_at: new Date(Date.now() - index * 60 * 60 * 1000),
    })),
  );
}
