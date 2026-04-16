import { spawnSync } from 'child_process';

const getDatabaseUrl = (): string => {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.MYSQL_PUBLIC_URL,
    process.env.MYSQL_URL,
    process.env.DATABASE_PUBLIC_URL,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    throw new Error(
      'Missing database URL. Set one of: DATABASE_URL, MYSQL_PUBLIC_URL, MYSQL_URL, DATABASE_PUBLIC_URL.',
    );
  }

  const databaseUrl = candidates[0];
  if (process.env.NODE_ENV === 'production' && /(localhost|127\.0\.0\.1)/i.test(databaseUrl)) {
    throw new Error(`Invalid production database URL: ${databaseUrl}`);
  }

  return databaseUrl;
};

const run = (command: string, args: string[], env: NodeJS.ProcessEnv): void => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
};

const prepareProductionDb = () => {
  const resolvedDatabaseUrl = getDatabaseUrl();
  const env = { ...process.env, DATABASE_URL: resolvedDatabaseUrl };
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  const dbHost = (() => {
    try {
      return new URL(resolvedDatabaseUrl).host;
    } catch {
      return 'unknown-host';
    }
  })();

  console.log(`Preparing production database via ${dbHost}`);

  run(npxCommand, ['prisma', 'migrate', 'deploy'], env);
  run(npxCommand, ['prisma', 'db', 'push'], env);
  run('node', ['dist/scripts/seed-if-empty.js'], env);
};

if (require.main === module) {
  prepareProductionDb();
}

export default prepareProductionDb;
