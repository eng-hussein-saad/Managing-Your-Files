import { spawnSync } from "node:child_process";

const commands = [
  ["pnpm", ["lint"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["test"]],
  ["pnpm", ["test:security"]],
  ["pnpm", ["audit:comments"]],
  ["pnpm", ["build"]],
];

/** Runs one quality command with inherited output and fail-fast status. */
function run(command, args) {
  const useCurrentPnpm = command === "pnpm" && process.env.npm_execpath;
  const executable = useCurrentPnpm
    ? process.execPath
    : process.platform === "win32"
      ? `${command}.cmd`
      : command;
  const effectiveArgs = useCurrentPnpm
    ? [process.env.npm_execpath, ...args]
    : args;
  const result = spawnSync(executable, effectiveArgs, {
    stdio: "inherit",
    shell: false,
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** Runs the risk-based critical suite three consecutive times. */
function runCriticalTriple() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL must identify a disposable local test database.");
    process.exit(1);
  }
  const parsedDatabaseUrl = new URL(databaseUrl);
  const databaseName = parsedDatabaseUrl.pathname.slice(1).toLowerCase();
  if (
    !["localhost", "127.0.0.1"].includes(parsedDatabaseUrl.hostname) ||
    !databaseName.includes("test")
  ) {
    console.error("Critical triple-run refuses to reset a non-local or non-test database.");
    process.exit(1);
  }
  for (let runNumber = 1; runNumber <= 3; runNumber += 1) {
    console.info(`Critical suite run ${runNumber}/3`);
    run("pnpm", ["--filter", "@gold-era/server", "prisma:migrate:reset"]);
    run("pnpm", ["test"]);
    run("pnpm", ["test:integration"]);
    run("pnpm", ["test:security"]);
  }
}

if (process.argv.includes("--critical-triple")) runCriticalTriple();
else for (const [command, args] of commands) run(command, args);
