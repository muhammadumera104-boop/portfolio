# M. Umer — Portfolio

Personal portfolio of **Muhammad Umer Rizwan**, BSCS student at GU Tech, Karachi.

A static site built with plain HTML, CSS and JavaScript, using [Vite](https://vite.dev) for the dev server and build. All of the content is rendered into the HTML at build time, so the page works and can be indexed without JavaScript.

> **Firebase backend:** the blog, contact inbox, comments and admin dashboard are powered by Firebase. Follow [FIREBASE.md](FIREBASE.md) once to switch it on.

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

`dist/` is a plain static folder, so any static host works. The build uses relative paths (`base: './'`), so it also works from a sub-folder, such as GitHub Pages.

- **Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, output folder `dist`.
- **GitHub Pages:** run `npm run build` and publish the contents of `dist/` (for example with the `actions/deploy-pages` workflow).

After you have a domain, make the share image URL absolute in `index.html` (for example `content="https://your-domain/og-image.png"`). Some social sites ignore relative image URLs. You can also add `<link rel="canonical" href="https://your-domain/">` then.

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

- The contact form has no server. It validates the message and opens the visitor's email app with it filled in. Nothing is sent until they press send there.
- The pathfinder and heap demos are JavaScript sketches written for this page. Their captions say so: the original projects are in Python and C.
