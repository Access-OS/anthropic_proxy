import { text, jsonb, pgTable } from "drizzle-orm/pg-core";

export const request = pgTable("request", {
  id: text("id").primaryKey(),
  resp: jsonb("reps"),
});
