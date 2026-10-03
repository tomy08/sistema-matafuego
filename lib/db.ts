import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "******localhost:5432/placeholder";

const client = neon(databaseUrl);

export const db = drizzle(client, { schema });
