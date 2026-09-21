# Ketabio

Ketabio is a bilingual digital-library web application built with Next.js. It combines a
public landing experience with authenticated member features and an admin area for managing
books.

The project currently includes Clerk authentication, English/Persian localization (static UI via
`next-intl`, dynamic content via database translation tables), RTL and dark-mode support, a
PostgreSQL domain model through Drizzle ORM, Pinata file-storage helpers, PWA configuration, and
an admin book workflow.

## Quick start

Requirements: Node.js 20.9 or newer, npm, a PostgreSQL/Neon database, and a Clerk application.

```bash
npm install
npm run migrate   # generate + apply migrations (never `push` on a database with data)
npm run seed      # optional bilingual sample catalog
npm run dev
```

Open <http://localhost:3000>.

The application expects these environment variables:

```dotenv
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
PINATA_JWT=
NEXT_PUBLIC_GATEWAY_URL=
```

Never commit real credentials. See the detailed guide for service setup, database migrations,
architecture, current limitations, and troubleshooting.

## Documentation

- [Project onboarding and interview guide](docs/ONBOARDING_GUIDE.md)
- [Multilingual dynamic content](docs/I18N.md)
- [Error handling](docs/ERROR_HANDLING.md)

## Commands

| Command                | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the development server                              |
| `npm run build`        | Create and type-check a production build                  |
| `npm run start`        | Run the production build                                  |
| `npm run lint`         | Run ESLint                                                |
| `npm run typecheck`    | Run `tsc --noEmit`                                        |
| `npm test`             | Run the test suite (PostgreSQL via PGlite)                |
| `npm run format`       | Format the repository with Prettier                       |
| `npm run migrate`      | Generate and apply Drizzle database changes               |
| `npm run migrate:push` | Push the schema directly — empty/throwaway databases only |
| `npm run seed`         | Load a bilingual sample catalog                           |

## Current status

Ketabio is under active development. The landing page, authentication, localization, theme,
multilingual database schema, and the admin book workflow (create, localized list with search and
pagination, edit, delete) are present. Public catalog pages, author management, and several
member-library features are not complete yet.
