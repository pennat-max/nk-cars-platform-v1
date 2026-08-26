CREATE TABLE `buying_browser_case_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`old_value_json` text NOT NULL,
	`new_value_json` text NOT NULL,
	`evidence_note` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_buying_browser_case_audit_case_created` ON `buying_browser_case_audit_events` (`workspace_user_id`,`case_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_buying_browser_case_audit_actor_created` ON `buying_browser_case_audit_events` (`actor_user_id`,`created_at`);