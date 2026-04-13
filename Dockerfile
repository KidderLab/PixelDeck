FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y ffmpeg sqlite3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile=false && pnpm prisma:generate && pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
