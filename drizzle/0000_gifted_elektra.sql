CREATE TABLE `buying_browser_workspace_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`revision` integer NOT NULL,
	`event_type` text NOT NULL,
	`summary_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_buying_browser_workspace_events_user_revision` ON `buying_browser_workspace_events` (`user_id`,`revision`);--> statement-breakpoint
CREATE INDEX `idx_buying_browser_workspace_events_user_created` ON `buying_browser_workspace_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `buying_browser_workspaces` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`state_json` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
