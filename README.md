# Ketabio

Ketabio is a bilingual digital-library web application built with Next.js. It combines a
public landing experience with authenticated member features and an admin area for managing
books.

The project currently includes Clerk authentication, English/Persian localization, RTL and
dark-mode support, a PostgreSQL domain model through Drizzle ORM, Pinata file-storage helpers,
PWA configuration, and an in-progress admin book workflow.

## Quick start

Requirements: Node.js 20.9 or newer, npm, a PostgreSQL/Neon database, and a Clerk application.

```bash
npm install
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

- [Project onboarding and interview guide](docs/ONBOARDING_AND_INTERVIEW_GUIDE.md)

## Commands

| Command           | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the development server                |
| `npm run build`   | Create and type-check a production build    |
| `npm run start`   | Run the production build                    |
| `npm run lint`    | Run ESLint                                  |
| `npm run format`  | Format the repository with Prettier         |
| `npm run migrate` | Generate and apply Drizzle database changes |

## Current status

Ketabio is under active development. The landing page, authentication, localization, theme,
database schema, and admin book form UI are present. Book submission, catalog rendering, edit
flows, and several member-library features are not complete yet.
