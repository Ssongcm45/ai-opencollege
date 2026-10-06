// Read-only preflight against the configured database. Never log connection details or row data.
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const { neon } = require('@neondatabase/serverless');
const { getTableConfig } = require('drizzle-orm/pg-core');
const { getTableColumns, sql: drizzleSql } = require('drizzle-orm');

const root = path.resolve(__dirname, '..');
loadEnvConfig(root, false);
require('tsx/cjs/api').register();
const schema = require('../lib/db/schema.ts');
const { getDb } = require('../lib/db/index.ts');

const env = {
  databaseUrl: Boolean(process.env.DATABASE_URL),
  adminSessionSecretValid: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  adminEmail: Boolean(process.env.ADMIN_EMAIL?.trim()),
  siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
  adminSetupToken: Boolean(process.env.ADMIN_SETUP_TOKEN?.trim()),
  resendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
  openrouterApiKey: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
};

function expectedType(column) {
  const type = column.getSQLType().toLowerCase();
  if (type.startsWith('varchar(')) return { udt: 'varchar', length: Number(type.slice(8, -1)) };
  return { udt: ({ integer: 'int4', real: 'float4', 'double precision': 'float8', boolean: 'bool', 'timestamp with time zone': 'timestamptz' })[type] ?? type };
}

function failure(error, category) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9]{2,8}$/i.test(error.code)
    ? error.code : 'unknown';
  console.error(JSON.stringify({ ok: false, category, code }));
  process.exitCode = 1;
}

async function main() {
  console.log(JSON.stringify({ environment: env }));
  if (!env.databaseUrl || !env.adminSessionSecretValid) {
    console.error(JSON.stringify({ ok: false, category: 'required_environment_missing_or_invalid',
      fields: [!env.databaseUrl && 'DATABASE_URL', !env.adminSessionSecretValid && 'ADMIN_SESSION_SECRET'].filter(Boolean) }));
    process.exitCode = 1;
    return;
  }

  const tables = Object.values(schema).filter((value) => {
    try { return getTableConfig(value).name !== undefined; } catch { return false; }
  });
  const expected = new Map(tables.map((table) => [getTableConfig(table).name, getTableColumns(table)]));
  let sql;
  try { sql = neon(process.env.DATABASE_URL); }
  catch (error) { failure(error, 'database_url_invalid'); return; }

  try {
    // Exercise the same getDb() path used by the application.
    await getDb().execute(drizzleSql`select 1`);
  } catch (error) { failure(error, 'database_connection'); return; }

  let rows;
  try {
    [rows] = await sql.transaction([
      sql`select table_name, column_name, udt_name, is_nullable, character_maximum_length
          from information_schema.columns where table_schema = 'public'`,
    ], { readOnly: true });
  } catch (error) { failure(error, 'schema_query'); return; }

  const actual = new Map();
  for (const row of rows) {
    if (!actual.has(row.table_name)) actual.set(row.table_name, new Map());
    actual.get(row.table_name).set(row.column_name, row);
  }
  const missingTables = [];
  const missingColumns = [];
  const mismatchedColumns = [];
  const compatibleWarnings = [];
  for (const [tableName, columns] of expected) {
    const table = actual.get(tableName);
    if (!table) { missingTables.push(tableName); continue; }
    for (const column of Object.values(columns)) {
      const live = table.get(column.name);
      if (!live) { missingColumns.push(`${tableName}.${column.name}`); continue; }
      const type = expectedType(column);
      const difference = { column: `${tableName}.${column.name}`,
        expectedType: type.udt, actualType: live.udt_name,
        expectedNotNull: column.notNull, actualNotNull: live.is_nullable === 'NO' };
      if (type.udt === 'float4' && live.udt_name === 'float8' &&
          (!column.notNull || live.is_nullable === 'NO')) {
        compatibleWarnings.push(difference);
      } else if (live.udt_name !== type.udt ||
                 (type.length !== undefined && Number(live.character_maximum_length) !== type.length) ||
                 (column.notNull && live.is_nullable !== 'NO')) {
        mismatchedColumns.push(difference);
      }
    }
  }
  console.log(JSON.stringify({ schema: {
    expectedTables: expected.size,
    missingTables, missingColumns, mismatchedColumns, compatibleWarnings,
  } }));
  if (missingTables.length || missingColumns.length) {
    process.exitCode = 1;
    return;
  }
  if (mismatchedColumns.length) process.exitCode = 1;

  try {
    const [blog, cases, portfolio, admin] = await sql.transaction([
      sql`select count(*)::int as count from public.blog_posts where published = true`,
      sql`select count(*)::int as count from public.field_cases where published = true`,
      sql`select count(*)::int as count from public.portfolio_items where published = true`,
      sql`select coalesce(bool_or(password_hash is not null and length(password_hash) > 0), false) as password_hash_exists,
                 coalesce(bool_or(session_version >= 1), false) as session_version_valid
          from public.admin_config where id = 1`,
    ], { readOnly: true });
    console.log(JSON.stringify({ ok: mismatchedColumns.length === 0, connection: true,
      published: { blogPosts: blog[0].count, fieldCases: cases[0].count, portfolioItems: portfolio[0].count },
      adminConfig: { passwordHashExists: admin[0].password_hash_exists,
        sessionVersionValid: admin[0].session_version_valid },
    }));
  } catch (error) { failure(error, 'content_query'); }
}

main().catch((error) => failure(error, 'preflight'));
