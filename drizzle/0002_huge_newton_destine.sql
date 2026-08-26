CREATE TABLE `buying_browser_document_sequences` (
	`sequence_key` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`year` integer NOT NULL,
	`last_number` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_buying_browser_document_sequence_type_year` ON `buying_browser_document_sequences` (`document_type`,`year`);