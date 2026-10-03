import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getRequiredEnv } from "@/lib/env";
import * as schema from "@/lib/schema";

const databaseUrl = getRequiredEnv("DATABASE_URL", (value) => {
  let protocol: string;

  try {
    protocol = new URL(value).protocol;
  } catch {
    throw new Error(
      "Invalid DATABASE_URL: expected a valid postgres connection URL.",
    );
  }

  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    throw new Error(
      "Invalid DATABASE_URL: expected protocol postgres:// or postgresql://.",
    );
  }
});

const client = neon(databaseUrl);

export const db = drizzle(client, { schema });
