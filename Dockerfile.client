FROM node:24.7.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN pnpm install --frozen-lockfile --filter @gold-era/client...
COPY packages/contracts/src packages/contracts/src
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.build.json packages/contracts/
COPY packages/typescript-config/tsconfig.json packages/typescript-config/tsconfig.json
COPY client/src client/src
COPY client/next-env.d.ts client/next.config.ts client/postcss.config.mjs client/tsconfig.json client/
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm --filter @gold-era/contracts build && pnpm --filter @gold-era/client build

FROM node:24.7.0-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /workspace
COPY --from=build --chown=node:node /workspace/client/.next/standalone ./
COPY --from=build --chown=node:node /workspace/client/.next/static ./client/.next/static
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
