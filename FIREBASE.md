# Firebase setup

The portfolio now talks to Firebase project **portfoliodatabase-96753**:

| Feature | Firebase product | Where in the code |
| --- | --- | --- |
| Projects, skills, education shown on the home page | Firestore | `src/scripts/hydrate.js`, `src/firebase/api.js` |
| Contact form inbox | Firestore (`contact_messages`) | `src/scripts/contact.js` |
| Blog, comments, view counter | Firestore (`blog_posts`, `blog_posts/{id}/comments`) | `src/blog/` |
| Admin dashboard (`/admin.html`) | Auth + Firestore + Storage | `src/admin/`, `src/firebase/admin-api.js` |
| Blog / editor images | Storage (`blog/`) | `uploadImage()` in `admin-api.js` |

The static site still works without any of this: if Firebase is unreachable, visitors see the content built from `src/data/content.js`.

## Local configuration

`.env` is not committed. After cloning, copy `.env.example` to `.env` and fill in the web config from Firebase console → *Project settings → Your apps*. When you deploy (Vercel, Netlify, Firebase Hosting builds, GitHub Actions) set the same `VITE_*` values as environment variables.

## One-time setup (about 10 minutes, all in the Firebase console)

Everything below is something only the project owner can switch on.

1. **Firestore** — console → *Build → Firestore Database → Create database* (production mode, pick a region). Until this is done every request fails with *"Cloud Firestore API has not been used in project…"*.
2. **Authentication** — *Build → Authentication → Get started*, then enable **Google** (recommended) and/or **Email/Password**. Under *Settings → Authorized domains* add the domain you deploy to.
3. **Storage** (optional, for image uploads) — *Build → Storage → Get started*. New buckets may require the Blaze (pay-as-you-go) plan; without it you can still paste image URLs.
4. **Rules** — paste `firestore.rules` into *Firestore → Rules → Publish* and `storage.rules` into *Storage → Rules → Publish*. Or, with the CLI:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage
   ```

5. **Sign in** at `/admin.html` with the account whose email is `muhammadumera104@gmail.com`, then open *Overview → Seed database* once. That fills Firestore with your projects, skills, education and one sample draft post.

### Why Google sign-in is recommended
The rules only trust a **verified** email equal to the owner's. Google accounts are verified automatically. An Email/Password account is not verified until you click the link in the verification email (the dashboard has a button for it).

### Changing the admin email
Edit it in three places: `VITE_ADMIN_EMAIL` in `.env`, and the `isAdmin()` function in `firestore.rules` and `storage.rules`. The rules are what actually protect the data.

## Security notes

- The Firebase web config in `.env` is public by design. In Google Cloud Console → *APIs & Services → Credentials*, restrict the browser key to your site's domains.
- Visitors can only: read portfolio content and **published** posts, create contact messages and comments (field-checked by the rules), and add exactly +1 to a post's view counter. Everything else needs the owner account.
- Public comments store a name and text only — no email — because comments are readable by everyone.
- There is no server, so there is no rate limiting. If spam appears, turn on **Firebase App Check** and delete comments from the dashboard.
- Contact messages are not emailed to you automatically. They appear in the dashboard inbox. (Email delivery would need Cloud Functions or the "Trigger Email" extension.)

## Collections

| Collection | Important fields |
| --- | --- |
| `projects` | `title, slug, category, kind, status, summary, problem, details[], outcome, techStack[], githubUrl, liveUrl, featured, displayOrder` |
| `skills` | `group, level (practiced / learning / exploring), note, items[], displayOrder` |
| `experiences` | `kind (education / recognition), title, place, period, note, text, displayOrder` |
| `blog_posts` | `title, slug, excerpt, content (HTML), coverImage, tags[], published, authorName, readingTime, views, createdAt` |
| `blog_posts/{id}/comments` | `name, content, createdAt` |
| `contact_messages` | `name, email, subject, message, read, createdAt` |

The three projects whose slugs are `edutrack`, `algovisualizer` and `allocator` update the matching built-in cards in place (their illustrations stay). Any other project appears under **More work**.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build into dist/ (home, blog, post and admin pages)
npm test         # unit tests (Vitest)
npm run lint     # ESLint
```

To deploy to Firebase Hosting: `firebase deploy --only hosting` after `npm run build`.
