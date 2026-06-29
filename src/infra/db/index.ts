import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import type { DatabaseSchema } from "./schema";

export function createDbClient(db: D1Database) {
  return new Kysely<DatabaseSchema>({
    dialect: new D1Dialect({
      database: db,
    }),
  });
}

export type DbClient = ReturnType<typeof createDbClient>;