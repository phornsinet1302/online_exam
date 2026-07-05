# backend/Dockerfile

FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install dependencies without running scripts (prisma generate will run later)
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Generate Prisma client (this runs the script we skipped)
RUN pnpm prisma generate

RUN pnpm build

FROM node:22-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/app.js"]