import re, sys, traceback
from playwright.sync_api import sync_playwright, expect

B = "http://localhost:3111"
A, Bp, C, NOTIMG = "/tmp/e2e/a.png", "/tmp/e2e/b.png", "/tmp/e2e/c.png", "/tmp/e2e/notimage.png"
fails = []
def ok(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name, extra)
    if not cond: fails.append(name)

def section(fn):
    def run(*a, **k):
        try: fn(*a, **k)
        except Exception as e:
            ok(f"{fn.__name__} crashed", False, str(e).splitlines()[0][:160])
            traceback.print_exc(limit=1)
    return run

def toast(pg, text, timeout=6000):
    try: pg.locator("[role=status],[role=alert]").filter(has_text=re.compile(text, re.I)).first.wait_for(timeout=timeout); return True
    except Exception: return False

def login(pg, email, pw):
    pg.goto(B + "/admin/login", wait_until="networkidle")
    pg.fill("#login-email", email); pg.fill("#login-password", pw)
    pg.get_by_role("button", name="Sign in").click()

def nav(pg, label):
    pg.get_by_role("navigation", name="Admin").locator("visible=true").get_by_role("link", name=label, exact=True).click()
    pg.wait_for_load_state("networkidle")

def count(loc, n, t=7000):
    try: expect(loc).to_have_count(n, timeout=t); return True
    except Exception: return False
def vis(loc, t=7000):
    try: loc.first.wait_for(state="visible", timeout=t); return True
    except Exception: return False

errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
    pg.on("console", lambda m: errs.append(("console", m.text)) if m.type == "error" else None)

    @section
    def auth():
        pg.goto(B + "/admin", wait_until="networkidle")
        ok("unauthenticated /admin redirects to login with next", "/admin/login" in pg.url and "next=%2Fadmin" in pg.url, pg.url[-40:])
        pg.get_by_role("button", name="Sign in").click()
        ok("login: empty form shows field errors", pg.get_by_text("Enter your email address").is_visible() and pg.get_by_text("Enter your password").is_visible())
        pg.fill("#login-email", "admin@example.com"); pg.fill("#login-password", "wrong-password-1"); pg.get_by_role("button", name="Sign in").click()
        ok("login: wrong password shows generic error", toast(pg, "Invalid email or password") or pg.get_by_text("Invalid email or password").is_visible())
        pg.fill("#login-password", "admin-password-123"); pg.get_by_role("button", name="Sign in").click()
        pg.wait_for_url("**/admin", timeout=8000)
        ok("login: success lands on dashboard", pg.get_by_role("heading", name="Dashboard").is_visible())
        pg.goto(B + "/admin/login?next=https://evil.example", wait_until="networkidle")
        ok("login page while signed in redirects to /admin (no open redirect)", pg.url.rstrip("/").endswith("/admin"), pg.url)
    auth()

    @section
    def dashboard():
        pg.goto(B + "/admin", wait_until="networkidle")
        txt = pg.locator("main").inner_text()
        def stat(label):
            return pg.locator("main").locator("a,div").filter(has_text=re.compile(rf"^{label}\s")).first.inner_text().replace("\n", " ")
        ok("dashboard: total bookings = 6", re.search(r"Total bookings\s+6", txt.replace("\n", " ")) is not None)
        ok("dashboard: pending = 2, confirmed = 2, cancelled = 1", all(re.search(p_, txt.replace("\n", " ")) for p_ in [r"Pending\s+2", r"Confirmed\s+2", r"Cancelled\s+1"]))
        ok("dashboard: paid revenue = Rs 46,000", "46,000" in txt)
        ok("dashboard: total rooms = 16", re.search(r"Total rooms\s+16", txt.replace("\n", " ")) is not None)
        ok("dashboard: both charts rendered", pg.get_by_role("img", name=re.compile("Booking requests per month")).count() == 1 and pg.get_by_role("img", name=re.compile("Paid revenue by stay month")).count() == 1)
        ok("dashboard: recent bookings + unread messages", pg.get_by_text("Alice Khan").first.is_visible() and "2 unread" in txt)
        bell = pg.get_by_role("button", name=re.compile("Notifications"))
        ok("bell shows unread count", "6 unread" in (bell.get_attribute("aria-label") or ""), bell.get_attribute("aria-label"))
        bell.click(); pg.get_by_role("button", name="Mark all read").click(); pg.wait_for_timeout(600)
        ok("bell: mark all read clears the badge", "unread" not in (pg.get_by_role("button", name=re.compile("Notifications")).get_attribute("aria-label") or ""))
        pg.keyboard.press("Escape")
        pg.screenshot(path="/tmp/shots/admin-dashboard.png", full_page=True)
    dashboard()

    @section
    def rooms():
        nav(pg, "Rooms")
        ok("rooms: 5 rows listed", count(pg.locator("main tbody tr"), 5))
        prev = pg.get_by_role("button", name="Preview Spare Room"); prev.click()
        ok("rooms: preview modal opens", pg.get_by_role("dialog").is_visible())
        pg.keyboard.press("Escape")
        ok("rooms: Esc closes modal and focus returns", pg.get_by_role("dialog").count() == 0 and pg.evaluate("document.activeElement.getAttribute('aria-label')") == "Preview Spare Room")
        pg.get_by_role("switch", name="Active: Spare Room").click()
        ok("rooms: deactivate toast + inactive badge", toast(pg, "Room deactivated") and pg.locator("tr", has_text="Spare Room").get_by_text("inactive").is_visible())
        pg.get_by_role("switch", name="Active: Spare Room").click(); toast(pg, "Room activated")
        pg.get_by_role("switch", name="Featured: Family Room").click()
        ok("rooms: featured toggle", toast(pg, "featured"))
        pg.get_by_role("link", name="Add room").click(); pg.wait_for_url("**/admin/rooms/new")
        pg.get_by_role("button", name="Create room").click()
        ok("room form: required-field errors", pg.get_by_text("Enter a room name").is_visible() and pg.get_by_text("Enter a short description").is_visible() and pg.get_by_text("Describe the beds").is_visible())
        pg.fill("#r-name", "E2E Test Room"); pg.fill("#r-short", "Short text here"); pg.fill("#r-desc", "A longer description of the room.")
        pg.fill("#r-price", "-5"); pg.fill("#r-beds", "2 single beds"); pg.get_by_role("button", name="Create room").click()
        ok("room form: negative price rejected", pg.get_by_text("Price cannot be negative").is_visible())
        pg.fill("#r-price", "9500"); pg.select_option("#r-type", "family"); pg.fill("#r-adults", "3"); pg.fill("#r-total", "2")
        pg.fill("#r-amen", "Heating"); pg.keyboard.press("Enter"); pg.fill("#r-amen", "Sauna, Balcony"); pg.keyboard.press("Enter")
        ok("room form: amenity tags added", pg.get_by_role("button", name="Remove Sauna").is_visible() and pg.get_by_role("button", name="Remove Heating").is_visible())
        pg.set_input_files("input[type=file]", [A, Bp])
        ok("room form: 2 new image previews", pg.get_by_alt_text(re.compile("New image")).count() == 2)
        pg.get_by_role("button", name="Discard b.png").click()
        ok("room form: discard a pending image", pg.get_by_alt_text(re.compile("New image")).count() == 1)
        pg.set_input_files("input[type=file]", [NOTIMG])  # fake .png full of text: passes the client check, must fail server-side
        pg.get_by_role("button", name="Create room").click()
        ok("room form: disguised non-image rejected by the server", toast(pg, "not a valid image"))
        pg.get_by_role("button", name="Discard notimage.png").click()
        pg.get_by_role("button", name="Create room").click(); pg.wait_for_url("**/admin/rooms", timeout=8000)
        ok("room form: created, returns to list with toast", toast(pg, "Room created") and vis(pg.get_by_text("E2E Test Room").locator("visible=true")))
        pg.get_by_role("link", name="Edit E2E Test Room").click(); pg.wait_for_url("**/edit/**")
        ok("room edit: form prefilled", pg.input_value("#r-name") == "E2E Test Room" and pg.input_value("#r-price") == "9500")
        pg.get_by_role("button", name="Remove this image").first.click()
        ok("room edit: image marked for removal", pg.get_by_text("Will be removed on save").is_visible())
        pg.set_input_files("input[type=file]", [C]); pg.fill("#r-price", "9900"); pg.get_by_role("button", name="Save changes").click()
        pg.wait_for_url("**/admin/rooms"); ok("room edit: saved", toast(pg, "Room updated") and vis(pg.get_by_text("Rs 9,900").locator("visible=true")))
        pg.get_by_role("button", name="Delete E2E Test Room").click()
        ok("room delete: confirm dialog shown", pg.get_by_role("dialog").get_by_text("Delete E2E Test Room?").is_visible())
        pg.get_by_role("dialog").get_by_role("button", name="Cancel").click(); ok("room delete: cancel keeps room", vis(pg.get_by_text("E2E Test Room").locator("visible=true")))
        pg.get_by_role("button", name="Delete E2E Test Room").click(); pg.get_by_role("dialog").get_by_role("button", name="Delete room").click()
        ok("room delete: confirmed", toast(pg, "Room deleted"))
        pg.get_by_role("button", name="Delete Mountain Standard Room").click(); pg.get_by_role("dialog").get_by_role("button", name="Delete room").click()
        ok("room delete: blocked when bookings exist", toast(pg, "pending or confirmed bookings") and vis(pg.get_by_text("Mountain Standard Room").locator("visible=true")))
        pg.screenshot(path="/tmp/shots/admin-rooms.png", full_page=True)
    rooms()

    @section
    def bookings():
        nav(pg, "Bookings")
        ok("bookings: 6 rows", count(pg.locator("main tbody tr"), 6))
        ref = pg.locator("tbody tr").filter(has_text="Alice Khan").get_by_role("link").first.inner_text()
        pg.fill("#admin-search", "alice"); ok("bookings: search by name", count(pg.locator("main tbody tr"), 1))
        pg.fill("#admin-search", ref.lower()); ok("bookings: search by reference (case-insensitive)", count(pg.locator("main tbody tr"), 1) and ref in pg.locator("main tbody").inner_text())
        pg.fill("#admin-search", ".*"); pg.wait_for_timeout(900); ok("bookings: regex characters are literal", pg.get_by_text("No bookings match those filters").is_visible())
        pg.get_by_role("button", name="Clear filters").first.click(); pg.wait_for_timeout(700)
        pg.select_option("#f-status", "pending"); ok("bookings: status filter pending = 2", count(pg.locator("main tbody tr"), 2))
        pg.select_option("#f-status", ""); pg.select_option("#f-pay", "paid"); ok("bookings: payment filter paid = 2", count(pg.locator("main tbody tr"), 2))
        pg.select_option("#f-pay", ""); pg.fill("#f-from", "2099-01-01"); pg.wait_for_timeout(700); ok("bookings: date filter with no matches shows empty state", pg.get_by_text("No bookings match those filters").is_visible())
        pg.get_by_role("button", name="Clear filters").first.click(); pg.wait_for_timeout(700)
        pg.select_option("#f-sort", "checkin-asc"); pg.wait_for_timeout(700)
        ok("bookings: sort by check-in soonest", "Alice Khan" in pg.locator("tbody tr").first.inner_text())
        # Reject Farah from the list (quick action)
        pg.get_by_role("button", name=re.compile("^Reject SH-")).last.click()
        ok("bookings: reject opens a confirm dialog with note box", pg.get_by_role("dialog").is_visible() and pg.get_by_label(re.compile("Note")).is_visible())
        pg.get_by_role("dialog").get_by_role("button", name="Reject").click()
        ok("bookings: rejected from list", toast(pg, "is now rejected"))
        # Confirm Elena from the detail page, with a note and payment
        pg.locator("tbody tr").filter(has_text="Elena Petrova").get_by_role("link").first.click(); pg.wait_for_url("**/admin/bookings/**")
        ok("booking detail: guest, stay and request details", vis(pg.get_by_text("Elena Petrova")) and vis(pg.get_by_text("Heights Suite")))
        pg.get_by_role("button", name=re.compile("^Confirm SH-")).click(); pg.get_by_label(re.compile("Note")).fill("Deposit received by phone")
        pg.get_by_role("dialog").get_by_role("button", name="Confirm", exact=True).click()
        ok("booking detail: confirmed with note in history", toast(pg, "is now confirmed") and vis(pg.get_by_text("Deposit received by phone")))
        pg.select_option("#pay", "paid"); ok("booking detail: payment set to paid", toast(pg, "Payment marked paid"))
        pg.select_option("#pay", "refunded"); ok("booking detail: refund after paid", toast(pg, "refunded"))
        ok("booking detail: history lists both steps", pg.get_by_role("heading", name="History").is_visible() and pg.locator("ol li").count() >= 2)
        pg.get_by_role("button", name=re.compile("^Mark completed")).click(); pg.get_by_role("dialog").get_by_role("button", name="Mark completed").click()
        ok("booking detail: completed is final (no more actions)", toast(pg, "is now completed") and vis(pg.get_by_text("can no longer be changed")))
        pg.goto(B + "/admin/bookings", wait_until="networkidle")
        pg.locator("tbody tr").filter(has_text="Carla Ruiz").get_by_role("link").first.click(); pg.wait_for_url("**/admin/bookings/**")
        ok("booking detail: cancelled booking offers no actions", vis(pg.get_by_text("can no longer be changed")) and vis(pg.get_by_text("Guest changed plans")))
        pg.goto(B + "/admin/bookings/64b000000000000000000000", wait_until="networkidle")
        ok("booking detail: unknown id shows an error, not a crash", vis(pg.get_by_role("alert")))
        pg.screenshot(path="/tmp/shots/admin-booking-detail.png", full_page=True)
    bookings()

    @section
    def restaurant():
        nav(pg, "Restaurant")
        ok("restaurant: details loaded", pg.input_value("#rs-name") != "" or pg.get_by_role("tab", name="Details & categories").is_visible())
        pg.get_by_role("button", name="Add category").click(); pg.fill("#cat-2", "Desserts")
        pg.get_by_role("button", name="Add hours").click(); pg.fill("#oh-l-1", "Lunch"); pg.fill("#oh-h-1", "12:00 to 15:00")
        pg.fill("#rs-fac", "Room service"); pg.keyboard.press("Enter")
        pg.set_input_files("input[type=file]", [A])
        pg.get_by_role("button", name="Move category 3 up").click()
        pg.get_by_role("button", name="Save restaurant details").click()
        ok("restaurant: details, hours, categories and photo saved", toast(pg, "Restaurant details saved"))
        pg.get_by_role("button", name="Add hours").click(); pg.get_by_role("button", name="Save restaurant details").click()
        ok("restaurant: empty hours row validated", pg.get_by_text("Label required").is_visible())
        pg.reload(wait_until="networkidle")
        ok("restaurant: new category persisted in chosen order", pg.input_value("#cat-1") == "Desserts" and pg.input_value("#cat-2") == "Drinks")
        pg.get_by_role("tab", name="Menu items").click(); pg.get_by_role("button", name="Add dish").first.click()
        pg.get_by_role("dialog").get_by_role("button", name="Save dish").click()
        ok("menu item: validation", pg.get_by_text("Enter a dish name").is_visible())
        pg.fill("#mi-name", "E2E Soup"); pg.fill("#mi-price", "700"); pg.select_option("#mi-cat", label="Mains"); pg.select_option("#mi-diet", "vegetarian")
        pg.get_by_role("dialog").locator("input[type=file]").set_input_files(A); pg.get_by_role("dialog").get_by_role("button", name="Save dish").click()
        ok("menu item: created with image", toast(pg, "Dish added") and pg.get_by_text("E2E Soup").is_visible())
        pg.get_by_role("switch", name="Available: E2E Soup").click(); ok("menu item: availability toggle", toast(pg, "is unavailable"))
        pg.get_by_role("button", name="Edit E2E Soup").click(); pg.fill("#mi-price", "750"); pg.get_by_role("dialog").get_by_role("button", name="Save dish").click()
        ok("menu item: price edited", toast(pg, "Dish updated") and pg.get_by_text("Rs 750").is_visible())
        pg.get_by_role("tab", name="Details & categories").click(); pg.get_by_role("button", name="Remove category 1").click()  # Mains still has the soup
        pg.get_by_role("button", name="Save restaurant details").click()
        ok("restaurant: cannot delete a category that still has dishes", toast(pg, "still has menu items"))
        pg.reload(wait_until="networkidle"); pg.get_by_role("tab", name="Menu items").click()
        pg.get_by_role("button", name="Delete E2E Soup").click(); pg.get_by_role("dialog").get_by_role("button", name="Delete dish").click()
        ok("menu item: deleted", toast(pg, "Dish deleted"))
    restaurant()

    @section
    def gallery():
        nav(pg, "Gallery")
        ok("gallery: empty state", vis(pg.get_by_text("No images here yet")))
        pg.get_by_role("button", name="Upload images").first.click(); pg.get_by_role("dialog").get_by_role("button", name="Upload").click()
        ok("gallery: upload without files is blocked", pg.get_by_text("Choose at least one image").is_visible())
        pg.get_by_role("dialog").locator("input[type=file]").set_input_files([A, Bp]); pg.select_option("#g-cat", "Food"); pg.fill("#g-title", "Dish")
        pg.get_by_role("dialog").get_by_role("button", name="Upload").click()
        ok("gallery: 2 images uploaded", toast(pg, "2 images uploaded") and count(pg.locator("main ul li"), 2))
        ok("gallery: numbered titles", pg.get_by_text("Dish 1").is_visible() and pg.get_by_text("Dish 2").is_visible())
        pg.select_option("#gal-cat", "Rooms"); pg.wait_for_timeout(700); ok("gallery: category filter empty state", pg.get_by_text("No images here yet").is_visible())
        pg.select_option("#gal-cat", ""); pg.wait_for_timeout(600)
        pg.get_by_role("button", name="Edit Dish 1").click(); pg.fill("#g-title", "Soup bowl")
        pg.get_by_role("dialog").locator("input[type=file]").set_input_files(C); pg.get_by_role("dialog").get_by_role("button", name="Save").click()
        ok("gallery: edit title and replace picture", toast(pg, "Image updated") and vis(pg.get_by_text("Soup bowl")))
        pg.get_by_role("switch", name="Featured: Soup bowl").click(); ok("gallery: featured toggle", toast(pg, "featured"))
        pg.get_by_role("button", name="Delete Dish 2").click(); pg.get_by_role("dialog").get_by_role("button", name="Delete image").click()
        ok("gallery: deleted", toast(pg, "Image deleted") and count(pg.locator("main ul li"), 1))
    gallery()

    @section
    def testimonials():
        nav(pg, "Testimonials")
        ok("testimonials: 2 listed", count(pg.locator("main tbody tr"), 2))
        pg.get_by_role("button", name="Add testimonial").first.click(); pg.get_by_role("dialog").get_by_role("button", name="Save").click()
        ok("testimonials: validation", pg.get_by_text("Enter the guest name").is_visible() and pg.get_by_text("Write at least 5 characters").is_visible())
        pg.fill("#t-name", "E2E Guest"); pg.select_option("#t-rating", "4"); pg.fill("#t-review", "Wonderful stay in the mountains.")
        pg.get_by_role("dialog").get_by_role("button", name="Save").click(); ok("testimonials: added", toast(pg, "Testimonial added") and pg.get_by_text("E2E Guest").is_visible())
        pg.get_by_role("switch", name="Published: E2E Guest").click(); ok("testimonials: publish toggle", toast(pg, "Published"))
        pg.get_by_role("button", name="Edit review by E2E Guest").click(); pg.fill("#t-review", "Edited review text for the guest."); pg.get_by_role("dialog").get_by_role("button", name="Save").click()
        ok("testimonials: edited", toast(pg, "Testimonial updated"))
        pg.get_by_role("button", name="Delete review by E2E Guest").click(); pg.get_by_role("dialog").get_by_role("button", name="Delete", exact=True).click()
        ok("testimonials: deleted", toast(pg, "Testimonial deleted"))
    testimonials()

    @section
    def messages():
        nav(pg, "Messages")
        ok("messages: 3 listed, 2 unread", count(pg.locator("main ul > li"), 3) and count(pg.get_by_text("(unread)"), 2))
        pg.select_option("#m-read", "false"); ok("messages: unread-only filter", count(pg.locator("main ul > li"), 2))
        pg.select_option("#m-read", ""); pg.fill("#admin-search", "van"); ok("messages: search", count(pg.locator("main ul > li"), 1))
        pg.locator("main ul > li button").first.click(); ok("messages: opens detail with full text", vis(pg.get_by_role("dialog").get_by_text("We arrive by van")))
        pg.select_option("#msg-status", "replied"); ok("messages: status changed", toast(pg, "Status updated"))
        pg.get_by_role("button", name="Mark unread").click(); ok("messages: mark unread", toast(pg, "Marked unread"))
        pg.get_by_role("button", name="Delete").click(); pg.get_by_role("dialog").last.get_by_role("button", name="Delete", exact=True).click()
        ok("messages: deleted", toast(pg, "Message deleted"))
    messages()

    @section
    def settings():
        nav(pg, "Settings")
        pg.fill("#s-wa", "+92 300"); pg.fill("#s-facebook", "ftp://nope"); pg.get_by_role("button", name="Save settings").click()
        ok("settings: validation for WhatsApp and URL", pg.get_by_text("Digits only with country code").is_visible() and pg.get_by_text("Must start with http").first.is_visible())
        pg.fill("#s-wa", "923001234567"); pg.fill("#s-facebook", "https://facebook.com/shimshalheights"); pg.fill("#s-in", "15:30")
        pg.fill("#s-phones", "+92 300 1234567"); pg.keyboard.press("Enter"); pg.fill("#s-st", "Shimshal Heights | Mountain hotel")
        pg.get_by_role("dialog").count()
        pg.locator("main input[type=file]").set_input_files(A)
        pg.get_by_role("button", name="Save settings").click(); ok("settings: saved", toast(pg, "Settings saved"))
        pg.reload(wait_until="networkidle")
        ok("settings: values persisted after reload", pg.input_value("#s-in") == "15:30" and pg.input_value("#s-wa") == "923001234567" and pg.input_value("#s-facebook") == "https://facebook.com/shimshalheights")
        ok("settings: logo uploaded", pg.get_by_alt_text("Current image").count() == 1)
    settings()

    @section
    def session_expiry():
        pg.goto(B + "/admin", wait_until="networkidle"); ctx.clear_cookies()
        nav_link = pg.get_by_role("navigation", name="Admin").locator("visible=true").get_by_role("link", name="Bookings", exact=True); nav_link.click()
        pg.wait_for_url("**/admin/login**", timeout=8000); ok("expired session: redirected to login", True)
    session_expiry()

    @section
    def logout_flow():
        login(pg, "admin@example.com", "admin-password-123"); pg.wait_for_url("**/admin")
        pg.get_by_role("button", name="Sign out").click(); pg.wait_for_url("**/admin/login")
        pg.goto(B + "/admin/rooms", wait_until="networkidle"); ok("after sign out /admin/rooms redirects to login", "/admin/login" in pg.url)
    logout_flow()

    @section
    def staff():
        sctx = b.new_context(viewport={"width": 1440, "height": 900}); sp = sctx.new_page()
        login(sp, "staff@example.com", "staff-password-123"); sp.wait_for_url("**/admin")
        links = [l.inner_text() for l in sp.get_by_role("navigation", name="Admin").locator("visible=true").get_by_role("link").all()]
        ok("staff: sidebar shows only Dashboard, Bookings, Messages", links == ["Dashboard", "Bookings", "Messages"], str(links))
        sp.goto(B + "/admin/rooms", wait_until="networkidle"); ok("staff: /admin/rooms is blocked with a clear message", sp.get_by_text("Admin access only").is_visible())
        sp.goto(B + "/admin/settings", wait_until="networkidle"); ok("staff: /admin/settings is blocked", sp.get_by_text("Admin access only").is_visible())
        r = sp.request.put(B + "/api/settings", data={"hotelName": "Hacked"}, headers={"Content-Type": "application/json", "Origin": B}); ok("staff: API refuses settings change (403)", r.status == 403, str(r.status))
        sp.goto(B + "/admin/bookings", wait_until="networkidle"); ok("staff: can use bookings", sp.locator("tbody tr").count() >= 1)
        sctx.close()
    staff()

    @section
    def responsive():
        pages = ["/admin", "/admin/bookings", "/admin/rooms", "/admin/rooms/new", "/admin/restaurant", "/admin/gallery", "/admin/testimonials", "/admin/messages", "/admin/settings"]
        for name, (w, h) in {"mobile": (375, 812), "tablet": (768, 1024)}.items():
            c = b.new_context(viewport={"width": w, "height": h}); m = c.new_page()
            m.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
            login(m, "admin@example.com", "admin-password-123"); m.wait_for_url("**/admin")
            bad = []
            for r_ in pages:
                m.goto(B + r_, wait_until="networkidle"); m.wait_for_timeout(300)
                ov = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if ov > 0: bad.append(f"{r_}:{ov}")
            ok(f"{name}: no horizontal page overflow on any admin screen", not bad, str(bad))
            if name == "mobile":
                m.goto(B + "/admin", wait_until="networkidle")
                m.get_by_role("button", name="Open menu").click(); ok("mobile: drawer opens with nav", m.get_by_role("navigation", name="Admin").locator("visible=true").get_by_role("link", name="Bookings").is_visible())
                m.screenshot(path="/tmp/shots/admin-mobile-drawer.png")
                m.keyboard.press("Escape"); ok("mobile: Esc closes drawer", m.get_by_role("button", name="Open menu").is_visible())
                m.goto(B + "/admin", wait_until="networkidle"); m.wait_for_timeout(300); m.screenshot(path="/tmp/shots/admin-mobile-dashboard.png", full_page=True)
                m.goto(B + "/admin/bookings", wait_until="networkidle"); m.screenshot(path="/tmp/shots/admin-mobile-bookings.png", full_page=True)
                m.goto(B + "/admin/rooms/new", wait_until="networkidle"); m.screenshot(path="/tmp/shots/admin-mobile-roomform.png", full_page=True)
            c.close()
    responsive()

    ignore = lambda t: "401" in t or "403" in t or "404" in t or "409" in t or "400" in t or "422" in t or "Failed to load resource" in t
    real = [e for e in errs if not ignore(e[1])]
    ok("no unexpected console/page errors", not real, str(real[:3]))
    b.close()
print("\nFAILED:", fails if fails else "none")
