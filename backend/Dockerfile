# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY docker-entrypoint.sh ./

ENV NODE_ENV=production
EXPOSE 5000

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
