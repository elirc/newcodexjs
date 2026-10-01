# Codebase map and reading order

[Course index](README.md)

## The problem this project solves

Two bookings could both pass the overlap query before either insert committed. A notification failure could leave a booking saved without its expected confirmation record. The improvement you will study is: Appointment creation and confirmed timing/status updates lock the provider before checking overlaps. Booking and its notification commit together. Conflicting reschedules leave the original appointment untouched.

## Data model

Provider profiles belong to users and own services. Appointments reference provider, customer and service, with start_time/end_time/status/price. Availability rules supply candidate slots; notification rows describe booking events.

An object is a named collection of fields. An array is an ordered collection of values. An id answers “which record?”; an index answers “where is it in this array right now?” Those questions are different whenever the list can be filtered, reordered or edited. Persisted data is the form that must survive a process/page restart. Derived data can be recomputed from that persisted state.

## Trace one action

1. A React form, button or test sends a concrete operation.
2. The client serializes editable values as an HTTP request.
3. The server validates runtime input and the relevant record relationships.
4. The repository or model reads authoritative state and performs the documented change.
5. The storage boundary commits or rejects the operation.
6. The response or broadcast gives the client its observed result.

```mermaid
flowchart LR
    A[Input or user action] --> B[Validate and normalize]
    B --> C[Compute intended change]
    C --> D[Commit at the state boundary]
    D --> E[Return or render observed state]
    B --> F[Explain invalid input]
    D --> G[Handle a failed write]
```

This diagram names responsibilities, not necessarily separate files. A small browser program can keep them in app.js. A larger API spreads them across controllers, services and models. Follow the actual sequence above rather than assuming every repository has the same architecture.

## Where to read first

1. [server/src/models/appointmentModel.ts](../server/src/models/appointmentModel.ts): locate `createAppointment` and read its inputs, branches and return/side effects.
2. [test/booking.test.ts](../test/booking.test.ts): read the scenario names before the helper code.
3. The root [README](../README.md): connect setup and the larger application workflow.

## Source navigation

