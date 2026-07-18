# Project 14: Appointment Booking System

Self-contained TypeScript full-stack app for provider discovery, service booking, recurring availability, overrides, conflict detection, appointment management, and notification records.

## Run locally

1. Create a PostgreSQL database named `appointment_booking`.
2. Copy `.env.example` into `server/.env` and `client/.env` as needed.
3. In `server/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm run dev`.
4. In `client/`, run `npm install`, then `npm run dev`.

The frontend expects the API at `http://localhost:4214/api` and runs on `http://localhost:5174`.

## Demo users

The backend uses development headers instead of full authentication so the project can focus on booking logic:

- Customer: `x-user-id: 4`
- Provider: `x-user-id: 1`, `x-user-role: provider`

## Implemented scope

- Providers, services, weekly availability, date overrides, appointments, notifications.
- Public browsing and available slot endpoint.
- Customer booking, cancellation with provider policy, and rescheduling.
- Provider profile/service/availability/override management endpoints.
- Provider dashboard with today schedule and status counts.
- React UI for browsing, profile, booking, customer dashboard, provider dashboard, and settings.

## Tradeoffs

Email notifications are represented as database rows in `notifications` rather than real email delivery. Timezone conversion uses `date-fns-tz` at the slot boundary and stores appointment timestamps as UTC `timestamp with time zone`.
