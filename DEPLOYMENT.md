# Deploying Shimshal Heights

Three services work together:

```
Visitors ─► Next.js site (public pages + /admin) ──/api/* proxied──► Express API ─► MongoDB Atlas
                                                                          └──────► Cloudinary (images)
```

The site and the admin panel are one Next.js app. The browser only ever talks to the site's own address; Next.js forwards `/api/*` to the API. That is why the admin login cookie works without any cross-site cookie settings.

Requirements: Node.js 20.9 or newer (22 recommended) for both apps.

---

## 1. MongoDB Atlas

1. Create a free account at mongodb.com/atlas and create a cluster. M0 (free) is fine to start; it has **no automatic backups** (see section 7).
2. **Database Access**: create a database user with a long random password and the `readWriteAnyDatabase` role (or read/write on the `shimshal-heights` database only).
3. **Network Access**: allow the IP addresses of your API host. If your host has changing outbound IPs (most free tiers), you will have to allow `0.0.0.0/0`; keep the password strong, since TLS and the password are then the only protection.
4. **Connect, Drivers**: copy the connection string and put the database name in it:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/shimshal-heights?retryWrites=true&w=majority`
5. Collections and indexes are created automatically the first time the API starts. Nothing to import.

The booking logic does not need a replica set or transactions; it works on any MongoDB 6+ including Atlas M0.

## 2. Cloudinary

1. Create an account at cloudinary.com. From the dashboard note the **Cloud name**, **API key** and **API secret**.
2. Put them in the **API's** environment only (never in the frontend). The API uploads images on the admin's behalf and creates these folders itself: `shimshal-heights/logo`, `/rooms`, `/restaurant`, `/gallery`, `/menu`.
3. No upload presets are needed. Uploads are signed by the API.

## 3. The API (Express)

Any Node host works (Render, Railway, Fly.io, a VPS).

* Root directory: `backend`
* Build command: `npm ci`
* Start command: `npm start`
* Health check path: `/api/health`

### API environment variables

| Variable | Required | Example / notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `PORT` | host sets it | `5000` |
| `MONGODB_URI` | yes | the Atlas string from section 1 |
| `JWT_SECRET` | yes | 32+ random characters. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `8h` (default) |
| `COOKIE_NAME` | no | `sh_token` (must match the site's `ADMIN_COOKIE_NAME`) |
| `COOKIE_SECURE` | yes | `true` (you are on HTTPS) |
| `COOKIE_SAMESITE` | no | `lax` (default). Keep `lax` with the proxy setup |
| `CLIENT_ORIGINS` | yes | the site's public address, exactly as the browser shows it: `https://www.shimshalheights.com` (comma-separate several) |
| `TRUST_PROXY` | yes | see "Rate limiting and proxies" below |
| `HOTEL_TIMEZONE` | no | `Asia/Karachi` (default). Decides what "today" means for check-in dates |
| `RATE_LIMIT_ENABLED` | no | `true` (default). Never turn off in production |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | yes | from Cloudinary |
| `FRONTEND_REVALIDATE_URL` | recommended | `https://www.shimshalheights.com/revalidate` |
| `REVALIDATE_SECRET` | recommended | 16+ random characters, **identical** to the site's value |
| `ADMIN_NOTIFY_EMAIL` | optional | used once an email provider is connected |

The API refuses to start with a missing or weak `JWT_SECRET` and prints which setting is wrong.

### Create the first admin (once)

In your host's shell for the API (or locally, pointing `MONGODB_URI` at Atlas):

```
ADMIN_NAME="Hotel Admin" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-unique-passphrase' npm run seed
```

Do not use `-- --demo` in production (it adds placeholder rooms). The script does nothing if that email already exists. Do not leave `ADMIN_PASSWORD` stored in your host's environment afterwards.

## 4. The website (Next.js)

Vercel is the easiest host. Set the root directory to `frontend`. Self-hosting works too (`npm ci && npm run build && npm start`).

### Site environment variables

Variables starting with `NEXT_PUBLIC_` and `BACKEND_URL` are read **at build time**, so set them before the first build and redeploy after changing them.

