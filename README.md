# DataObjects Marketing Website

Static site for **dataobjects.com**, hosted on Cloudflare Pages.

---

## Structure

```
do-website/
├── index.html              ← home page
├── demo.html               ← /demo (stub — needs Turnstile + do-server endpoint)
├── do.css                  ← all styles
├── do.js                   ← include loader + form handler + scroll reveal
├── _partials/              ← reusable HTML fragments (like cfinclude)
│   ├── nav.html
│   ├── footer.html
│   ├── notify.html
│   └── coming-soon.html
├── images/                 ← drop do_white.svg and any other images here
├── _redirects              ← Cloudflare Pages redirect rules
└── README.md               ← you are here
```

## How the include system works

Drop a placeholder anywhere in any HTML file:

```html
<div data-include="/_partials/nav.html"></div>
```

On page load, `do.js` fetches the partial and replaces the `<div>` with its
contents. No build step. No framework. Edit a partial → refresh → done.

The body is hidden (opacity 0) until all partials load to prevent flash.

## Adding a new page

1. Copy `index.html` to your new file (e.g. `pricing.html`)
2. Keep the `<head>`, `<script>`, and the nav/footer `<div data-include>` lines
3. Replace the body content
4. Push — Cloudflare Pages auto-deploys

## Adding a partial

1. Create `_partials/your-partial.html` (just the HTML fragment, no `<html>` or
   `<body>` tags)
2. Reference it in any page: `<div data-include="/_partials/your-partial.html"></div>`

## Local preview

Any static server works. Easiest:

```bash
cd do-website
python3 -m http.server 8000
# open http://localhost:8000
```

Or `npx serve` if you have Node installed.

**Important:** opening `index.html` directly via `file://` will NOT work — the
fetch() calls for partials need a real HTTP server. Use a local server during
development.

## Deploy to Cloudflare Pages

### One-time setup

1. Push this folder to a new GitHub repo (e.g. `DataObjectsAdmin/do-website`)
2. In Cloudflare dashboard → Workers & Pages → Create → Connect to Git
3. Pick the repo, branch `main`
4. Build settings:
   - Build command: *(leave empty)*
   - Build output directory: `/` *(root)*
   - Root directory: *(leave empty)*
5. Save and deploy

### Custom domain

After first deploy:

1. Cloudflare Pages → your project → Custom domains
2. Add `dataobjects.com` and `www.dataobjects.com`
3. Cloudflare handles SSL automatically

### Ongoing

Every `git push` to `main` triggers an automatic deploy. Same flow as the
`do-dev` and `do-app` repos.

## What still needs to be built

### Demo flow (high priority)
The `/demo.html` page is a stub. To finish the demo experience:

1. **Add a new endpoint to `do-server`** — `POST /v6/demo/request`
   - Accepts `{ email, turnstileToken }`
   - Verifies Turnstile with Cloudflare
   - Inserts into `DO.leads` (new table — see notes)
   - Creates/finds a `DO.users` row for that email
   - Inserts into `DO.user_apps` with `ua_role: 'guest'`,
     `ua_permissions: '{"bypass_2fa": true, "read_only": true}'`,
     and the Makai app GUID
   - Mints a `link` token via existing `storeToken()`
   - Returns `{ status: 'ok', loginUrl: 'https://app.dataobjects.com/?app=…&token=…' }`

2. **Add Turnstile to `/demo.html`**
   - Get a site key from Cloudflare Dashboard → Turnstile
   - Drop in the Turnstile script + widget
   - Pass the token to the server endpoint

3. **Server-side write blocker for guest role**
   - Middleware on all `/v6/dev/data/*` and `/v6/records/*` write routes
   - If `req.user.role === 'guest'`, return 403 on POST/PUT/DELETE

### Other endpoints
- `POST /v6/leads` — for the early-access form on the home page.
  Just inserts email into `DO.leads` and triggers a Brevo welcome.

### Content
- Real videos on the `#videos` section (currently placeholder cards)
- Real screenshots on the `#apps` section (currently text thumbs)
- A YouTube channel claim at `youtube.com/@DataObjects`
- The `do_white.svg` logo file in `/images/` (copy from the old CFM site)
- Real pricing numbers (currently `$—` placeholders)
