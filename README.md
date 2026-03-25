# speakeasy-be

Express REST API backend for Speakeasy.

## Stack

- Node.js + Express v5
- TypeScript
- Prisma ORM
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- ESLint

## Prerequisites

- Node.js
- A PostgreSQL database (or whichever DB your Prisma schema targets)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your database connection string and JWT secret:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/speakeasy
   JWT_SECRET=your-secret-here
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

## Running

```bash
npm run dev
```

Starts the server with hot-reload via `ts-node-dev`.

## Other commands

```bash
npm run build       # Compile TypeScript to dist/
npm start           # Run compiled output (production)
npm run ts:check    # TypeScript type check
npm run lint:check  # ESLint
```