- [client/src/App.tsx](../client/src/App.tsx)
- [client/src/components/ui/Button.tsx](../client/src/components/ui/Button.tsx)
- [client/src/features/appointments/components/AppointmentList.tsx](../client/src/features/appointments/components/AppointmentList.tsx)
- [client/src/features/appointments/components/AppointmentStatusBadge.tsx](../client/src/features/appointments/components/AppointmentStatusBadge.tsx)
- [client/src/features/availability/components/OverrideManager.tsx](../client/src/features/availability/components/OverrideManager.tsx)
- [client/src/features/availability/components/WeeklyScheduleEditor.tsx](../client/src/features/availability/components/WeeklyScheduleEditor.tsx)
- [client/src/features/booking/components/BookingConfirmation.tsx](../client/src/features/booking/components/BookingConfirmation.tsx)
- [client/src/features/booking/components/DatePicker.tsx](../client/src/features/booking/components/DatePicker.tsx)
- [client/src/features/booking/components/TimeSlotGrid.tsx](../client/src/features/booking/components/TimeSlotGrid.tsx)
- [client/src/features/calendar/components/CalendarMonthView.tsx](../client/src/features/calendar/components/CalendarMonthView.tsx)
- [client/src/features/providers/components/ProviderCard.tsx](../client/src/features/providers/components/ProviderCard.tsx)
- [client/src/features/providers/components/ProviderSearch.tsx](../client/src/features/providers/components/ProviderSearch.tsx)
- [client/src/features/providers/components/ServiceList.tsx](../client/src/features/providers/components/ServiceList.tsx)
- [client/src/main.tsx](../client/src/main.tsx)
- [client/src/pages/BookingPage.tsx](../client/src/pages/BookingPage.tsx)
- [client/src/pages/BrowseProvidersPage.tsx](../client/src/pages/BrowseProvidersPage.tsx)
- [client/src/pages/CustomerDashboardPage.tsx](../client/src/pages/CustomerDashboardPage.tsx)
- [client/src/pages/ProviderDashboardPage.tsx](../client/src/pages/ProviderDashboardPage.tsx)
- [client/src/pages/ProviderPage.tsx](../client/src/pages/ProviderPage.tsx)
- [client/src/pages/ProviderSettingsPage.tsx](../client/src/pages/ProviderSettingsPage.tsx)
- [client/src/services/api.ts](../client/src/services/api.ts)
- [client/src/types/index.ts](../client/src/types/index.ts)
- [client/src/vite-env.d.ts](../client/src/vite-env.d.ts)
- [client/vite.config.ts](../client/vite.config.ts)
- [server/db/migrations/20260703140000_create_appointment_booking.ts](../server/db/migrations/20260703140000_create_appointment_booking.ts)
- [server/db/seeds/001_appointment_booking_seed.ts](../server/db/seeds/001_appointment_booking_seed.ts)
- [server/knexfile.ts](../server/knexfile.ts)
- [server/scripts/database.ts](../server/scripts/database.ts)
- [server/src/app.ts](../server/src/app.ts)
- [server/src/config/db.ts](../server/src/config/db.ts)
- [server/src/config/env.ts](../server/src/config/env.ts)
- [server/src/controllers/appointmentController.ts](../server/src/controllers/appointmentController.ts)
- [server/src/controllers/providerController.ts](../server/src/controllers/providerController.ts)
- [server/src/middleware/errorMiddleware.ts](../server/src/middleware/errorMiddleware.ts)
- [server/src/middleware/requestContext.ts](../server/src/middleware/requestContext.ts)
- [server/src/middleware/validate.ts](../server/src/middleware/validate.ts)
- [server/src/models/appointmentModel.ts](../server/src/models/appointmentModel.ts)
- [server/src/models/availabilityModel.ts](../server/src/models/availabilityModel.ts)
- [server/src/models/notificationModel.ts](../server/src/models/notificationModel.ts)
- [server/src/models/providerModel.ts](../server/src/models/providerModel.ts)
- [server/src/models/serviceModel.ts](../server/src/models/serviceModel.ts)
- [server/src/routes/appointmentRoutes.ts](../server/src/routes/appointmentRoutes.ts)
- [server/src/routes/providerRoutes.ts](../server/src/routes/providerRoutes.ts)
- [server/src/server.ts](../server/src/server.ts)
- [server/src/services/appointmentService.ts](../server/src/services/appointmentService.ts)
- [server/src/services/providerService.ts](../server/src/services/providerService.ts)
- [server/src/services/slotService.ts](../server/src/services/slotService.ts)
- [server/src/types/express.d.ts](../server/src/types/express.d.ts)
- [server/src/utils/errors.ts](../server/src/utils/errors.ts)
- [server/src/utils/response.ts](../server/src/utils/response.ts)
- [server/src/validators/appointmentValidators.ts](../server/src/validators/appointmentValidators.ts)
- [server/src/validators/providerValidators.ts](../server/src/validators/providerValidators.ts)

## A practical reading technique

At each function boundary, write down the value coming in, the value going out and any side effect. A side effect includes a storage write, SQL query, network request, timer registration or DOM update. If a function calls another function, inspect only that next dependency until you can finish the chosen trace. Return to unrelated files later.

For this lesson, start with: **Two requests for 2099-01-01T10:00:00Z create one confirmed appointment and one 409 conflict. A 10:30 appointment succeeds. Moving it to 10:15 fails and leaves 10:30 stored. Reject notification inserts in the test schema and verify no booking is added.** Mark where the id, time, amount or other important value changes representation. For example, JSON serializes values into text; a date field may be a calendar string; SQL aggregates may return a different type from individual rows. Representation changes are common bug locations.

## Check your understanding

Without reading the solution, answer: Who owns the mutable state? Which input is untrusted? Which function first decides whether the operation is valid? What survives reload or restart? What observation would prove that the operation partially failed? Point to a source file for each answer, rather than describing a generic app from memory.
