FROM node:24.7.0-bookworm-slim AS build
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN pnpm install --frozen-lockfile --filter @gold-era/server...
COPY packages/contracts/src packages/contracts/src
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.build.json packages/contracts/
COPY packages/typescript-config/tsconfig.json packages/typescript-config/tsconfig.json
COPY server/src server/src
COPY server/prisma server/prisma
COPY server/tsconfig.json server/tsconfig.build.json server/prisma.config.ts server/
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN pnpm --filter @gold-era/contracts build && pnpm --filter @gold-era/server prisma:generate && pnpm --filter @gold-era/server build
RUN pnpm --filter @gold-era/server deploy --prod --legacy /prod/server
RUN cd /prod/server && /workspace/server/node_modules/.bin/prisma generate
RUN pnpm --filter @gold-era/server deploy --legacy /prod/migrate
RUN cd /prod/migrate && ./node_modules/.bin/prisma generate

FROM node:24.7.0-bookworm-slim AS migrate
ENV NODE_ENV=production
WORKDIR /workspace/server
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /prod/migrate ./
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:24.7.0-bookworm-slim AS server
ENV NODE_ENV=production
WORKDIR /workspace/server
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /prod/server ./
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
