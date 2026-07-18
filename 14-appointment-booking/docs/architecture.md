# Architecture

## Backend

The Express app follows the required controller/service/model split:

- Controllers parse validated Express requests and return the standard `{ success, data }` envelope.
- Services own business rules: slot calculation, cancellation policy, conflict checks, and notification creation.
- Models contain Knex queries only.
- Middleware handles request context, Zod validation, and centralized error envelopes.

## Data model

Core tables are `users`, `provider_profiles`, `services`, `availability`, `availability_overrides`, `appointments`, and `notifications`.

Appointments store `start_time` and `end_time` as `timestamp with time zone`. Weekly availability stores local `time` values and a provider `timezone` decides how those local times become UTC instants.

## Slot calculation

`slotService.getAvailableSlots` implements the key booking algorithm:

1. Load provider policy and requested service.
2. Pick custom override hours for the date, or recurring weekly availability for the weekday.
3. Convert provider-local date/time windows to UTC.
4. Step through windows by `service.duration_minutes + provider.booking_buffer_minutes`.
5. Exclude past slots and any slots returned by the SQL overlap query.

The conflict query is intentionally explicit:

```sql
select *
from appointments
where provider_id = ?
  and status = 'confirmed'
  and start_time < ?
  and end_time > ?
```

## Frontend

The React app uses Vite, TypeScript, CSS Modules, Axios, and React Query. The first screen is the real provider browsing experience, not a marketing page. The provider settings page demonstrates recurring availability and overrides, while dashboards show the two-sided marketplace views.
