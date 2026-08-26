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

export const buyingBrowserCaseAuditEvents = sqliteTable("buying_browser_case_audit_events", {
  id: text("id").primaryKey(),
  workspaceUserId: text("workspace_user_id").notNull(),
  caseId: text("case_id").notNull(),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  oldValueJson: text("old_value_json").notNull(),
  newValueJson: text("new_value_json").notNull(),
  evidenceNote: text("evidence_note").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_buying_browser_case_audit_case_created").on(table.workspaceUserId, table.caseId, table.createdAt),
  index("idx_buying_browser_case_audit_actor_created").on(table.actorUserId, table.createdAt),
]);
