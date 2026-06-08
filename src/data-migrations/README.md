# Data Migrations

Data migrations are one-off scripts that run automatically on deploy, exactly once, to backfill or transform existing data. They complement schema migrations (managed by Drizzle) and follow the same pattern: files are discovered by the runner, applied in order, and recorded in the `data_migrations` table so they never run again.

## How it works

On every deploy the `migrate` service runs:

```
node dist/scripts/migrate.js && node dist/scripts/run-data-migrations.js
```

The runner:

1. Reads all `.js` files in `dist/data-migrations/`, sorted by filename
2. Queries the `data_migrations` table for already-applied names
3. Runs each unapplied file's `up()` function in order
4. Records the filename in `data_migrations` on success

If a migration throws, it is not recorded and will be retried on the next deploy.

## Adding a new data migration

Create a file in `src/data-migrations/` named `YYYYMMDD_short_description.ts`:

```typescript
// src/data-migrations/20260615_backfill_something.ts
import { db } from "../db";
import { myTable } from "../db/schema";

export async function up(): Promise<void> {
  // your one-off data work here
}
```

That's it. On the next deploy the runner picks it up and applies it.

**Naming rules:**

- Start with a date prefix (`YYYYMMDD`) so files sort in application order
- Use `snake_case` after the date
- Be descriptive — the filename becomes the permanent audit record in the `data_migrations` table

## Running locally

```bash
npm run build
node dist/scripts/run-data-migrations.js
```

The runner is safe to re-run at any time — applied migrations are skipped.

## Guidelines

- **Keep `up()` idempotent where possible.** The runner prevents double-runs, but an idempotent script is safer if you ever need to re-run it manually.
- **One concern per file.** Don't combine unrelated backfills; separate files are easier to reason about and retry independently.
- **No rollback function required.** These are data patches, not reversible schema changes. If you need to undo something, write a new migration.
- **Test against a copy of production data before deploying** if the migration touches a large or critical table.
