import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

type CommandResult = {
  output: string;
  status: number | null;
};

const run = (command: string, args: string[], env: NodeJS.ProcessEnv): CommandResult => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env,
    shell: false,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const output = `${stdout}\n${stderr}`.trim();

  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }

  return { status: result.status, output };
};

const assertSuccess = (result: CommandResult, command: string, args: string[]) => {
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
};

const isKnownInitialMigrationFailure = (output: string): boolean => {
  const normalized = output.toLowerCase();
  return (
    normalized.includes('p3018') &&
    (normalized.includes('error code: 1146') || normalized.includes("doesn't exist"))
  );
};

const createTempSchemaWithDatabaseUrl = (databaseUrl: string): string => {
  const sourceSchemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  const tempSchemaPath = path.resolve(process.cwd(), 'prisma/schema.render.prisma');
  const sourceSchema = fs.readFileSync(sourceSchemaPath, 'utf8');
  const escapedDatabaseUrl = databaseUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const lines = sourceSchema.split(/\r?\n/);

  const datasourceStart = lines.findIndex((line) => /^\s*datasource\s+db\s*\{/.test(line));
  if (datasourceStart === -1) {
    throw new Error('Failed to locate `datasource db` in prisma/schema.prisma.');
  }

  let datasourceEnd = -1;
  let datasourceUrlLine = -1;
  for (let i = datasourceStart + 1; i < lines.length; i += 1) {
    if (datasourceEnd === -1 && /^\s*}/.test(lines[i])) {
      datasourceEnd = i;
      break;
    }
    if (datasourceUrlLine === -1 && /^\s*url\s*=/.test(lines[i])) {
      datasourceUrlLine = i;
    }
  }

  if (datasourceEnd === -1) {
    throw new Error('Failed to parse datasource block in prisma/schema.prisma.');
  }

  const replacementLine = `  url      = "${escapedDatabaseUrl}"`;
  if (datasourceUrlLine >= 0) {
    lines[datasourceUrlLine] = replacementLine;
  } else {
    lines.splice(datasourceEnd, 0, replacementLine);
  }

  const patchedSchema = lines.join('\n');
  fs.writeFileSync(tempSchemaPath, patchedSchema, 'utf8');
  return tempSchemaPath;
};

const prepareProductionDb = () => {
  const resolvedDatabaseUrl = getDatabaseUrl();
  const env = { ...process.env, DATABASE_URL: resolvedDatabaseUrl };
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const tempSchemaPath = createTempSchemaWithDatabaseUrl(resolvedDatabaseUrl);

  const dbHost = (() => {
    try {
      return new URL(resolvedDatabaseUrl).host;
    } catch {
      return 'unknown-host';
    }
  })();

  console.log(`Preparing production database via ${dbHost}`);

  try {
    const migrateResult = run(npxCommand, ['prisma', 'migrate', 'deploy', '--schema', tempSchemaPath], env);
    if (migrateResult.status !== 0) {
      if (isKnownInitialMigrationFailure(migrateResult.output)) {
        console.warn('Migration baseline mismatch detected, continuing with prisma db push.');
      } else {
        assertSuccess(migrateResult, npxCommand, ['prisma', 'migrate', 'deploy', '--schema', tempSchemaPath]);
      }
    }

    const dbPushResult = run(npxCommand, ['prisma', 'db', 'push', '--schema', tempSchemaPath], env);
    assertSuccess(dbPushResult, npxCommand, ['prisma', 'db', 'push', '--schema', tempSchemaPath]);

    const seedResult = run('node', ['dist/scripts/seed-if-empty.js'], env);
    assertSuccess(seedResult, 'node', ['dist/scripts/seed-if-empty.js']);
  } finally {
    if (fs.existsSync(tempSchemaPath)) {
      fs.unlinkSync(tempSchemaPath);
    }
  }
};

if (require.main === module) {
  prepareProductionDb();
}

export default prepareProductionDb;
