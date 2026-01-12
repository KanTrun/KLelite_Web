# DuAnCaNhan - Personal Projects Repository

This repository contains personal software projects.

## Projects

### KL'elite Luxury Bakery

Premium e-commerce platform for a luxury bakery business.

- **Frontend:** React 18 + TypeScript + Vite + Redux Toolkit
- **Backend:** Node.js + Express + MySQL + Prisma + JWT
- **Location:** `klelite-luxury-bakery/`

[View Project README](./klelite-luxury-bakery/README.md)

## Quick Start

### Prerequisites

- Node.js >= 18.x
- MySQL >= 8.x (local or cloud)
- npm or yarn

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd DuAnCaNhan

# Start Backend (Terminal 1)
cd klelite-luxury-bakery/backend
npm install
cp .env.example .env   # Configure environment
npx ts-node src/server.ts

# Start Frontend (Terminal 2)
cd klelite-luxury-bakery/frontend
npm install
npm run dev
```

### Docker Setup

```bash
cd klelite-luxury-bakery
docker-compose up
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MySQL: localhost:3306
- Redis: localhost:6379

### Database Seeding

```bash
cd klelite-luxury-bakery/backend
# Run Prisma migrations first
npx prisma migrate dev
# Then seed the database
npx prisma db seed
```

Test credentials:
- Admin: admin@klelite.com / admin123
- User: user@test.com / user123

## Documentation

Detailed documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [Project Overview](./docs/project-overview-pdr.md) | Goals, features, requirements |
| [Codebase Summary](./docs/codebase-summary.md) | Directory structure, key files |
| [Code Standards](./docs/code-standards.md) | Naming conventions, patterns |
| [System Architecture](./docs/system-architecture.md) | Components, data flow, API |

## Project Structure

```
DuAnCaNhan/
├── .claude/                 # Claude Code configuration
├── .github/                 # GitHub workflows
├── .shared/                 # Shared resources (UI/UX guidelines)
├── docs/                    # Project documentation
├── klelite-luxury-bakery/   # Main e-commerce project
│   ├── backend/             # Express API
│   ├── frontend/            # React SPA
│   └── docker-compose.yml
├── plans/                   # Development plans
└── README.md
```

## Development

### Commands

```bash
# Backend
cd klelite-luxury-bakery/backend
npm run dev          # Development server
npm run build        # Build for production
npm run test         # Run tests

# Frontend
cd klelite-luxury-bakery/frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
```

### Deployment

- **Frontend:** Deployed to Vercel (see `vercel.json`)
- **Backend:** Deploy to Render, Railway, or similar
- **Database:** MySQL (PlanetScale, AWS RDS, or similar)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, SCSS Modules |
| Backend | Node.js, Express, TypeScript, Prisma, JWT, Cloudinary, Stripe |
| Database | MySQL, Prisma ORM, Redis |
| DevOps | Docker, Vercel, GitHub Actions |

## License

ISC License
