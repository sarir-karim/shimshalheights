# Browser end-to-end checks

`admin_e2e.py` drives a real browser (Playwright) through the whole admin: login and route guards, dashboard,
rooms, bookings, restaurant and menu, gallery, testimonials, messages, settings, the staff role, session expiry,
mobile and tablet layouts. 97 checks.

It needs the full stack running against seeded data:

1. MongoDB running on `127.0.0.1:27017`.
2. `cd backend && node tests/e2e-server.mjs` seeds sample data and starts the API on port 5055.
   It replaces Cloudinary with in-memory fakes, so it needs no Cloudinary account. Never use it in production.
3. `cd frontend && BACKEND_URL=http://127.0.0.1:5055 npm run build && BACKEND_URL=http://127.0.0.1:5055 npx next start -p 3111`
4. Create the image fixtures in `/tmp/e2e` (`a.png`, `b.png`, `c.png` small images and `notimage.png` containing text), then
   `pip install playwright && playwright install chromium && python3 e2e/admin_e2e.py`

## Public site checks
`public_e2e.py` (63 checks) tests the public website running on live API data: rooms, menu, gallery and testimonials
from the database, the real booking flow (including double-booking refusal and capacity errors), the contact form,
SEO output, mobile/tablet layouts, and that admin edits appear on the site within seconds.

Run it the same way, but seed the richer content (do not set `E2E_SEED`) and build/start the frontend with
`NEXT_PUBLIC_DEMO_MODE=false` and `REVALIDATE_SECRET=e2e-revalidate-secret-123456`.
The admin checks use `E2E_SEED=minimal`.
