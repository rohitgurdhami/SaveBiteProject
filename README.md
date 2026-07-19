# SaveBite - Food Waste Reduction Platform

A comprehensive web application for managing food inventory, tracking expiry dates, and facilitating food donations within communities to reduce food waste.

## Features

- **Food Inventory Management** — track items with expiry dates, categories, storage locations, and fresh/expiring/expired status.
- **Food Donation System** — browse available donations, request items, manage pending/completed requests.
- **Meal Planning** — plan weekly meals around what's expiring soon.
- **Analytics & Insights** — waste-reduction progress, category breakdowns, weekly trends.
- **Notifications** — expiry alerts, donation request updates, meal reminders.
- **User Management** — email/password auth with OTP verification, password reset, and profile management.

## Tech Stack

### Frontend (`frontend/`)
- **Framework**: Next.js (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: lucide-react
- **Data fetching**: currently a self-contained mock client (`frontend/services/api.ts`); swap for a real HTTP client (e.g. axios/fetch against the backend) when ready

### Backend (`backend/`)
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript
- **Database**: MySQL 8.0 (raw SQL via `mysql2`, connection pooling)
- **Authentication**: JWT (access + refresh tokens) with bcrypt password hashing
- **Validation**: Zod schemas (`backend/src/validations`)

### Infrastructure
- Docker & Docker Compose (MySQL, backend, frontend, Redis)

## Project Structure

```
save-bite/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── (public)/            # login, register, forgot-password, verify-otp, landing page
│   │   └── (dashboard)/         # dashboard, inventory, donations, meal-planner, analytics, ...
│   ├── components/              # common, layout, ui, inventory, donation, analytics, notifications
│   ├── hooks/, context/, services/, lib/, types/, utils/, public/
│   └── package.json, tsconfig.json
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── config/               # DB pool, JWT config
│   │   ├── controllers/          # Request handlers (auth, inventory, donations, ...)
│   │   ├── routes/               # Route wiring only
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access (extends BaseRepository)
│   │   ├── middleware/           # authenticateToken, optionalAuth
│   │   ├── validations/          # Zod schemas
│   │   ├── dto/                  # Request/response type aliases
│   │   ├── database/             # schema.sql + init script
│   │   ├── uploads/, cron/       # reserved for file uploads / scheduled jobs
│   │   ├── app.ts                # Express app (no listen)
│   │   └── server.ts             # Entry point (listens on PORT)
│   ├── tests/
│   └── package.json, tsconfig.json
│
├── database/                    # Canonical schema.sql, seed.sql, migrations/
├── docs/                        # API_Documentation.md, ERD/, Wireframes/
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm

### Installation

1. Clone the repository and install each workspace's dependencies:
```bash
git clone https://github.com/savebite/savebite.git
cd save-bite

cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

2. Set up environment files:
```bash
cp backend/.env.example backend/.env
# frontend/.env.local is optional today — the frontend currently uses an
# in-browser mock API client (frontend/services/api.ts), not the backend.
```

3. Create the database and load the schema:
```bash
mysql -u root -p -e "CREATE DATABASE savebite;"
mysql -u root -p savebite < database/schema.sql
mysql -u root -p savebite < database/seed.sql   # optional sample data
```

4. Run each app in development:
```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Docker Compose

```bash
docker compose up --build
```

Spins up MySQL, the backend API, the frontend, and Redis together (see `docker-compose.yml`).

## API Documentation

See [`docs/API_Documentation.md`](./docs/API_Documentation.md) for the full endpoint reference (auth, inventory, donations, donation requests, notifications).

> Note: the frontend does not currently call this API — it runs entirely
> against an in-memory/localStorage mock (`frontend/services/api.ts`) for
> demo purposes. Pointing it at the real backend is a natural next step.

## Testing

```bash
cd backend
npm test
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT License (no `LICENSE` file was included in the original project upload — add one if you intend to distribute this publicly)

---

**Made with  for a sustainable future**
