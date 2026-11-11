# M. Umer — Portfolio

Personal portfolio of **Muhammad Umer Rizwan** (also known as Umer Lakhani), BSCS student at GU Tech, Karachi.

**Live site: [muhammad-umer-portfolio-rouge.vercel.app](https://muhammad-umer-portfolio-rouge.vercel.app/)** · [Blog](https://muhammad-umer-portfolio-rouge.vercel.app/blog/) · [Projects](https://muhammad-umer-portfolio-rouge.vercel.app/#projects)

A static site built with plain HTML, CSS and JavaScript, using [Vite](https://vite.dev) for the dev server and build. All of the content is rendered into the HTML at build time, so the page works and can be indexed without JavaScript.

> **Firebase backend:** the blog, contact inbox, comments and admin dashboard are powered by Firebase. Follow [FIREBASE.md](FIREBASE.md) once to switch it on. Images and videos use Cloudinary, and emails use SMTP: see *Deploy* below.

## Run it

You need Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Opens on http://localhost:5173 and reloads when you save a file.

```bash
npm run build
```

Creates the finished site in `dist/`.

```bash
npm run preview
```

Serves `dist/` locally so you can check the build.

```bash
npm run lint
```

Checks the JavaScript with ESLint.

## Deploy

The site is built for **Vercel** (static pages in `dist/` plus the serverless functions in `api/`). Pushing to GitHub deploys it, or run `vercel --prod`.

The build uses absolute paths (`base: '/'`) because pages such as `/blog/<slug>/` live in sub-folders. Serve it from a domain root. GitHub Pages in a sub-folder would need `base` changed, and has no `/api` functions.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Where it is used | Secret? |
| --- | --- | --- |
| `VITE_FIREBASE_*`, `VITE_ADMIN_EMAIL` | blog, contact inbox, admin | no (public by design) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | image and video uploads from the dashboard | **API secret: yes** |
| `SMTP_USER`, `SMTP_PASS` | emails: new-message alerts and replies | **password: yes** |
| `VITE_SITE_URL` (optional) | canonical links, sitemap, share previews; set it when you add a custom domain | no |
| `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_BING_SITE_VERIFICATION` (optional) | Google Search Console and Bing Webmaster Tools verification tags | no |
| `VITE_GA_MEASUREMENT_ID` (optional) | Google Analytics 4 (`G-XXXXXXXXXX`); nothing loads without it | no |

Never put secrets in a variable that starts with `VITE_`: those are shipped to every visitor's browser. See `.env.example`.

### Images and videos (Cloudinary)

The dashboard's **Upload** buttons send files straight to Cloudinary. The browser first asks `/api/cloudinary-sign` for a signature, which only works when you are signed in as the owner. The API secret never leaves the server. Cloudinary images are delivered as small WebP/AVIF files automatically.

Each blog post has a **thumbnail** (cover image, or the first video's thumbnail if there is none) and optional **video guides** (YouTube, Vimeo, an uploaded video, or any https `.mp4`/`.webm`). They show as a "Watch & learn" section under the post and as a badge on the blog card. Videos only load from YouTube or Vimeo after a visitor presses play.

### Email

- A visitor's message is saved to the inbox and **emailed to you** (`/api/notify`). Hit reply in Gmail to answer directly, or use the **Reply** button in the dashboard's *Messages* tab.
- Dashboard replies are sent from your address over SMTP (`/api/reply`, owner only) with Reply-To set to you, and the thread is kept on the message.
- Gmail needs an **app password** (Google Account → Security → 2-Step Verification → App passwords), not your normal password.

### Projects

Every project in *More work* has its own page at `/projects/<slug>/` with the description, key features, development process, challenges and solutions, screenshots, a demo video, and links to the live site and GitHub. Sections you leave empty are simply not shown. Fill them in under **Projects** in the dashboard: screenshots take `image link | alt text` (alt text is required) and have an upload button; challenges take `challenge | solution`.

### Search engines (SEO)

Every deploy prerenders the home page, `/blog/`, each published post and each project to plain HTML (so crawlers need no JavaScript) with titles, descriptions, canonical URLs, Open Graph/Twitter tags and schema.org data, and generates `sitemap.xml` and `robots.txt`. Published posts are read from Firestore **at build time**, so a post you publish in the dashboard appears in the sitemap and gets its prerendered page after the next deploy. Until then it still works through the live page. Redeploy after publishing (push any commit, or *Redeploy* in Vercel).

Schema.org data covers the person, website, blog posts (with breadcrumbs), projects (software application or creative work) and the project list. The security headers and a content-security-policy are set in `vercel.json`. A branded 404 page is served for unknown addresses.

Setup after the first deploy: open [Google Search Console](https://search.google.com/search-console), add the site (URL-prefix property), choose the *HTML tag* method and put the code in `VITE_GOOGLE_SITE_VERIFICATION`, redeploy, click *Verify*, then submit `/sitemap.xml` under *Sitemaps*. For Bing, open [Bing Webmaster Tools](https://www.bing.com/webmasters), import the site from Search Console (or use the meta-tag method with `VITE_BING_SITE_VERIFICATION`) and submit the same sitemap.

No site can be guaranteed a top Google ranking. What helps most: submit the sitemap in [Google Search Console](https://search.google.com/search-console), use your own domain, publish posts regularly, and link to the site from your GitHub and LinkedIn profiles.

## Project structure

```
index.html              <head>, metadata, theme bootstrap; the body is injected at <!--app-->
vite.config.js          tiny plugin that renders src/render/ into index.html
public/                 copied as-is: favicon.svg, og-image.png, images/
src/
  data/content.js       ← ALL text, links, skills, projects, education
  render/               functions that turn content.js into HTML
    sections/           header, hero, about + skills, projects, closing (approach, education, contact, footer)
    visuals.js          project figures (diagram, pathfinder, heap) and hover thumbnails
    util.js             helpers: escaping, arrows, section headings
  styles/
    tokens.css          ← colours, fonts, type scale, spacing, motion timing
    base.css            reset, typography, utilities
    layout.css          header, mobile menu, sections, footer
    components.css      buttons, chips, segmented controls, ticker, terminal, form fields
    sections.css        each page section
    motion.css          intro panel and pre-animation states
    print.css           reduced-motion rules and the printable CV
  scripts/
    motion.js           GSAP intro, reveals, parallax, word cycle, hover preview
    nav.js              header state, scroll progress, active links, mobile menu
    theme.js            light/dark toggle (saved in localStorage)
    terminal.js         the console in About
    pathfinder.js       BFS / Dijkstra / A* demo
    heap.js             memory allocator demo
    contact.js          form validation + mailto
  main.js               imports styles and starts each feature
```

## Customising

### Text, links, skills, projects

Edit **`src/data/content.js`**. Everything on the page comes from it, including the nav, hero, About facts, skill rows and their levels (`practiced`, `learning`, `exploring`), the ticker, projects, education, recognition and contact copy. The terminal answers from the same data, so it stays in sync.

- To add a project, copy an entry in `projects`. Set `visual` to one of `edutrack`, `pathfinder` or `heap`, or add a new figure in `src/render/visuals.js` and a matching caption in `src/render/sections/projects.js`.
- Set `repo` and `demo` to real URLs when they exist. A `null` demo shows "Live demo not published".

### Portrait

1. Put the photo in `public/images/`, for example `public/images/umer-rizwan.jpg`. A 600 × 720 px JPG or WebP under 150 KB is enough.
2. In `content.js`, set `profile.portrait: 'images/umer-rizwan.jpg'` and check `portraitAlt`.

It then appears at the top of the About section.

### Colours and fonts

Open **`src/styles/tokens.css`**.

- `--vermilion` is the accent. If you change it, keep `--vermilion-ink` dark enough for small text on the paper background (at least 4.5:1).
- `--paper`, `--ink`, `--stone` set the light theme. The `:root[data-theme='dark']` block sets the dark theme.
- Fonts are installed locally with npm (`@fontsource-variable/dm-sans` and `@fontsource/instrument-serif`) and imported at the top of `src/main.js`. To swap a font, install another Fontsource package, change the import, and update `--font-sans` or `--font-serif`.
- Type sizes use `clamp()` in `--fs-*`, and spacing uses `--s-*`.

### Animation

- Timing and easing tokens are in `tokens.css` (`--dur-*`, `--ease-*`), mirrored at the top of `src/scripts/motion.js`.
- The intro plays once per browser session and only when the page opens at the top. To turn it off, return `false` at the start of `shouldPlayIntro()` in `motion.js`.
- Anything with `data-reveal` fades up on scroll, and headings built with `heading()` reveal line by line.
- With "reduce motion" turned on in the operating system, all of this is skipped and content shows immediately.

### Résumé / CV

The **Save CV as PDF** button prints the page with `print.css`. This hides the decorative and interactive parts and lays the content out as a CV. Edit `print.css` to change what is included.

## Libraries

| Package | Why |
| --- | --- |
| `gsap` (+ ScrollTrigger) | Intro timeline, line reveals, scroll-linked parallax. Free for all use since 3.13. |
| `@fontsource-variable/dm-sans`, `@fontsource/instrument-serif` | Self-hosted fonts; no requests to Google. |
| `vite` (dev) | Dev server and production build. |
| `eslint`, `@eslint/js`, `globals` (dev) | Linting. |

Magic UI, Smooth UI, Unlumen UI and RetroUI were considered. All four are React + Tailwind (shadcn-style) component registries, and this site has no React. The patterns that fit (marquee, line reveals, terminal, subtle grid) are written here in a few lines of CSS and JavaScript instead.

## Notes

- The contact form validates the message, saves it to the Firestore inbox and emails a copy to the owner. If saving fails it falls back to opening the visitor's email app with the message filled in.
- `npm run dev` serves the pages only. To run the `/api` functions locally (uploads, email) use `vercel dev`.
- The pathfinder and heap demos are JavaScript sketches written for this page. Their captions say so: the original projects are in Python and C.