| Variable | Required | Example / notes |
|---|---|---|
| `BACKEND_URL` | yes | the API's address, `https://api.shimshalheights.com` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.shimshalheights.com` (used for the sitemap, canonical links and sharing previews) |
| `NEXT_PUBLIC_DEMO_MODE` | yes | `false`. Removes the preview banner, placeholder wording and fallback contact details |
| `REVALIDATE_SECRET` | recommended | same value as the API's. Lets admin edits show on the site instantly |
| `ADMIN_COOKIE_NAME` | no | `sh_token` (same as the API's `COOKIE_NAME`) |

Without `REVALIDATE_SECRET` everything still works; edits just take up to 60 seconds to appear.

Then attach your domain and enable HTTPS (Vercel and most hosts do this automatically).

## 5. Rate limiting and proxies (important)

The API rate-limits sign-in attempts, booking requests and contact messages **per visitor IP address**. Visitors reach the API through the site's proxy, and there is normally a host or CDN in front of the site. `TRUST_PROXY` tells the API how many of those hops to trust when reading the visitor's address.

* **Site behind one edge proxy** (Vercel, Cloudflare, or Nginx in front of Next.js) and the API reachable directly from the site: `TRUST_PROXY=1`. We tested this: the API then sees the real visitor address.
* **The API also sits behind its own host load balancer** (for example Render): the API sees one more hop, so use `TRUST_PROXY=2`.
* **If it is wrong**, either every visitor shares one limit (a handful of guests could lock everyone out) or the limit can be dodged by sending a fake header.

**Verify after deploying:** open the site on your phone over mobile data, load a page, and look at the API log. In production each line starts with the client address; it must be your phone's public IP, not the host's or `127.0.0.1`. Adjust `TRUST_PROXY` until it is right.

## 6. Go-live checklist

Content, entered in the admin (`https://your-site/admin`):
- [ ] **Settings**: hotel name, description, address, phone numbers, email, WhatsApp number (digits, e.g. `923001234567`), social links, check-in/check-out times, booking and cancellation policies, SEO title and description, Google Maps link and embed URL (Google Maps: Share, Embed a map, copy the `src` URL).
- [ ] **Rooms**: real names, descriptions, prices, capacities, amenities, number of rooms of each type, and photos.
- [ ] **Restaurant**: description, opening hours, categories, dishes, prices, photos.
- [ ] **Gallery**: photos in each category. The homepage hero, About and call-to-action pictures come from "Mountains & Nature", "Shimshal Valley" and "Hotel Exterior".
- [ ] **Testimonials**: only real guest reviews, published.
- [ ] **About page**: add the hotel's real story and philosophy in `frontend/src/config/content.ts` (`aboutContent`). Until then those two sections stay hidden.

Technical:
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` and the site rebuilt.
- [ ] HTTPS on both the site and the API; `COOKIE_SECURE=true`.
- [ ] `CLIENT_ORIGINS` equals the site address exactly (a mismatch shows as "Origin not allowed" on every booking).
- [ ] `TRUST_PROXY` verified (section 5).
- [ ] Place a real test booking from a phone. Check it appears in admin Bookings as *pending* and in the notifications bell, then reject it. Confirm the same dates can be booked again.
- [ ] Send a test message from the contact page and confirm it shows in admin Messages.
- [ ] Edit a room price in the admin and confirm the site updates within seconds.
- [ ] Open `/sitemap.xml` and `/robots.txt`. Add the site to Google Search Console and submit the sitemap.
- [ ] Sign in as a **staff** user and confirm they cannot open Rooms or Settings.

## 7. Operating it

**Backups.** Atlas M0 has none. Either upgrade to M10+ (continuous backup) or run `mongodump --uri "$MONGODB_URI" --out backup-$(date +%F)` on a schedule and store the result off the server. Cloudinary keeps the images.

**If booking availability ever looks wrong** (for example after restoring a backup or editing data by hand), run `npm run rebuild-inventory` in `backend`. It recomputes the per-night reservation counts from the active bookings.

**Secrets.** To rotate `JWT_SECRET`, change it and restart; everyone is signed out. Rotate Cloudinary and Atlas credentials in their dashboards, then update the API's environment.

**Updating.** Deploy the API first, then the site. Run `npm audit --omit=dev` in both folders from time to time and update packages that report issues.

**Monitoring.** Point an uptime monitor (UptimeRobot, Better Stack) at `https://your-api/api/health` and at the site's home page.

## 8. Running the tests

Backend (needs a MongoDB reachable at `MONGODB_URI`, default `mongodb://127.0.0.1:27017`; each run uses a throwaway database): `cd backend && npm test`

Browser end-to-end checks of the admin and the public site: see `e2e/README.md`.

## 9. Known limits at launch

* **No email is sent.** Guests do not get a confirmation email and staff are not emailed. New requests appear in the admin dashboard and the notifications bell. Connect a provider in `backend/src/services/email.service.js` when you want emails.
* **No online payment.** Payment status is set by staff.
* **No screen to change a password or add staff users.** Create users with the seed script or directly in the database. This is the first thing worth adding after launch.
* **Rate limit counters live in the API's memory.** Fine for one API instance; use a shared store (for example Redis) if you run several.
* **The notifications bell checks once a minute**; it is not instant.
* **Facilities, the "Shimshal experience" blocks and the About text are written in code** (`frontend/src/config/content.ts`), not in the admin.
* Tested in Chromium only. Check Safari and Firefox once on a real phone before launch.
* Cloudinary uploads and MongoDB Atlas were not tested against live accounts (tests used a local MongoDB and an in-memory stand-in for Cloudinary), so do one real upload and one real booking first.
