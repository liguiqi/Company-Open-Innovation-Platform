import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "last_access_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "users_last_access_at_idx"
      ON "users" USING btree ("last_access_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "users_last_access_at_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "last_access_at";
  `)
}
