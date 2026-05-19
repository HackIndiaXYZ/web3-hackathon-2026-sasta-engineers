# ChainCred Backend

Blockchain-based credential verification platform backend built with NestJS.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 15.x or higher
- Redis 7.x or higher
- Docker & Docker Compose (optional, for local development)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables.

### 3. Start Database Services (using Docker)

```bash
# From the app/ directory
docker-compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/v1/docs

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run lint` - Lint the code
- `npm run format` - Format the code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Health check endpoints
├── app.service.ts          # Application service
│
├── config/                 # Configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── blockchain.config.ts
│   ├── storage.config.ts
│   └── email.config.ts
│
├── prisma/                 # Prisma ORM
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── common/                 # Shared utilities
│   ├── filters/
│   ├── interceptors/
│   ├── guards/
│   ├── pipes/
│   └── decorators/
│
└── modules/                # Feature modules (to be added)
    ├── auth/
    ├── users/
    ├── issuers/
    ├── credentials/
    ├── verification/
    ├── blockchain/
    ├── storage/
    ├── queue/
    ├── notifications/
    ├── analytics/
    └── admin/
```

## Database

### Migrations

Create a new migration:
```bash
npm run prisma:migrate -- --name migration_name
```

Apply migrations:
```bash
npm run prisma:migrate
```

### Prisma Studio

Open Prisma Studio to view and edit data:
```bash
npm run prisma:studio
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3001/api/v1/docs

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT secret key
- `ALCHEMY_API_KEY` - Alchemy API key for blockchain
- `AWS_ACCESS_KEY_ID` - AWS access key for S3

## Testing

Run tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run e2e tests:
```bash
npm run test:e2e
```

## Deployment

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm run start:prod
```

## License

MIT
