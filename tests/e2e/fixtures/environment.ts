export const environments = {
  local: {
    appOrigin: "http://localhost:3000",
    apiOrigin: "http://localhost:3001",
  },
  productionLike: {
    appOrigin: "http://127.0.0.1:3000",
    apiOrigin: "http://127.0.0.1:3001",
  },
} as const;
