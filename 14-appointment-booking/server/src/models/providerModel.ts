import { db } from "../config/db.js";

export interface ProviderFilters {
  search?: string;
  specialty?: string;
}

/** Lists accepting providers with user names and service counts for browsing. */
export async function listProviders(filters: ProviderFilters) {
  const query = db("provider_profiles as p")
    .join("users as u", "u.id", "p.user_id")
    .leftJoin("services as s", function joinServices() {
      this.on("s.provider_id", "p.id").andOn("s.is_active", db.raw("true"));
    })
    .select("p.*", "u.name", "u.email")
    .count("s.id as service_count")
    .where("p.is_accepting_bookings", true)
    .groupBy("p.id", "u.id")
    .orderBy("u.name", "asc");

  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike("u.name", `%${filters.search}%`)
        .orWhereILike("p.bio", `%${filters.search}%`);
    });
  }

  if (filters.specialty)
    query.whereILike("p.specialty", `%${filters.specialty}%`);
  return query;
}

/** Finds a provider profile by profile id. */
export async function findProviderById(id: number) {
  return db("provider_profiles as p")
    .join("users as u", "u.id", "p.user_id")
    .select("p.*", "u.name", "u.email")
    .where("p.id", id)
    .first();
}

/** Finds a provider profile owned by a user account. */
export async function findProviderByUserId(userId: number) {
  return db("provider_profiles").where({ user_id: userId }).first();
}

/** Updates provider settings that drive booking policy and timezone display. */
export async function updateProviderProfile(
  userId: number,
  values: Record<string, unknown>,
) {
  return db("provider_profiles")
    .where({ user_id: userId })
    .update({ ...values, updated_at: db.fn.now() })
    .returning("*");
}
