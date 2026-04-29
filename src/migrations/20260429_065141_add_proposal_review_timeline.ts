import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'enum_proposals_review_timeline_status'
      ) THEN
        CREATE TYPE "public"."enum_proposals_review_timeline_status" AS ENUM(
          'pending',
          'reviewing',
          'approved',
          'rejected'
        );
      END IF;
    END
    $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "proposals_review_timeline" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "actor_name" varchar NOT NULL,
      "actor_role" varchar NOT NULL,
      "occurred_at" timestamp(3) with time zone NOT NULL,
      "status" "public"."enum_proposals_review_timeline_status" NOT NULL,
      "notes" varchar NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'proposals_review_timeline_parent_id_fk'
      ) THEN
        ALTER TABLE "proposals_review_timeline"
          ADD CONSTRAINT "proposals_review_timeline_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."proposals"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END
    $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "proposals_review_timeline_order_idx"
      ON "proposals_review_timeline" USING btree ("_parent_id", "_order");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "proposals_review_timeline_order_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "proposals_review_timeline"
      DROP CONSTRAINT IF EXISTS "proposals_review_timeline_parent_id_fk";
  `)

  await db.execute(sql`
    DROP TABLE IF EXISTS "proposals_review_timeline";
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE atttypid = 'public.enum_proposals_review_timeline_status'::regtype
          AND attnum > 0
          AND NOT attisdropped
      ) THEN
        DROP TYPE IF EXISTS "public"."enum_proposals_review_timeline_status";
      END IF;
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END
    $$;
  `)
}
