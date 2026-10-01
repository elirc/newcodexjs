import { db } from "../config/db.js";

/** Reads weekly recurring availability for a provider. */
export async function listAvailability(providerId: number) {
  return db("availability")
    .where({ provider_id: providerId })
    .orderBy(["day_of_week", "start_time"]);
}

/** Replaces weekly availability in one transaction so edits remain coherent. */
export async function replaceAvailability(
  providerId: number,
  slots: Array<Record<string, unknown>>,
) {
  return db.transaction(async (trx) => {
    await trx("availability").where({ provider_id: providerId }).delete();
    if (!slots.length) return [];
    return trx("availability")
      .insert(slots.map((slot) => ({ ...slot, provider_id: providerId })))
      .returning("*");
  });
}

/** Gets a date-specific override, including unavailable days and custom hours. */
export async function findOverride(providerId: number, date: string) {
  return db("availability_overrides")
    .where({ provider_id: providerId, override_date: date })
    .first();
}

/** Lists overrides in a date range for provider calendar/settings screens. */
export async function listOverrides(
  providerId: number,
  startDate?: string,
  endDate?: string,
) {
  const query = db("availability_overrides")
    .where({ provider_id: providerId })
    .orderBy("override_date", "asc");
  if (startDate) query.andWhere("override_date", ">=", startDate);
  if (endDate) query.andWhere("override_date", "<=", endDate);
  return query;
}

/** Creates or replaces one override for a provider and date. */
export async function upsertOverride(values: Record<string, unknown>) {
  const [override] = await db("availability_overrides")
    .insert(values)
    .onConflict(["provider_id", "override_date"])
    .merge()
    .returning("*");
  return override;
}

/** Deletes an override owned by a provider. */
export async function deleteOverride(id: number, providerId: number) {
  return db("availability_overrides")
    .where({ id, provider_id: providerId })
    .delete();
}
