# Shimshal Heights API

Node.js + Express + MongoDB (Mongoose). JavaScript (ESM), Node 20+.

## Run it
    cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
    npm install
    npm run seed                # creates the first admin (add -- --demo for placeholder rooms)
    npm run dev                 # http://localhost:5000/api/health
    npm test                    # needs a MongoDB reachable at MONGODB_URI (default mongodb://127.0.0.1:27017)

The server loads `.env`, not `.env.example`. On Windows PowerShell, copy the template with `Copy-Item .env.example .env`, then set a reachable MongoDB URI and a private random `JWT_SECRET` of at least 32 characters before starting the server.

## Structure
    src/config      env (validated with Zod), db, cloudinary
    src/models      User Room Booking InventoryNight Restaurant MenuItem Gallery Testimonial ContactMessage Notification Settings
    src/routes      thin: URL + middleware + controller
    src/controllers HTTP layer: read validated input, call services, shape the response
    src/services    availability, booking workflow, uploads (Cloudinary), email stub, notifications, auth tokens
    src/middleware  auth/roles, validate (Zod), rate limits, sanitize, origin check, upload, error handler
    src/validators  Zod schemas      src/scripts seed, rebuild-inventory

## Response format
Success `{ success: true, data, meta? }` (lists carry `meta: { page, limit, total, totalPages }`).
Error `{ success: false, message, code, errors? }`. Validation errors are `422` with `errors: [{ field, message }]`.

## Endpoints (A = admin only, S = staff or admin, otherwise public)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Rooms | `GET /rooms`, `GET /rooms/:slug`, A: `POST /rooms`, `PUT /rooms/:id`, `DELETE /rooms/:id` (multipart, field `images`, `removeImages` = publicIds to delete) |
| Bookings | `POST /bookings`, `GET /bookings/availability`, S: `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `PATCH /bookings/:id/payment` |
| Restaurant | `GET /restaurant`, A: `PUT /restaurant` (info, hours, categories, photos) |
| Menu | `GET /menu`, A: `POST /menu`, `PUT /menu/:id`, `DELETE /menu/:id` (field `image`) |
| Gallery | `GET /gallery`, A: `POST /gallery` (many `images`), `PUT /gallery/:id` (optional `image` replaces), `DELETE /gallery/:id` |
| Testimonials | `GET /testimonials`, A: `POST`, `PUT /:id`, `DELETE /:id` |
| Contact | `POST /contact`, S: `GET /contact`, `GET /contact/:id` (marks read), `PATCH /contact/:id`, `DELETE /contact/:id` |
| Settings | `GET /settings`, A: `PUT /settings` (field `logo`) |
| Admin dashboard | S: `GET /admin/stats`, `GET /admin/notifications`, `PATCH /admin/notifications/read-all`, `PATCH /admin/notifications/:id/read` |

Lists accept `page`, `limit`, `sort` and filters. `?all=true` shows hidden items (inactive rooms/gallery, unpublished reviews) only to signed-in staff.

## How double-booking is prevented
* **Availability (read):** active bookings (`pending`, `confirmed`) overlapping the request by `existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn`, counted night by night against `totalRooms`.
* **Reservation (write):** an `InventoryNight` ledger row per room per night. Reserving a night is one atomic conditional update (`reserved <= totalRooms - qty`, then `$inc`). All nights are reserved or none (partial reservations are rolled back). This is correct under concurrency on a standalone MongoDB or Atlas, with no transactions needed.
* Status changes use a compare-and-set on the current status, so two admins cannot both win. Rejecting, cancelling or completing releases the nights.
* `npm run rebuild-inventory` recomputes the ledger from bookings if it ever drifts.
* Prices are always computed on the server from the room's current price; the booking stores a snapshot.

## Roles
`admin`: everything. `staff`: bookings and contact messages only. There is no public registration; create users with the seed script (a user-management screen can be added in the admin phase).

## Not wired yet (by design)
* **Email:** `email.service.js` logs messages. Plug a provider into `deliver()`.
* **Notifications:** saved to the `notifications` collection and shown in the admin bell (polled once a minute, no push yet).
* **Online payment:** `paymentStatus` is tracked manually by staff.
