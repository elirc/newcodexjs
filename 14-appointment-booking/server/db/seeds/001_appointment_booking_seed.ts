import type { Knex } from "knex";

/** Seeds realistic providers, services, weekly hours, overrides, appointments, and notifications. */
export async function seed(knex: Knex): Promise<void> {
  await knex("notifications").del();
  await knex("appointments").del();
  await knex("availability_overrides").del();
  await knex("availability").del();
  await knex("services").del();
  await knex("provider_profiles").del();
  await knex("users").del();

  const users = await knex("users")
    .insert([
      {
        name: "Maya Chen",
        email: "maya.provider@example.com",
        role: "provider",
      },
      {
        name: "Owen Patel",
        email: "owen.provider@example.com",
        role: "provider",
      },
      {
        name: "Sofia Rivera",
        email: "sofia.provider@example.com",
        role: "provider",
      },
      {
        name: "Alex Johnson",
        email: "alex.customer@example.com",
        role: "customer",
      },
      {
        name: "Priya Shah",
        email: "priya.customer@example.com",
        role: "customer",
      },
    ])
    .returning("*");

  const providers = await knex("provider_profiles")
    .insert([
      {
        user_id: users[0].id,
        specialty: "Physical Therapy",
        bio: "Movement rehab for desk workers and runners.",
        timezone: "America/New_York",
        booking_buffer_minutes: 15,
      },
      {
        user_id: users[1].id,
        specialty: "Career Coaching",
        bio: "Interview prep, portfolio review, and role transitions.",
        timezone: "America/Chicago",
        booking_buffer_minutes: 10,
      },
      {
        user_id: users[2].id,
        specialty: "Nutrition",
        bio: "Practical meal planning for busy families.",
        timezone: "America/Los_Angeles",
        booking_buffer_minutes: 15,
      },
    ])
    .returning("*");

  const services = await knex("services")
    .insert([
      {
        provider_id: providers[0].id,
        name: "Initial PT Assessment",
        description: "Mobility screen and care plan.",
        duration_minutes: 60,
        price: 125,
        sort_order: 1,
      },
      {
        provider_id: providers[0].id,
        name: "Follow-up Session",
        description: "Targeted exercise progression.",
        duration_minutes: 45,
        price: 90,
        sort_order: 2,
      },
      {
        provider_id: providers[1].id,
        name: "Resume Review",
        description: "Detailed resume and LinkedIn walkthrough.",
        duration_minutes: 45,
        price: 80,
        sort_order: 1,
      },
      {
        provider_id: providers[1].id,
        name: "Mock Interview",
        description: "Behavioral and role-specific interview practice.",
        duration_minutes: 60,
        price: 140,
        sort_order: 2,
      },
      {
        provider_id: providers[2].id,
        name: "Meal Plan Consult",
        description: "Personalized one-week plan.",
        duration_minutes: 50,
        price: 110,
        sort_order: 1,
      },
      {
        provider_id: providers[2].id,
        name: "Pantry Reset",
        description: "Ingredient audit and grocery strategy.",
        duration_minutes: 30,
        price: 65,
        sort_order: 2,
      },
    ])
    .returning("*");

  const availabilityRows = providers.flatMap((provider) =>
    [1, 2, 3, 4, 5].flatMap((day) => [
      {
        provider_id: provider.id,
        day_of_week: day,
        start_time: "09:00",
        end_time: "12:00",
      },
      {
        provider_id: provider.id,
        day_of_week: day,
        start_time: "13:00",
        end_time: "17:00",
      },
    ]),
  );
  await knex("availability").insert(availabilityRows);

  await knex("availability_overrides").insert([
    {
      provider_id: providers[0].id,
      override_date: "2026-07-10",
      is_unavailable: true,
      reason: "Conference travel",
    },
    {
      provider_id: providers[1].id,
      override_date: "2026-07-14",
      is_unavailable: false,
      start_time: "10:00",
      end_time: "15:00",
      reason: "Short office day",
    },
    {
      provider_id: providers[2].id,
      override_date: "2026-07-21",
      is_unavailable: true,
      reason: "Vacation",
    },
  ]);

  const statuses = [
    "confirmed",
    "completed",
    "cancelled_by_customer",
    "cancelled_by_provider",
    "no_show",
  ];
  const appointments = Array.from({ length: 30 }, (_, index) => {
    const provider = providers[index % providers.length];
    const service = services.filter((item) => item.provider_id === provider.id)[
      index % 2
    ];
    const day = 4 + index;
    const hour = 9 + (index % 6);
    const start = new Date(Date.UTC(2026, 6, day, hour, 0, 0));
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    return {
      provider_id: provider.id,
      customer_id: users[3 + (index % 2)].id,
      service_id: service.id,
      start_time: start,
      end_time: end,
      status: statuses[index % statuses.length],
      notes: index % 3 === 0 ? "Prefers a quiet room." : null,
      cancellation_reason: index % 5 === 2 ? "Schedule changed" : null,
      price: service.price,
    };
  });

  const insertedAppointments = await knex("appointments")
    .insert(appointments)
    .returning("*");
  await knex("notifications").insert(
    insertedAppointments.slice(0, 12).map((appointment) => ({
      user_id: appointment.customer_id,
      appointment_id: appointment.id,
      type:
        appointment.status === "confirmed"
          ? "booking_confirmed"
          : "cancellation",
      subject:
        appointment.status === "confirmed"
          ? "Booking confirmed"
          : "Appointment status changed",
      body: `Appointment ${appointment.id} is currently ${appointment.status}.`,
      sent_at: new Date(),
    })),
  );
}
