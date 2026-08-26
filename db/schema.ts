import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const buyingBrowserWorkspaces = sqliteTable("buying_browser_workspaces", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  stateJson: text("state_json").notNull(),
  revision: integer("revision").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const buyingBrowserWorkspaceEvents = sqliteTable("buying_browser_workspace_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  revision: integer("revision").notNull(),
  eventType: text("event_type").notNull(),
  summaryJson: text("summary_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_buying_browser_workspace_events_user_revision").on(table.userId, table.revision),
  index("idx_buying_browser_workspace_events_user_created").on(table.userId, table.createdAt),
]);
