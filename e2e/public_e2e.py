import re, json, traceback
from playwright.sync_api import sync_playwright, expect
B = "http://localhost:3111"
fails = []
def ok(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name, extra)
    if not cond: fails.append(name)
def count(loc, n, t=8000):
    try: expect(loc).to_have_count(n, timeout=t); return True
    except Exception: return False
def vis(loc, t=8000):
    try: loc.first.wait_for(state="visible", timeout=t); return True
    except Exception: return False
def gone(loc, t=8000):
    try: expect(loc).to_have_count(0, timeout=t); return True
    except Exception: return False
def section(fn):
    def run(*a, **k):
        try: fn(*a, **k)
        except Exception as e:
            ok(f"{fn.__name__} crashed", False, str(e).splitlines()[0][:170]); traceback.print_exc(limit=1)
    return run
def poll(pg, url, check, tries=12, wait=500):
    for _ in range(tries):
        pg.goto(url, wait_until="networkidle")
        if check(): return True
        pg.wait_for_timeout(wait)
    return False
def day(n):
    import datetime
    return (datetime.date.today() + datetime.timedelta(days=n)).isoformat()

errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
    pg.on("console", lambda m: errs.append(("console", m.text)) if m.type == "error" else None)

    @section
    def home():
        pg.goto(B + "/", wait_until="networkidle"); pg.wait_for_timeout(1500)
        ok("home: title from admin SEO settings", pg.title() == "Shimshal Heights | Mountain Hotel", pg.title())
        ok("home: featured rooms come from the database", vis(pg.get_by_role("heading", name="Mountain Standard Room")) and vis(pg.get_by_role("heading", name="Deluxe Valley Room")))
        ok("home: prices come from the database", vis(pg.get_by_text("Rs 8,000")) and vis(pg.get_by_text("Rs 11,000")))
        ok("home: non-featured room not on homepage", pg.get_by_role("heading", name="Heights Suite").count() == 0)
        ok("home: no mock/demo content leaks through", pg.get_by_text("Placeholder for").count() == 0 and pg.get_by_text("Sample local dish").count() == 0 and pg.get_by_text("Sample breakfast").count() == 0)
        ok("home: only the published testimonial shows", vis(pg.get_by_text("Sample review for testing only.")) and pg.get_by_text("unpublished sample review").count() == 0)
        ok("home: restaurant highlights from the database", vis(pg.get_by_text("Apricot Stew")))
        ok("home: gallery preview from the database", pg.locator("section[aria-labelledby=gallery-title] ul li").count() >= 4)
        ok("home: footer contact details from admin settings", vis(pg.locator("footer").get_by_text("+92 300 5550101")) and vis(pg.locator("footer").get_by_text("stay@shimshalheights.test")))
        ok("home: footer shows only the social links that exist", pg.locator("footer a[aria-label=Facebook]").count() == 1 and pg.locator("footer a[aria-label=Instagram]").count() == 0)
        ok("home: no demo banner in production mode", pg.get_by_text("Preview build").count() == 0)
        ok("home: no placeholder wording in production mode", pg.get_by_text("demo price").count() == 0 and pg.get_by_text("Sample reviews shown").count() == 0 and pg.get_by_text("Kind words from guests").count() == 1)
        ok("home: real Google Maps iframe from settings", pg.locator("iframe[title*='Map']").count() == 1)
        wa = pg.get_by_role("link", name="Chat on WhatsApp").first.get_attribute("href")
        ok("home: WhatsApp link uses the configured number", wa.startswith("https://wa.me/923005550101?text="), wa[:50])
        ld = json.loads(pg.locator("script[type='application/ld+json']").first.inner_text())
        ok("home: structured data reflects settings", ld["@type"] == "Hotel" and ld["telephone"] == "+92 300 5550101" and ld["sameAs"] == ["https://facebook.com/shimshalheights"])
        pg.screenshot(path="/tmp/shots/pub-home.png", full_page=True)
    home()

    @section
    def rooms():
        pg.goto(B + "/rooms", wait_until="networkidle")
        ok("rooms: all 5 active rooms listed", count(pg.locator("article"), 5))
        pg.select_option("#f-type", "suite"); ok("rooms: type filter works on live data", count(pg.locator("article"), 1) and vis(pg.get_by_role("heading", name="Heights Suite")))
        pg.goto(B + "/rooms/deluxe-valley-room", wait_until="networkidle")
        ok("room page: details from database", vis(pg.get_by_role("heading", name="Deluxe Valley Room", level=1)) and vis(pg.get_by_text("1 king bed").first) and vis(pg.get_by_text("Rs 11,000").first))
        ok("room page: policies from settings", vis(pg.get_by_text("Free cancellation up to 7 days before arrival.")))
        ok("room page: related rooms", pg.locator("section[aria-labelledby=related-title] article").count() == 3)
        r = pg.goto(B + "/rooms/no-such-room", wait_until="networkidle"); ok("room page: unknown slug is a real 404", r.status == 404 and vis(pg.get_by_role("heading", name="Page not found.")))
        ok("404 page: has site header and footer", pg.locator("header").count() >= 1 and pg.locator("footer").count() == 1)
    rooms()

    @section
    def booking_flow():
        ci, co = day(70), day(73)
        pg.goto(B + "/booking", wait_until="networkidle")
        pg.fill("#bk-in", ci); pg.fill("#bk-out", co); pg.get_by_role("button", name="Check availability").click()
        ok("booking: availability from the API lists rooms", vis(pg.get_by_role("heading", name=re.compile("room types? for 3 nights"))) and count(pg.get_by_role("button", name="Select this room"), 5))
        pg.get_by_role("button", name="Select this room").nth(1).click()
        pg.get_by_role("button", name="Send booking request").click()
        ok("booking: server-side-matching validation messages", pg.get_by_text("Enter your full name").is_visible())
        pg.fill("#bk-name", "Playwright Guest"); pg.fill("#bk-email", "pw.guest@example.com"); pg.fill("#bk-phone", "+92 300 7654321"); pg.fill("#bk-notes", "Vegetarian meals please")
        pg.get_by_role("button", name="Send booking request").click()
        ok("booking: confirmation with a real reference, status pending", vis(pg.get_by_text("Booking request received")) and re.match(r"SH-\d{8}-[A-Z2-9]{5}", pg.locator("main p.font-display").first.inner_text() or ""))
        ref = pg.locator("main p.font-display").first.inner_text()
        ok("booking: no demo-mode notice on a real submission", pg.get_by_text("Demo mode").count() == 0)
        a = ctx.request.post(B + "/api/auth/login", data={"email": "admin@example.com", "password": "admin-password-123"}, headers={"Origin": B})
        ok("admin API login via the site proxy", a.status == 200)
        bk = ctx.request.get(B + f"/api/bookings?q={ref}").json()["data"]
        ok("booking: it is saved in the database as pending with the right data", len(bk) == 1 and bk[0]["status"] == "pending" and bk[0]["guestName"] == "Playwright Guest" and bk[0]["specialRequests"] == "Vegetarian meals please" and bk[0]["numberOfNights"] == 3, str(bk[0]["status"]) if bk else "none")
        ok("booking: price computed by the server", bk[0]["totalPrice"] == bk[0]["pricePerNight"] * 3)
        n = ctx.request.get(B + "/api/admin/notifications").json()
        ok("booking: admin notification created", any(ref in x["title"] for x in n["data"]))
    booking_flow()

    @section
    def double_booking():
        # Heights Suite (1 unit) is already booked day+40..+43 by the seed
        pg.goto(B + f"/booking?checkIn={day(41)}&checkOut={day(42)}&adults=2", wait_until="networkidle")
        ok("availability: a taken room is not offered", vis(pg.get_by_role("button", name="Select this room")) and pg.get_by_role("heading", name="Heights Suite").count() == 0)
        pg.goto(B + "/rooms/heights-suite", wait_until="networkidle")
        pg.fill("#rb-in", day(41)); pg.fill("#rb-out", day(42)); pg.fill("#rb-name", "Late Guest"); pg.fill("#rb-email", "late@example.com"); pg.fill("#rb-phone", "+92 300 1112222")
        pg.get_by_role("button", name="Send booking request").click()
        ok("double booking: server refuses and the guest sees a clear message", vis(pg.get_by_text("no longer available")) and pg.get_by_text("Booking request received").count() == 0)
        pg.fill("#rb-in", day(90)); pg.fill("#rb-out", day(92)); pg.get_by_role("button", name="Send booking request").click()
        ok("same room on free dates succeeds", vis(pg.get_by_text("Booking request received")))
        pg.goto(B + "/rooms/heights-suite", wait_until="networkidle"); pg.fill("#rb-in", day(95)); pg.fill("#rb-out", day(96)); pg.fill("#rb-adults", "6")
        pg.fill("#rb-name", "Big Party"); pg.fill("#rb-email", "big@example.com"); pg.fill("#rb-phone", "+92 300 1113333"); pg.get_by_role("button", name="Send booking request").click()
        ok("capacity: too many guests rejected before submit", vis(pg.get_by_text("fits up to")))
    double_booking()

    @section
    def contact():
        pg.goto(B + "/contact", wait_until="networkidle")
        ok("contact: details from settings", vis(pg.get_by_text("+92 300 5550101").first) and vis(pg.get_by_text("stay@shimshalheights.test").first))
        ok("contact: honeypot field exists but is hidden from people", pg.locator("#c-website").count() == 1 and pg.locator("#c-website").bounding_box()["x"] < -1000 and pg.locator("#c-website").get_attribute("tabindex") == "-1")
        pg.fill("#c-name", "Contact Tester"); pg.fill("#c-email", "tester@example.com"); pg.fill("#c-subject", "Group booking"); pg.fill("#c-message", "We are eight people arriving in June.")
        pg.get_by_role("button", name="Send message").click()
        ok("contact: success state", vis(pg.get_by_text("Message received")) and pg.get_by_text("Demo mode").count() == 0)
        msgs = ctx.request.get(B + "/api/contact?q=Group booking").json()["data"]
        ok("contact: message stored for staff, unread", len(msgs) == 1 and msgs[0]["email"] == "tester@example.com" and msgs[0]["isRead"] is False)
    contact()

    @section
    def restaurant_gallery():
        pg.goto(B + "/restaurant", wait_until="networkidle")
        ok("restaurant: menu comes from the database", vis(pg.get_by_text("Apricot Stew")) and vis(pg.get_by_text("Vegetable Pulao")))
        ok("restaurant: opening hours and facilities from the database", vis(pg.get_by_text("18:30 to 21:30")) and vis(pg.get_by_text("Room service")))
        pg.get_by_role("tab", name="Drinks").click(); ok("restaurant: unavailable dish flagged", vis(pg.get_by_text("Unavailable today")))
        pg.goto(B + "/gallery", wait_until="networkidle")
        ok("gallery: all 6 uploaded photos", count(pg.locator("main ul li button[aria-label^='Open image']"), 6))
        pg.get_by_role("button", name="Food", exact=True).click(); ok("gallery: category filter on live data", count(pg.locator("main ul li button[aria-label^='Open image']"), 1))
        pg.goto(B + "/facilities", wait_until="networkidle"); ok("facilities: six facilities with gallery-based photos", pg.locator("article").count() == 6)
        pg.goto(B + "/about", wait_until="networkidle"); ok("about: renders with live settings", vis(pg.get_by_text("Welcome to Shimshal Heights")))
        ok("about: draft story/philosophy hidden in production", pg.get_by_text("Draft copy").count() == 0 and pg.get_by_role("heading", name="Our story").count() == 0)
        pg.goto(B + "/rooms/deluxe-valley-room", wait_until="networkidle"); ok("room page: no 'demo price' or 'placeholder' wording in production", pg.get_by_text("demo price").count() == 0 and pg.get_by_text("placeholder", exact=False).count() == 0)
    restaurant_gallery()

    @section
    def instant_updates():
        login = ctx.request.post(B + "/api/auth/login", data={"email": "admin@example.com", "password": "admin-password-123"}, headers={"Origin": B}); assert login.status == 200
        H = {"Origin": B}
        pg.goto(B + "/", wait_until="networkidle")
        # settings change shows up without waiting for the 60s cache
        r = ctx.request.put(B + "/api/settings", data={"checkInTime": "16:30", "contactNumbers": ["+92 300 9990000"]}, headers=H); ok("admin saves settings", r.status == 200)
        ok("settings edit appears on the live site within seconds", poll(pg, B + "/", lambda: pg.locator("footer").get_by_text("+92 300 9990000").count() == 1 and pg.locator("footer").get_by_text("16:30").count() == 1))
        # new room appears, deactivated room disappears
        r = ctx.request.post(B + "/api/rooms", multipart={"name": "Glacier Cabin", "description": "A cabin with a view.", "shortDescription": "Cabin", "pricePerNight": "15500", "roomType": "suite", "maxAdults": "2", "totalRooms": "1", "bedConfiguration": "1 queen bed", "featured": "true"}, headers=H)
        ok("admin creates a room (no photos)", r.status == 201, str(r.status))
        ok("new room appears on /rooms immediately", poll(pg, B + "/rooms", lambda: pg.get_by_role("heading", name="Glacier Cabin").count() == 1))
        ok("room without photos shows the neutral placeholder", pg.locator("article", has_text="Glacier Cabin").locator("img").first.get_attribute("src") is not None and "placeholder-room" in (pg.locator("article", has_text="Glacier Cabin").locator("img").first.get_attribute("src") or ""))
        ok("new featured room appears on the homepage", poll(pg, B + "/", lambda: pg.get_by_role("heading", name="Glacier Cabin").count() == 1))
        rid = [x for x in ctx.request.get(B + "/api/rooms?all=true&limit=100").json()["data"] if x["slug"] == "glacier-cabin"][0]["id"]
        ctx.request.put(B + f"/api/rooms/{rid}", data={"isActive": False}, headers=H)
        ok("deactivated room disappears from the site immediately", poll(pg, B + "/rooms", lambda: pg.get_by_role("heading", name="Glacier Cabin").count() == 0))
        rs = pg.goto(B + "/rooms/glacier-cabin", wait_until="networkidle"); ok("deactivated room page is a 404", rs.status == 404)
        ctx.request.put(B + f"/api/rooms/{rid}", data={"isActive": True, "pricePerNight": 16000}, headers=H)
        ok("price edit shows immediately on the room page", poll(pg, B + "/rooms/glacier-cabin", lambda: pg.get_by_text("Rs 16,000").count() >= 1))
        # testimonial publish
        t = ctx.request.post(B + "/api/testimonials", data={"guestName": "Fresh Guest", "rating": 5, "review": "Published through the admin.", "isPublished": True, "isFeatured": True}, headers=H)
        ok("published testimonial appears on the homepage immediately", t.status == 201 and poll(pg, B + "/", lambda: pg.get_by_text("Published through the admin.").count() == 1))
        # sitemap includes live rooms
        sm = ""
        for _ in range(12):
            sm = ctx.request.get(B + "/sitemap.xml").text()
            if "/rooms/glacier-cabin" in sm: break
            pg.wait_for_timeout(500)
        ok("sitemap lists rooms from the database, including new ones", "/rooms/deluxe-valley-room" in sm and "/rooms/glacier-cabin" in sm, sm[:200] if "/rooms/glacier-cabin" not in sm else "")
        ok("revalidate endpoint refuses requests without the secret", ctx.request.post(B + "/revalidate").status == 401)
        ok("revalidate endpoint refuses a wrong secret", ctx.request.post(B + "/revalidate", headers={"x-revalidate-secret": "wrong-secret-wrong-secret"}).status == 401)
        ctx.request.put(B + "/api/settings", data={"checkInTime": "14:00", "contactNumbers": ["+92 300 5550101"]}, headers=H)
    instant_updates()

    @section
    def responsive():
        pages = ["/", "/rooms", "/rooms/deluxe-valley-room", "/restaurant", "/facilities", "/gallery", "/about", "/contact", "/booking"]
        for name, (w, h) in {"mobile": (375, 812), "tablet": (768, 1024)}.items():
            c = b.new_context(viewport={"width": w, "height": h}); m = c.new_page(); bad = []
            m.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
            for r_ in pages:
                m.goto(B + r_, wait_until="networkidle"); m.wait_for_timeout(250)
                ov = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if ov > 0: bad.append(f"{r_}:{ov}")
            ok(f"{name}: no horizontal overflow on any public page with live data", not bad, str(bad))
            if name == "mobile":
                m.goto(B + "/", wait_until="networkidle"); m.wait_for_timeout(1800); m.screenshot(path="/tmp/shots/pub-m-home.png")
                m.goto(B + "/rooms", wait_until="networkidle"); m.screenshot(path="/tmp/shots/pub-m-rooms.png", full_page=True)
            c.close()
    responsive()

    ignore = lambda t: any(x in t for x in ["401", "403", "404", "409", "Failed to load resource", "google.com/maps"])
    real = [e for e in errs if not ignore(e[1])]
    ok("no unexpected console/page errors", not real, str(real[:3]))
    b.close()
print("\nFAILED:", fails if fails else "none")
