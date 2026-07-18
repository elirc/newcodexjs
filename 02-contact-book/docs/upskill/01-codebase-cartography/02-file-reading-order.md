# File Reading Order

Project: **Contact Book / Address Manager** (`02-contact-book`)

## Junior Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/contactRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/contactController.js` - Confirm controllers are thin.
6. `server/src/services/contactService.js` - Study validation, invariants, and branching.
7. `server/src/models/contactModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/202607030201_create_contacts_tags.js` - Read schema as the durable contract.

## Mid-Level Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/contactRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/contactController.js` - Confirm controllers are thin.
6. `server/src/services/contactService.js` - Study validation, invariants, and branching.
7. `server/src/models/contactModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/202607030201_create_contacts_tags.js` - Read schema as the durable contract.
9. `server/db/seeds/001_contacts.js` - Understand demo states and edge cases.
10. `server/src/middleware/errors.js` - Understand how errors become API responses.
11. `server/src/config/env.js` - Learn runtime configuration and secret boundaries.
12. `server/knexfile.js` - Learn CLI database wiring.

## Senior Path

1. Start at `server/db/migrations/202607030201_create_contacts_tags.js` and ask whether the schema supports future change.
2. Move to `server/src/services/contactService.js` and look for implicit invariants.
3. Move to `server/src/models/contactModel.js` and look for unbounded queries, N+1 risk, and transaction boundaries.
4. Move to `server/src/middleware/errors.js` and inspect observability and failure contracts.
5. Finish at `client/src/services/api.js` and ask whether public contracts are stable.

## Pause And Predict

Before opening `server/src/services/contactService.js`, predict where validation should live. After reading, grade whether the code matches that boundary.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
