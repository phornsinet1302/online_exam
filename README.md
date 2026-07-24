# Online Exam Project

This project has two parts:

- `backend`: Express + TypeScript API with Prisma, Supabase auth, and Swagger docs.
- `frontend`: Next.js app for the exam platform UI.

## Requirements

- Node.js 18+ or 20+
- `pnpm`
- PostgreSQL database for Prisma
- Supabase project credentials for backend auth
- Docker and Docker Compose if you want to run the backend container

## Backend

Go to the backend folder:

```bash
cd backend
pnpm install
```

Create a `.env` file with these values:

```env
PORT=5000
DATABASE_URL=your_postgres_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Run the database setup and start the server locally:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm dev
```

Production commands:

```bash
pnpm build
pnpm start
```

Backend API docs are available at `http://localhost:5000/api-docs`.

### Backend with Docker

The backend also has a Dockerfile and a compose file. Use this if you want to run and test the API in a container instead of locally.

1. Create `backend/.env` with the same variables shown above.
2. From the `backend` folder, run:

```bash
docker compose up --build
```

3. Open `http://localhost:5000/api-docs` after the container starts.

You can use either local `pnpm dev` or `docker compose up --build` for the backend. Docker is optional, not required.

## Frontend

Go to the frontend folder:

```bash
cd frontend
pnpm install
```

Start the app:

```bash
pnpm dev
```

Production commands:

```bash
pnpm build
pnpm start
```

## Testing

Automated test scripts are not set up yet in this repo.

- Backend: use `pnpm build` to verify TypeScript compiles, then test endpoints from Swagger UI or Postman. For runtime checks, use either `pnpm dev` locally or `docker compose up --build` in Docker.
- Frontend: use `pnpm lint` and `pnpm build` to catch code and build issues.
- Manual check: open the frontend in the browser and confirm it can reach the backend API.

## Quick Run Order

1. Start PostgreSQL and fill in the backend `.env` file.
2. Run backend migrations with `pnpm exec prisma migrate dev`.
3. Start the backend with either `pnpm dev` or `docker compose up --build`.
4. Start the frontend with `pnpm dev`.
5. Open the frontend in the browser and verify the workflow end to end.