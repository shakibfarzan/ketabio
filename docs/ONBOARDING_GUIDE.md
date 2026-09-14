# Ketabio — Onboarding Guide

This document is the deep-dive companion to the root [README](../README.md). Use it to:

- get a new contributor productive quickly
- understand what is finished, what is stubbed, and what still needs work

Last reviewed against the repository as of the `fix: update readme` baseline.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Tech stack](#2-tech-stack)
3. [Repository map](#3-repository-map)
4. [Local setup](#4-local-setup)
5. [Environment variables](#5-environment-variables)
6. [Architecture](#6-architecture)
7. [Authentication and authorization](#7-authentication-and-authorization)
8. [Internationalization and theming](#8-internationalization-and-theming)
9. [Database and domain model](#9-database-and-domain-model)
10. [File storage (Pinata)](#10-file-storage-pinata)
11. [Admin book workflow](#11-admin-book-workflow)
12. [UI system](#12-ui-system)
13. [PWA](#13-pwa)
14. [Commands cheat sheet](#14-commands-cheat-sheet)
15. [Current status and known gaps](#15-current-status-and-known-gaps)
16. [Interview talking points](#16-interview-talking-points)
17. [Suggested first tasks](#17-suggested-first-tasks)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Product overview

**Ketabio** (کتابیو) is a bilingual digital-library web application. The product vision is:

- a public marketing/landing experience for visitors
- authenticated **members** who browse, borrow, shelf, review, and track reading progress
- **admins** who manage the book catalog (create/edit books, covers, files, metadata)

The UI and copy support **English** and **Persian (Farsi)**, including full **RTL** layout when Persian is active.

Today the landing page, auth shell, localization, theme, database schema, and admin book **form UI** are in place. End-to-end catalog CRUD, member library features, and several admin flows are still incomplete.

---

## 2. Tech stack

| Layer        | Choice                                                  | Notes                                             |
| ------------ | ------------------------------------------------------- | ------------------------------------------------- |
| Framework    | **Next.js 16** (App Router)                             | React Server Components by default                |
| UI           | **React 19**, **Tailwind CSS 4**, **shadcn/ui** (Radix) | Path alias `@/*`                                  |
| Language     | **TypeScript** (strict)                                 | `tsconfig.json` paths map `@/*` → project root    |
| Auth         | **Clerk** (`@clerk/nextjs`)                             | Hosted sign-in/up, webhooks via Svix              |
| i18n         | **next-intl**                                           | Cookie-based locale (`en` / `fa`), not path-based |
| Theme        | **next-themes**                                         | Light / dark / system                             |
| Database     | **PostgreSQL** (Neon serverless)                        | `@neondatabase/serverless`                        |
| ORM          | **Drizzle ORM** + **drizzle-kit**                       | Schema in `db/schema.ts`, SQL under `drizzle/`    |
| Validation   | **Zod** + **react-hook-form**                           | Book form schema in `lib/validators/`             |
| File storage | **Pinata** (IPFS gateway)                               | JWT + public gateway URL                          |
| PWA          | **next-pwa**                                            | Disabled in development                           |
| Fonts        | **Poppins** (EN), **Vazirmatn** (FA)                    | Loaded via `next/font/google`                     |

Node.js **20.9+** and npm are required.

---

## 3. Repository map

```text
ketabio/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Clerk catch-all auth pages
│   │   ├── login/[[...login]]/
│   │   └── sign-up/[[...sign-up]]/
│   ├── (site)/                   # Public landing route group
│   │   └── page.tsx
│   ├── _components/              # Landing-page sections (1st–5th)
│   ├── admin/                    # Admin area (auth-protected)
│   │   ├── page.tsx              # Redirects → /admin/books
│   │   └── books/
│   │       ├── page.tsx          # List placeholder
│   │       ├── add/page.tsx      # Add book (form wired)
│   │       ├── edit/[slug]/      # Edit stub
│   │       ├── actions.ts        # Server actions (stub)
│   │       └── _components/      # BookForm, top section
│   ├── api/webhooks/clerk/       # user.created / user.deleted
│   ├── layout.tsx                # Root: Clerk, i18n, theme, nav, footer
│   ├── globals.css
│   └── manifest.json
├── components/                   # Shared UI
│   ├── navbar/, footer/
│   ├── form/                     # RHF-connected field wrappers
│   ├── ui/                       # shadcn primitives
│   └── file-uploader.tsx
├── constants/routes.ts           # Central route constants
├── db/
│   ├── schema.ts                 # Tables, enums, ROLES
│   ├── index.ts                  # Drizzle + Neon client
│   ├── books.ts                  # createBook helper
│   └── users.ts                  # User type
├── drizzle/                      # Generated migrations
├── hooks/useLanguages.ts         # REST Countries language list
├── i18n/request.ts               # next-intl request config
├── lib/
│   ├── utils.ts                  # cn() helper
│   └── validators/book.schema.ts
├── messages/en.json, fa.json
├── providers/                    # ThemeProvider, UserProvider
├── utils/
│   ├── auth.ts                   # getOrCreateUser
│   ├── config-files.ts           # Pinata SDK + uploadFile
│   ├── slugify.ts
│   ├── client-cookies.ts
│   └── safe-promise.ts
├── proxy.ts                      # Clerk middleware (public route matcher)
├── drizzle.config.ts
├── next.config.ts                # next-intl + PWA + remote images
└── docs/                         # This guide
```

**Route groups** `(auth)` and `(site)` do not appear in the URL. They only organize the file tree.

**Note on middleware:** Clerk protection lives in `proxy.ts` at the repo root (public routes: `/`, `/login(.*)`, `/sign-up(.*)`). Everything else requires a signed-in session via `auth.protect()`.

---

## 4. Local setup

### Prerequisites

- Node.js 20.9 or newer
- npm
- A **PostgreSQL** database (Neon is the intended host)
- A **Clerk** application (with a webhook endpoint for local/prod)
- A **Pinata** account (JWT + gateway) if you will upload covers/files

### Steps

```bash
git clone https://github.com/shakibfarzan/ketabio.git
cd ketabio
npm install
```

Create a `.env` (or `.env.local`) at the project root with the variables in [§5](#5-environment-variables).

Apply the schema:

```bash
npm run migrate
```

The `migrate` script runs `drizzle-kit generate`, `migrate`, and `push` in sequence (via `&` in `package.json` — see [known gaps](#15-current-status-and-known-gaps) if that behaves oddly on your shell).

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clerk webhook (local)

For `user.created` / `user.deleted` sync:

1. Expose the app (e.g. Clerk’s tunnel, ngrok, or a deployed preview).
2. Point a Clerk webhook at `POST /api/webhooks/clerk`.
3. Subscribe to `user.created` and `user.deleted`.
4. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.

Even without the webhook, signed-in users can still be upserted on request via `getOrCreateUser()` (see [§7](#7-authentication-and-authorization)).

---

## 5. Environment variables

Never commit real credentials. `.env*` is gitignored.

| Variable                            | Required | Purpose                                                                      |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Yes      | Neon/Postgres connection string for Drizzle                                  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk browser SDK                                                            |
| `CLERK_SECRET_KEY`                  | Yes      | Clerk server SDK                                                             |
| `CLERK_WEBHOOK_SECRET`              | Yes\*    | Svix verification on `/api/webhooks/clerk` (\*needed when webhooks are used) |
| `PINATA_JWT`                        | Yes\*    | Pinata uploads (\*needed for cover/file upload)                              |
| `NEXT_PUBLIC_GATEWAY_URL`           | Yes\*    | Pinata gateway host used by the SDK and Next image config                    |

`next.config.ts` currently allowlists a specific Pinata gateway hostname for `next/image` remote patterns. If your gateway differs, update that hostname to match `NEXT_PUBLIC_GATEWAY_URL`.

Example skeleton:

```dotenv
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
PINATA_JWT=...
NEXT_PUBLIC_GATEWAY_URL=your-gateway.mypinata.cloud
```

---

## 6. Architecture

### High-level request flow

```text
Browser
  │
  ├─ static assets / PWA cache (production)
  │
  ▼
proxy.ts (clerkMiddleware)
  │  public: /, /login, /sign-up
  │  else: auth.protect()
  ▼
app/layout.tsx
  │  cookies → locale (en|fa)
  │  ClerkProvider (enUS | faIR)
  │  html lang + dir (ltr|rtl) + font
  │  NextIntlClientProvider
  │  ThemeProvider
  │  Navbar (getOrCreateUser → role-aware links)
  │  {children}
  │  Footer
  ▼
Route handlers / RSC pages / client islands
  │
  ├─ db/  (Drizzle → Neon)
  ├─ utils/config-files.ts (Pinata)
  └─ app/api/webhooks/clerk (Svix → users table)
```

### Design patterns in use

| Pattern                   | Where                             | Why                                                    |
| ------------------------- | --------------------------------- | ------------------------------------------------------ |
| App Router RSC by default | `app/**`                          | Less client JS; server data access                     |
| Route groups              | `(auth)`, `(site)`                | Organize without URL segments                          |
| Server actions (intended) | `app/admin/books/actions.ts`      | Mutations next to admin UI (currently empty stub)      |
| Cookie-based locale       | `i18n/request.ts`, `SwitchLocale` | Simple EN/FA switch without `/en` `/fa` prefixes       |
| Dual user sync            | Webhook + `getOrCreateUser`       | Webhook for lifecycle; on-demand upsert for resilience |
| Domain helpers            | `db/books.ts`, `utils/*`          | Keep pages thin; reusable insert/slug logic            |
| Form field adapters       | `components/form/*`               | Shared RHF + labels + i18n error messages              |
| Central routes            | `constants/routes.ts`             | Avoid magic path strings                               |

### Data flow for “create book” (target design)

The UI and DB helper exist; the server action wiring is not finished. Intended path:

1. Admin opens `/admin/books/add`.
2. `BookForm` (client) validates with Zod (`bookFormSchema`).
3. On submit, a server action should:
   - upload `coverImage` and `bookFile` via `uploadFile()` (Pinata)
   - map form fields to `createBook()` input
   - insert `books`, `book_categories`, `book_files`
4. Redirect to books list or edit page.

Today step 3 only `console.log`s values in the client form, and `createBookAction` is an empty async function.

---

## 7. Authentication and authorization

### Clerk integration

- **UI:** `<SignIn />` and `<SignUp />` on catch-all routes under `app/(auth)/`.
- **Shell:** `ClerkProvider` in root layout with locale-aware Clerk localizations (`enUS` / `faIR`) and shadcn appearance on auth widgets / `UserButton`.
- **Middleware:** `proxy.ts` marks only landing + auth routes public; all other matched routes call `auth.protect()`.

### App user record

Clerk owns identity. Ketabio stores an application user in Postgres (`users` table) keyed by **Clerk user id** (`text` primary key).

**Webhook** (`app/api/webhooks/clerk/route.ts`):

- Verifies payload with Svix (`CLERK_WEBHOOK_SECRET`)
- `user.created` → insert member
- `user.deleted` → delete local user

**On-demand sync** (`utils/auth.ts` → `getOrCreateUser`):

- Reads Clerk `auth()` + `currentUser()`
- If DB row exists → update email/name/avatar from Clerk
- If missing → insert with `role: 'member'`
- Used by Navbar and landing page (and available for any server component)

### Roles

```ts
// db/schema.ts
export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// Postgres enum user_role: 'member' | 'admin' (default member)
```

**Role checks in the app today:**

- Landing page: if `user.role === admin` → redirect to `/admin/books`
- Navbar: admins see books management link; home link hidden for admins

**Important gap:** there is **no server-side admin gate** on `/admin/*` beyond “must be signed in.” Any authenticated member who knows the URL can open the admin UI. Promoting a user to admin is currently a **manual DB update** (no admin UI for roles). Interview-ready follow-up: add `requireAdmin()` in admin layouts/actions.

---

## 8. Internationalization and theming

### Locale

- Stored in cookie `locale` (`en` default, or `fa`)
- Set client-side by `components/navbar/switch-locale.tsx` via `setCookie`, then full page reload
- `i18n/request.ts` loads `messages/{locale}.json` for next-intl
- Root layout sets `lang`, `dir` (`rtl` for Persian), and font class (Vazirmatn vs Poppins)
- Clerk UI localization tracks the same cookie

Messages live in:

- `messages/en.json`
- `messages/fa.json`

Namespaces in use include `General`, `LandingPage`, `Footer`, `Forms`, `BookForm`.

### Theme

- `providers/theme-provider.tsx` wraps `next-themes`
- Root layout: `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- Navbar `ModeToggle` switches light / dark / system
- Brand logos swap for dark mode (`ketabio.png` / `ketabio-light.png`)

### RTL considerations

When discussing the app: layout direction flips globally via `dir="rtl"`. Components should prefer logical CSS and flex that works both ways; test both locales when changing navbar, forms, and landing sections.

---

## 9. Database and domain model

### Connection

```ts
// db/index.ts
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

Uses Neon’s HTTP driver (`drizzle-orm/neon-http`) — good for serverless, not a persistent pooled TCP socket.

### Entity relationship (conceptual)

```text
users (Clerk id)
  ├── shelves ── shelf_books ── books
  ├── favorites ─────────────── books
  ├── reading_progress ──────── books
  └── reviews ───────────────── books

authors 1──* books
categories *──* books (book_categories)
books 1──* book_files   (format: pdf | epub | mobi | audio)
```

### Tables (from `db/schema.ts`)

| Table                     | Purpose                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `users`                   | App profile + `role`                                                                                   |
| `authors`                 | Book authors                                                                                           |
| `categories`              | Taxonomy (`name`, `slug`)                                                                              |
| `books`                   | Catalog core (`title`, `slug`, `description`, cover, language, pages, ISBN, `publishedAt`, `authorId`) |
| `book_files`              | Downloadable assets per format                                                                         |
| `book_categories`         | M2M books ↔ categories                                                                                 |
| `shelves` / `shelf_books` | Member custom shelves                                                                                  |
| `reading_progress`        | Page / percent tracking                                                                                |
| `reviews`                 | Rating + optional content                                                                              |
| `favorites`               | M2M user ↔ book                                                                                        |

### Migrations

- Config: `drizzle.config.ts` → schema `./db/schema.ts`, out `./drizzle`
- Existing SQL:
  - `0000_purple_guardsmen.sql` — initial domain
  - `0001_futuristic_red_wolf.sql` — `book_format` enum + `book_files`

**Schema drift to be aware of:** migration `0001` historically typed `book_files.book_id` as `integer` while `books.id` is `uuid` and the TypeScript schema uses `uuid` with `onDelete: 'cascade'`. Fresh `push` from the TS schema is the source of truth for new environments; verify live DB types if an older migrate-only path was used.

### Book creation helper

`db/books.ts` → `createBook`:

1. `slugify(title)`; if slug taken, append `-1`, `-2`, …
2. Insert book row
3. Insert category join rows from `categoriesIds`
4. Insert `bookFiles` rows with the new `bookId`

Slug utility (`utils/slugify.ts`) lowercases, strips non-word characters, and collapses whitespace to hyphens. **Persian titles may slug poorly** (non-Latin letters stripped) — a known product/tech risk.

---

## 10. File storage (Pinata)

```ts
// utils/config-files.ts  ('server only')
export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

export const uploadFile = async (file: File) => {
  const { cid } = await pinata.upload.public.file(file);
  return pinata.gateways.public.convert(cid); // public URL
};
```

- Intended for **cover images** and **book binaries** (PDF today in the form accept list)
- Client `FileUploader` only holds `File` objects in form state; upload must happen on the server
- Next.js image remote pattern must allow the gateway host

---

## 11. Admin book workflow

### Routes (`constants/routes.ts`)

| Constant                | Path                       | Status                     |
| ----------------------- | -------------------------- | -------------------------- |
| `ADMIN.BASE`            | `/admin`                   | Redirects to books         |
| `ADMIN.BOOKS`           | `/admin/books`             | Placeholder body (`Hello`) |
| `ADMIN.ADD_BOOK`        | `/admin/books/add`         | Renders `BookForm`         |
| `ADMIN.EDIT_BOOK(slug)` | `/admin/books/edit/[slug]` | Empty stub                 |

### Book form (`app/admin/books/_components/book-form.tsx`)

Client component using:

- `react-hook-form` + `zodResolver(bookFormSchema(t))`
- Fields: title, author, description, category, language, ISBN, publishedAt, pageCount, coverImage, bookFile
- Shared form controls under `components/form/*`
- Languages loaded client-side from REST Countries (`hooks/useLanguages.ts`)
- Author and category options are **hardcoded placeholders**, not DB-backed
- Submit handler logs values only

### Validation (`lib/validators/book.schema.ts`)

Zod object with i18n error messages from the `Forms` namespace. Cover and book file are required `z.file()` values. Language is optional string array (UI uses single-select multi-select component with `isMultiSelect={false}`).

### Server action stub

```ts
// app/admin/books/actions.ts
'use server';
export const createBookAction = async () => {};
```

Wire this to validation, Pinata upload, and `createBook` as the primary vertical slice for finishing admin create.

---

## 12. UI system

- **shadcn** config: `components.json` (style `radix-vega`, RSC, TSX)
- Primitives under `components/ui/*` (button, card, dialog, select, multi-select, calendar, etc.)
- Layout helpers: `Container`, `TopSection`, `LoadingPage`
- Landing composed of five sections under `app/_components/`
- Forms pattern: thin wrappers that take RHF `control` + `name` + label/placeholder from next-intl

Styling: Tailwind 4 + CSS variables in `app/globals.css` for theming.

---

## 13. PWA

Configured in `next.config.ts` via `next-pwa`:

- Output dest: `public`
- `register: true`, `skipWaiting: true`
- **Disabled when `NODE_ENV === 'development'`**
- Runtime caching for static assets (CacheFirst, 30-day expiration)
- Web manifest: `app/manifest.json` (name Ketabio, standalone display, maskable icons in `public/`)

Root metadata references `manifest: '/manifest.webmanifest'` (Next may emit from `app/manifest.json`).

---

## 14. Commands cheat sheet

| Command           | Purpose                               |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Next.js development server            |
| `npm run build`   | Production build + typecheck          |
| `npm run start`   | Serve production build                |
| `npm run lint`    | ESLint                                |
| `npm run format`  | Prettier write across repo            |
| `npm run migrate` | drizzle-kit generate & migrate & push |

---

## 15. Current status and known gaps

### Done (usable foundations)

- [x] Marketing landing (5 sections), navbar, footer
- [x] Clerk sign-in / sign-up UI + middleware protection
- [x] Clerk webhook skeleton for user create/delete
- [x] `getOrCreateUser` sync path
- [x] EN/FA messages, RTL, fonts, Clerk locale
- [x] Dark / light / system theme
- [x] Drizzle schema for full library domain
- [x] Migrations folder with two generations
- [x] Admin shell + add-book form UI + Zod schema
- [x] `createBook` DB helper + slugify
- [x] Pinata helper
- [x] PWA + manifest scaffolding
- [x] File dropzone component

### Incomplete or stubbed

- [ ] `createBookAction` and form submit → DB/Pinata
- [ ] Admin books **list** (query, table, pagination, search)
- [ ] Admin book **edit** page and update/delete actions
- [ ] Author/category management UIs (form uses fake options)
- [ ] Admin **authorization** (role check on routes/actions)
- [ ] Member catalog browse, detail, borrow flows
- [ ] Shelves, favorites, reviews, reading progress **features** (tables only)
- [ ] `UserProvider` exists but is not wired into the root tree
- [ ] Nav links for Categories / About still point at `/`
- [ ] Featured books on landing are static UI, not DB-driven
- [ ] Webhook does not handle `user.updated`
- [ ] Possible `book_files.book_id` type mismatch in older SQL migration
- [ ] `slugify` weak for non-Latin titles
- [ ] `npm run migrate` uses `&` (background) rather than `&&` (sequential) — prefer fixing to `&&` for reliability
- [ ] `utils/config-files.ts` starts with `'server only'` string (convention is usually `import 'server-only'` package)
- [ ] Layout imports `ROLES` / `getOrCreateUser` patterns inconsistently (navbar does the user fetch; unused imports may exist in layout depending on revision)

### Product vs schema

The schema already anticipates a richer product (shelves, progress, reviews, multi-format files). Treat schema as the **north star**, not as proof those features ship.

---

## 16. Interview talking points

Use these to explain the project clearly in interviews.

### Elevator pitch (30 seconds)

> Ketabio is a bilingual digital library built with Next.js App Router. Members will browse and organize books; admins manage the catalog. We use Clerk for auth, Drizzle on Neon for Postgres, Pinata for file storage, and next-intl for English/Persian including RTL.

### Why this stack?

- **Next.js App Router:** server components for auth-aware shells and less client bundle; route groups for structure; server actions as the planned mutation layer.
- **Clerk:** faster, safer auth than hand-rolled sessions; localizations and shadcn themes fit the UI; webhooks keep the app DB in sync.
- **Drizzle + Neon:** typed schema colocated with TS; serverless-friendly HTTP driver; explicit SQL migrations.
- **Cookie locale instead of `/[locale]`:** fewer duplicated route trees; trade-off is full reload on language switch and no locale in the URL for SEO sharing.
- **Pinata:** simple public file URLs for covers and book binaries without operating object storage yourself.

### Auth model (good whiteboard topic)

1. Middleware enforces authentication boundary.
2. Clerk remains source of truth for identity.
3. App DB stores role and profile fields needed for joins.
4. Dual write paths: webhook (event-driven) + `getOrCreateUser` (lazy repair if webhook missed).
5. Authorization (admin vs member) is separate from authentication — and currently under-implemented on the server.

### Consistency and integrity

- Unique book slugs with collision loop in `createBook`
- Cascade delete on `book_files` when a book is removed (schema intent)
- Composite PKs on join tables (`book_categories`, `favorites`, `shelf_books`)

### i18n / RTL (strong differentiator)

- Single codebase serves LTR and RTL
- Message catalogs keep copy out of components
- Font switching (Poppins vs Vazirmatn) tied to locale
- Forms receive translator function into Zod so validation errors are localized

### Honest limitations (interview maturity)

Call out gaps deliberately:

- Admin UI is not role-hardened on the server
- Create-book path is UI + DB helper without the connecting server action
- Member features are schema-only
- External language list adds runtime dependency and latency
- Slug algorithm is Latin-centric

### Sample interview Q&A

**Q: How would you finish “add book”?**  
A: Implement `createBookAction` with Zod-parsed `FormData`, `uploadFile` for cover and PDF, resolve/create author and categories, call `createBook`, revalidate `/admin/books`, redirect. Enforce `requireAdmin()` first.

**Q: How do you prevent non-admins from hitting `/admin`?**  
A: Middleware or admin layout checks `getOrCreateUser()` role; server actions repeat the check (never trust the client alone). Optionally use Clerk public metadata for role and mirror to DB.

**Q: Why both webhook and getOrCreateUser?**  
A: Webhooks can fail or be delayed locally; lazy sync makes first authenticated request self-healing. Webhook still needed for delete and for creating users before first page hit.

**Q: How would you support EPUB/audio?**  
A: Schema already has `book_format` enum and `book_files`. Extend uploader accept types, store one row per format, and build format-specific readers later.

**Q: SEO for two languages?**  
A: Current cookie approach is weaker for SEO. A future `/[locale]/...` segment with `hreflang` would be the upgrade path while reusing the same message files.

---

## 17. Suggested first tasks

Ordered for onboarding momentum:

1. **Run the app** with Clerk + Neon; create a user; set `role = 'admin'` in SQL; confirm redirect to `/admin/books`.
2. **Fix `createBookAction`** and wire `BookForm` submit (largest learning surface: RHF, Zod, Pinata, Drizzle).
3. **Load authors/categories from DB** into the form selects; seed a few rows.
4. **Build admin books table** with real `db.query.books` data.
5. **Add `requireAdmin`** in `app/admin/layout.tsx` and all mutations.
6. **Implement edit/delete** using the `[slug]` route.
7. **Member catalog page** replacing landing “Featured Books” static content.
8. Harden **slugify** for Persian (e.g. transliteration or allow Unicode slugs).
9. Fix **migrate script** to use `&&` and align `book_files` migration types with schema.
10. Handle Clerk **`user.updated`** in the webhook.

---

## 18. Troubleshooting

| Symptom                                       | Likely cause                           | What to try                                                                                |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| App crashes on load mentioning `DATABASE_URL` | Missing env or DB down                 | Set `.env.local`; verify Neon project                                                      |
| Infinite redirect / sign-in loop              | Clerk keys or middleware matcher       | Confirm publishable/secret keys; check `proxy.ts` public routes                            |
| Webhook 400/401                               | Bad signing secret or raw body issues  | Re-copy `CLERK_WEBHOOK_SECRET`; ensure route reads `req.text()` (already does)             |
| User missing in DB after sign-up              | Webhook not reaching app               | Use tunnel; or hit any protected page to trigger `getOrCreateUser`                         |
| Cannot open admin as expected                 | Still `member` role                    | `UPDATE users SET role = 'admin' WHERE email = '...'`                                      |
| Image broken from Pinata                      | Gateway not in `images.remotePatterns` | Match hostname in `next.config.ts`                                                         |
| Upload fails                                  | Missing `PINATA_JWT` / gateway         | Verify Pinata credentials and `uploadFile` server-only usage                               |
| Wrong language or LTR/RTL                     | Cookie not set / stale tab             | Use locale switcher; check `locale` cookie; hard refresh                                   |
| PWA weirdness in dev                          | Expected                               | `next-pwa` is disabled in development                                                      |
| `migrate` does nothing useful                 | `&` backgrounds commands               | Run `npx drizzle-kit generate && npx drizzle-kit migrate && npx drizzle-kit push` manually |
| Types/build errors on book form               | Zod 4 `z.file` / RHF versions          | Align with locked `package-lock.json`; run `npm run build`                                 |

---

## Appendix A — Key file index

| Concern            | File                                        |
| ------------------ | ------------------------------------------- |
| Entry layout       | `app/layout.tsx`                            |
| Landing            | `app/(site)/page.tsx`                       |
| Auth pages         | `app/(auth)/login/...`, `sign-up/...`       |
| Middleware         | `proxy.ts`                                  |
| User sync          | `utils/auth.ts`                             |
| Clerk webhook      | `app/api/webhooks/clerk/route.ts`           |
| Schema             | `db/schema.ts`                              |
| DB client          | `db/index.ts`                               |
| Create book        | `db/books.ts`                               |
| Book form          | `app/admin/books/_components/book-form.tsx` |
| Book Zod schema    | `lib/validators/book.schema.ts`             |
| Server action stub | `app/admin/books/actions.ts`                |
| Pinata             | `utils/config-files.ts`                     |
| i18n config        | `i18n/request.ts`                           |
| Messages           | `messages/en.json`, `messages/fa.json`      |
| Routes             | `constants/routes.ts`                       |
| Next config        | `next.config.ts`                            |

## Appendix B — Role promotion (dev)

```sql
SELECT id, email, role FROM users;

UPDATE users
SET role = 'admin'
WHERE email = 'you@example.com';
```

Sign out/in or reload so `getOrCreateUser` and server components see the new role.

---

## Appendix C — Mental model one-liner

**Clerk authenticates people; Postgres authorizes and stores the library; Pinata stores bytes; next-intl speaks two languages; the admin form is the unfinished bridge between UI and the catalog domain.**

When you can explain that sentence and point to the files in Appendix A, you are onboarded.
