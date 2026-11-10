# The Bridge: Website

Node/Express build of **Design A (Corporate Clarity)** from the Claude Design canvas "The Bridge: Website Samples".

## Run locally

```bash
npm install
cp .env.example .env   # then fill in SMTP details to email enquiries
npm start              # or: npm run dev  (restarts on file changes)
```

Open http://localhost:3000

## Pages

| URL | Content |
| --- | --- |
| `/` | Hero, organisations supported, the workforce challenge, services overview, process, why partner, enquiry form |
| `/services` | The three services in detail, business-partner extras, proposal call to action |
| `/about` | Who we are, why partner with us, process, industries |
| `/contact` | Contact details, what happens next, enquiry form (`/contact?service=recruitment` pre-selects a service) |
| `/privacy` | Privacy policy covering the enquiry form |
| `/sitemap.xml`, `/robots.txt` | For search engines |

## Editing content

All text, services, clients, industries and contact details are in **`site.js`**. Add client names to `clients` as they agree to be listed.

- **Team:** members are listed under `team` and shown in “Meet the team” on the About page, in that order. Each needs `name`, `role`, `focus`, a `bio` (a list of paragraphs, 150 to 165 words in total) and a square `photo` in `public/images/`; `credentials` is optional. Rows alternate automatically, photo left then photo right; on phones the photo sits above the profile.
- **Company registration:** RC number and registration details are under `registration`. The certificate itself is deliberately not published on the site.

## Enquiry form

Posts to `/contact`. With `SMTP_HOST` set, each enquiry is emailed to `MAIL_TO` with the enquirer as reply-to; without it, enquiries are printed to the server console. It has validation on both browser and server, a hidden spam trap, and a limit of 5 enquiries per visitor per 15 minutes. It also works with JavaScript switched off.

## Animations

Page heroes animate in on load; sections, cards and process steps fade up as they scroll into view; photos zoom gently on hover. Animations switch off automatically for visitors who have reduced motion enabled, and all content stays visible if JavaScript is unavailable. Styles are in the “Motion” block at the end of `styles.css`.

## Going live

1. Set `NODE_ENV=production`, `SITE_URL` (e.g. `https://thebridge.example`) and the SMTP values on the host.
2. Run `npm install --omit=dev && npm start` behind HTTPS (Render, Railway, a VPS with Nginx, etc.).
3. Have the client review `/privacy` before launch.

## Structure

```
server.js                Express app: routes, security headers, enquiry handling
site.js                  All site copy and contact details
views/                   EJS templates (pages + partials/)
public/css/styles.css    Styles; design tokens at the top
public/js/main.js        Mobile menu, header shadow, scroll animations, form validation and submission
public/js/motion-flag.js Turns animations on before first paint (skipped for reduced-motion users)
public/fonts/            Self-hosted Montserrat and DM Sans (SIL Open Font License)
public/images/           Logos, icons and photography from the design
```

## Search engine optimisation

- **Service pages** live at `/services/recruitment`, `/services/hr-outsourcing` and `/services/training`. Their wording, page titles, meta descriptions and FAQs are in `content/services.js`.
- **Insights articles** (switched off for now: set `features.insights` to `true` in `site.js` to show them) live at `/insights/<slug>`. Add or edit articles in `content/insights.js` (newest first). Each new article is added to the sitemap, the Insights page and the home page automatically.
- **Structured data** (schema.org JSON-LD) is generated in `server.js`: the business, website, breadcrumbs, services, FAQs, team members and articles.
- **Sitemap** at `/sitemap.xml` uses `site.updated` (in `site.js`) and article dates as `lastmod`. Update `site.updated` when page content changes.
- **Images** are served as WebP with a JPG fallback. When adding a new photo, also save a `.webp` copy with the same name next to it.
- **Sharing image** is `public/images/og-image.jpg` (1200 × 630).
- Error pages are marked `noindex`.
- **Regions served**: the business is based in Nigeria and serves clients across Africa and worldwide. Change `seo.reach` and `seo.areaServed` in `site.js` if that changes.
